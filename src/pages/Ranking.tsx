import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { supabaseService } from "../services/supabaseService";
import { api } from "../services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Star, Eye } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
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
      
      // Get most popular series data
      // First, collect all watched series from all users
      let allWatchedSeries: {seriesId: number, rating: number}[] = [];
      
      for (const profile of profiles) {
        try {
          const userWatched = await supabaseService.getWatchedSeries(profile.id);
          
          // Add each show to the collection
          for (const show of userWatched) {
            allWatchedSeries.push({
              seriesId: show.seriesId,
              rating: show.rating || 0
            });
          }
        } catch (error) {
          console.error(`Error fetching watched shows for user ${profile.id}:`, error);
        }
      }
      
      // Get unique series IDs
      const uniqueSeriesIds = [...new Set(allWatchedSeries.map(item => item.seriesId))];
      
      // For each unique series, calculate stats
      const seriesWithStats = await Promise.all(
        uniqueSeriesIds.map(async (seriesId) => {
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
              avgRating,
              watchCount: entries.length
            };
          } catch (error) {
            console.error(`Error fetching series details for ${seriesId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by watch count
      const validSeries = seriesWithStats.filter(Boolean) as {
        id: number;
        name: string;
        posterPath: string;
        avgRating: number;
        watchCount: number;
      }[];
      
      // Sort by watch count (descending)
      const sortedSeries = validSeries.sort((a, b) => b.watchCount - a.watchCount);
      
      // Take top 5
      setTopSeries(sortedSeries.slice(0, 5));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching ranking data:", error);
      setLoading(false);
    }
  };
  
  return (
    <div className="app-container pb-20">
      <Header title="Ranking" />
      
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
          {/* Top Users Section */}
          <section className="mb-8">
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
          </section>
          
          {/* Popular Series Section */}
          <section>
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
          </section>
        </>
      )}
      
      <BottomNav />
    </div>
  );
};

export default Ranking;
