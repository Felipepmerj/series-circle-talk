
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { supabaseService } from "../services/supabaseService";
import { api } from "../services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Star, Eye, Calendar, List, Users } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface RankingEntry {
  userId: string;
  username: string;
  profilePic?: string;
  showsWatched: number;
  avgRating: number;
  position?: number;
}

interface UserSeriesInfo {
  seriesId: number;
  seriesName: string;
  rating: number;
  posterPath: string;
}

const Ranking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<RankingEntry[]>([]);
  const [topSeries, setTopSeries] = useState<{id: number, name: string, avgRating: number, posterPath: string, watchCount: number}[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<{id: number, name: string, avgRating: number, posterPath: string, watchCount: number}[]>([]);
  const [mostWantedSeries, setMostWantedSeries] = useState<{id: number, name: string, posterPath: string, wantCount: number}[]>([]);
  const [recentSeries, setRecentSeries] = useState<{id: number, name: string, posterPath: string, releaseDate: string, watchCount: number}[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("best");
  const { user } = useAuth();
  
  useEffect(() => {
    fetchRankingData();
  }, []);
  
  const fetchRankingData = async () => {
    try {
      setLoading(true);
      
      // Get all user profiles
      const profiles = await supabaseService.getAllProfiles();
      
      // For each user, get their watched shows and calculate statistics
      const usersData = await Promise.all(
        profiles.map(async (profile) => {
          // Get watched shows for this user
          const watchedShows = await supabaseService.getWatchedSeries(profile.id);
          
          // Calculate average rating
          const ratings = watchedShows.filter(show => show.rating).map(show => show.rating);
          const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + (rating || 0), 0) / ratings.length
            : 0;
          
          return {
            userId: profile.id,
            username: profile.name || "Usuário",
            profilePic: profile.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || profile.id}`,
            showsWatched: watchedShows.length,
            avgRating: avgRating
          };
        })
      );
      
      // Sort users by shows watched (descending)
      const sortedByWatched = [...usersData].sort((a, b) => b.showsWatched - a.showsWatched);
      
      // Add position property
      const rankedUsers = sortedByWatched.map((user, index) => ({
        ...user,
        position: index + 1
      }));
      
      setRanking(rankedUsers);
      
      // Set top 3 users
      setTopUsers(rankedUsers.slice(0, 3));
      
      // Find current user's position
      if (user) {
        const currentUserRank = rankedUsers.findIndex(rank => rank.userId === user.id);
        if (currentUserRank !== -1) {
          setUserPosition(currentUserRank + 1);
        }
      }
      
      // Get all watched series data and watchlist data from all users
      let allWatchedSeries: {seriesId: number, rating: number, timestamp: string}[] = [];
      let allWatchlistSeries: {seriesId: number}[] = [];
      
      for (const profile of profiles) {
        try {
          const userWatched = await supabaseService.getWatchedSeries(profile.id);
          const userWatchlist = await supabaseService.getWatchlist(profile.id);
          
          // Add each watched show to the collection
          for (const show of userWatched) {
            allWatchedSeries.push({
              seriesId: show.seriesId,
              rating: show.rating || 0,
              timestamp: show.timestamp
            });
          }
          
          // Add each watchlist item to the collection
          for (const item of userWatchlist) {
            allWatchlistSeries.push({
              seriesId: item.seriesId
            });
          }
        } catch (error) {
          console.error(`Error fetching data for user ${profile.id}:`, error);
        }
      }
      
      // Get unique series IDs for watched shows
      const uniqueWatchedIds = [...new Set(allWatchedSeries.map(item => item.seriesId))];
      
      // For each unique series, calculate stats for most watched
      const seriesWithStats = await Promise.all(
        uniqueWatchedIds.map(async (seriesId) => {
          // Get all entries for this series
          const entries = allWatchedSeries.filter(item => item.seriesId === seriesId);
          
          // Get average rating
          const seriesRatings = entries.map(entry => entry.rating).filter(rating => rating > 0);
          const avgRating = seriesRatings.length > 0
            ? seriesRatings.reduce((sum, rating) => sum + rating, 0) / seriesRatings.length
            : 0;
            
          // Get series details from API
          try {
            const seriesDetails = await api.getSeriesById(seriesId);
            
            return {
              id: seriesId,
              name: seriesDetails?.name || "Unknown Series",
              posterPath: seriesDetails?.poster_path || "",
              firstAirDate: seriesDetails?.first_air_date || "",
              avgRating,
              watchCount: entries.length
            };
          } catch (error) {
            console.error(`Error fetching series details for ${seriesId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls
      const validSeries = seriesWithStats.filter(Boolean) as {
        id: number;
        name: string;
        posterPath: string;
        firstAirDate: string;
        avgRating: number;
        watchCount: number;
      }[];
      
      // Sort by watch count (descending) for most watched
      const sortedByWatchCount = [...validSeries].sort((a, b) => b.watchCount - a.watchCount);
      setTopSeries(sortedByWatchCount);
      
      // Sort by rating (descending) for best rated
      const sortedByRating = [...validSeries].sort((a, b) => b.avgRating - a.avgRating);
      setTopRatedSeries(sortedByRating);
      
      // Get unique series IDs for watchlist items
      const uniqueWatchlistIds = [...new Set(allWatchlistSeries.map(item => item.seriesId))];
      
      // Get most wanted series (most added to watchlists)
      const watchlistSeriesWithStats = await Promise.all(
        uniqueWatchlistIds.map(async (seriesId) => {
          // Count occurrences of this series in watchlists
          const wantCount = allWatchlistSeries.filter(item => item.seriesId === seriesId).length;
          
          // Get series details from API
          try {
            const seriesDetails = await api.getSeriesById(seriesId);
            
            return {
              id: seriesId,
              name: seriesDetails?.name || "Unknown Series",
              posterPath: seriesDetails?.poster_path || "",
              wantCount
            };
          } catch (error) {
            console.error(`Error fetching series details for ${seriesId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by want count
      const validWatchlistSeries = watchlistSeriesWithStats.filter(Boolean) as {
        id: number;
        name: string;
        posterPath: string;
        wantCount: number;
      }[];
      
      const sortedByWantCount = validWatchlistSeries.sort((a, b) => b.wantCount - a.wantCount);
      setMostWantedSeries(sortedByWantCount);
      
      // Sort by release date (newest first) for recent releases
      const sortedByReleaseDate = [...validSeries]
        .sort((a, b) => {
          if (!a.firstAirDate) return 1;
          if (!b.firstAirDate) return -1;
          return new Date(b.firstAirDate).getTime() - new Date(a.firstAirDate).getTime();
        })
        .map(item => ({
          id: item.id,
          name: item.name,
          posterPath: item.posterPath,
          releaseDate: item.firstAirDate,
          watchCount: item.watchCount
        }));
      
      setRecentSeries(sortedByReleaseDate);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching ranking data:", error);
      setLoading(false);
    }
  };
  
  return (
    <div className="app-container pb-20">
      <Header title="Ranking" />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-4">
          <TabsTrigger value="best" className="text-xs">
            <Star className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Melhores</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Popular</span>
          </TabsTrigger>
          <TabsTrigger value="wanted" className="text-xs">
            <List className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Querem assistir</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="text-xs">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Lançamentos</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            <Users className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
        </TabsList>
      
        {loading ? (
          <div className="space-y-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="flex justify-center space-x-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <div className="rounded-full bg-muted h-16 w-16"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <div className="h-4 bg-muted rounded w-4"></div>
                    <div className="rounded-full bg-muted h-10 w-10"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="ml-auto h-4 bg-muted rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="best" className="mt-0">
              <h2 className="text-lg font-bold text-center mb-4">
                <Star className="inline-block mr-2 text-yellow-500" size={20} />
                Séries melhor avaliadas
              </h2>
              
              <div className="rounded-lg bg-card p-4 shadow-sm">
                {topRatedSeries.map((series) => (
                  <Link 
                    to={`/series/${series.id}`}
                    key={series.id} 
                    className="flex items-center py-2 border-b last:border-0"
                  >
                    <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                      {series.posterPath ? (
                        <img 
                          src={api.getImageUrl(series.posterPath, "w92")} 
                          alt={series.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-sm">{series.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-xs mr-3">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span>{series.avgRating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{series.watchCount} usuário{series.watchCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="popular" className="mt-0">
              <h2 className="text-lg font-bold text-center mb-4">
                <TrendingUp className="inline-block mr-2 text-primary" size={20} />
                Séries mais assistidas
              </h2>
              
              <div className="rounded-lg bg-card p-4 shadow-sm">
                {topSeries.map((series) => (
                  <Link 
                    to={`/series/${series.id}`}
                    key={series.id} 
                    className="flex items-center py-2 border-b last:border-0"
                  >
                    <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                      {series.posterPath ? (
                        <img 
                          src={api.getImageUrl(series.posterPath, "w92")} 
                          alt={series.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-sm">{series.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-xs mr-3">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{series.watchCount}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span>{series.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="wanted" className="mt-0">
              <h2 className="text-lg font-bold text-center mb-4">
                <List className="inline-block mr-2 text-blue-500" size={20} />
                Séries mais desejadas
              </h2>
              
              <div className="rounded-lg bg-card p-4 shadow-sm">
                {mostWantedSeries.map((series) => (
                  <Link 
                    to={`/series/${series.id}`}
                    key={series.id} 
                    className="flex items-center py-2 border-b last:border-0"
                  >
                    <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                      {series.posterPath ? (
                        <img 
                          src={api.getImageUrl(series.posterPath, "w92")} 
                          alt={series.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-sm">{series.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-xs">
                          <List className="h-3 w-3 text-blue-500 mr-1" />
                          <span>{series.wantCount} pessoas querem assistir</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0">
              <h2 className="text-lg font-bold text-center mb-4">
                <Calendar className="inline-block mr-2 text-green-500" size={20} />
                Lançamentos recentes
              </h2>
              
              <div className="rounded-lg bg-card p-4 shadow-sm">
                {recentSeries.map((series) => (
                  <Link 
                    to={`/series/${series.id}`}
                    key={series.id} 
                    className="flex items-center py-2 border-b last:border-0"
                  >
                    <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                      {series.posterPath ? (
                        <img 
                          src={api.getImageUrl(series.posterPath, "w92")} 
                          alt={series.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-sm">{series.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center text-xs mr-3">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(series.releaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{series.watchCount}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
              <h2 className="text-lg font-bold text-center mb-4">
                <Award className="inline-block mr-2 text-yellow-500" size={20} />
                Usuários mais ativos
              </h2>
              
              <div className="flex justify-center items-end space-x-4 sm:space-x-8 mb-6">
                {topUsers.map((user, index) => {
                  // Calculate circle size and position based on rank
                  const sizes = ["h-16 w-16", "h-20 w-20", "h-16 w-16"];
                  const positions = ["self-end", "self-start", "self-end"];
                  const colors = ["bg-bronze", "bg-gold", "bg-silver"];
                  const numbers = ["3", "1", "2"];
                  const translateY = ["", "-translate-y-4", ""];
                  
                  // Reorder for display: 2nd, 1st, 3rd
                  const displayIndex = index === 0 ? 1 : index === 1 ? 0 : 2;
                  
                  return (
                    <div 
                      key={user.userId} 
                      className={`flex flex-col items-center ${positions[displayIndex]} ${translateY[displayIndex]}`}
                    >
                      <div className="relative mb-2">
                        <Link to={`/profile/${user.userId}`}>
                          <Avatar className={`${sizes[displayIndex]} border-2 ${colors[displayIndex]}`}>
                            <AvatarImage src={user.profilePic} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {numbers[displayIndex]}
                          </div>
                        </Link>
                      </div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.showsWatched} séries
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Rest of users */}
              <div className="rounded-lg bg-card p-4 shadow-sm">
                <div className="text-sm font-medium pb-2 border-b flex">
                  <span className="w-10 text-center">#</span>
                  <span className="flex-1">Usuário</span>
                  <span className="w-20 text-center">Séries</span>
                  <span className="w-20 text-center">Média</span>
                </div>
                
                <div className="divide-y">
                  {(showAllUsers ? ranking : ranking.slice(3, 8)).map((entry) => (
                    <Link
                      to={`/profile/${entry.userId}`}
                      key={entry.userId}
                      className={`flex items-center py-2 hover:bg-muted/50 ${
                        user?.id === entry.userId ? "bg-muted/30" : ""
                      }`}
                    >
                      <span className="w-10 text-center font-medium">{entry.position}</span>
                      <span className="flex-1 flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={entry.profilePic} />
                          <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {entry.username}
                      </span>
                      <span className="w-20 text-center">{entry.showsWatched}</span>
                      <span className="w-20 text-center flex items-center justify-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        {entry.avgRating.toFixed(1)}
                      </span>
                    </Link>
                  ))}
                </div>
                
                {ranking.length > 8 && (
                  <button
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="w-full mt-2 text-sm text-primary hover:text-primary/80"
                  >
                    {showAllUsers ? "Mostrar menos" : "Ver todos"}
                  </button>
                )}
                
                {user && userPosition && userPosition > 8 && !showAllUsers && (
                  <div className="mt-2 border-t pt-2">
                    <Link
                      to={`/profile/${user.id}`}
                      className="flex items-center py-2 hover:bg-muted/50 bg-muted/30"
                    >
                      <span className="w-10 text-center font-medium">{userPosition}</span>
                      <span className="flex-1 flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={ranking.find(r => r.userId === user.id)?.profilePic} />
                          <AvatarFallback>{user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        Você
                      </span>
                      <span className="w-20 text-center">
                        {ranking.find(r => r.userId === user.id)?.showsWatched || 0}
                      </span>
                      <span className="w-20 text-center flex items-center justify-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        {(ranking.find(r => r.userId === user.id)?.avgRating || 0).toFixed(1)}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
      
      <BottomNav />
    </div>
  );
};

export default Ranking;
