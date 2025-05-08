
import React, { useState, useEffect } from "react";
import { Star, Eye, UserPlus, List, TrendingUp, Users } from "lucide-react";
import Header from "../components/Header";
import SeriesCard from "../components/SeriesCard";
import { api } from "../services/api";
import { Series } from "../types/Series";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "../components/BottomNav";
import { supabaseService } from "../services/supabaseService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSeriesData {
  userId: string;
  userName: string;
  profilePic: string | null;
  seriesCount: number;
  averageRating: number;
  seriesList: {
    id: number;
    title: string;
    poster_path: string | null;
    rating: number | null;
  }[];
}

interface AggregatedSeriesData {
  id: number;
  title: string;
  poster_path: string | null;
  watchCount: number;
  averageRating: number;
  ratings: number[];
  usersWhoWatched: {
    userId: string;
    userName: string;
    profilePic: string | null;
    rating: number | null;
  }[];
}

const Ranking: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [userRankings, setUserRankings] = useState<any[]>([]);
  const [userSeriesData, setUserSeriesData] = useState<UserSeriesData[]>([]);
  const [aggregatedSeries, setAggregatedSeries] = useState<AggregatedSeriesData[]>([]);
  const [watchlistSeries, setWatchlistSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("most-watched");

  // Function to load all user series data and aggregate them
  const loadAllUserSeries = async () => {
    setLoading(true);
    try {
      // Fetch all user profiles
      const profiles = await supabaseService.getAllProfiles();
      
      // Fetch series watched by each user
      const usersWithSeriesData: UserSeriesData[] = await Promise.all(
        profiles.map(async (profile) => {
          const watchedShows = await supabaseService.getWatchedSeries(profile.id);
          
          // Get details for each series watched
          const seriesWithDetails = await Promise.all(
            watchedShows.map(async (show) => {
              try {
                const seriesDetails = await api.getSeriesById(parseInt(show.tmdb_id));
                return {
                  id: parseInt(show.tmdb_id),
                  title: seriesDetails?.name || `Série ${show.tmdb_id}`,
                  poster_path: seriesDetails?.poster_path,
                  rating: show.rating
                };
              } catch (error) {
                console.error(`Error fetching details for series ${show.tmdb_id}:`, error);
                return {
                  id: parseInt(show.tmdb_id),
                  title: `Série ${show.tmdb_id}`,
                  poster_path: null,
                  rating: show.rating
                };
              }
            })
          );
          
          // Calculate average rating
          const validRatings = watchedShows.filter(show => show.rating !== null);
          const averageRating = validRatings.length > 0 
            ? validRatings.reduce((sum, show) => sum + (show.rating || 0), 0) / validRatings.length 
            : 0;
          
          return {
            userId: profile.id,
            userName: profile.name || "Usuário",
            profilePic: profile.profile_pic,
            seriesCount: watchedShows.length,
            averageRating: parseFloat(averageRating.toFixed(1)),
            seriesList: seriesWithDetails.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          };
        })
      );
      
      // Sort users by number of series watched
      setUserSeriesData(usersWithSeriesData.sort((a, b) => b.seriesCount - a.seriesCount));

      // Aggregate all series data across users
      const allSeriesMap = new Map<number, AggregatedSeriesData>();

      usersWithSeriesData.forEach(userData => {
        userData.seriesList.forEach(series => {
          if (!allSeriesMap.has(series.id)) {
            allSeriesMap.set(series.id, {
              id: series.id,
              title: series.title,
              poster_path: series.poster_path,
              watchCount: 0,
              averageRating: 0,
              ratings: [],
              usersWhoWatched: []
            });
          }

          const seriesData = allSeriesMap.get(series.id)!;
          seriesData.watchCount += 1;
          
          if (series.rating !== null) {
            seriesData.ratings.push(series.rating);
          }

          seriesData.usersWhoWatched.push({
            userId: userData.userId,
            userName: userData.userName,
            profilePic: userData.profilePic,
            rating: series.rating
          });
        });
      });

      // Calculate average ratings
      const aggregatedSeriesList = Array.from(allSeriesMap.values()).map(series => {
        const validRatings = series.ratings.filter(r => r !== null);
        const avgRating = validRatings.length > 0 
          ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
          : 0;

        return {
          ...series,
          averageRating: parseFloat(avgRating.toFixed(1))
        };
      });

      setAggregatedSeries(aggregatedSeriesList);

      // Set most watched series for the most-watched tab
      if (activeFilter === "most-watched") {
        const mostWatchedSeries = [...aggregatedSeriesList]
          .sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, 20);
        
        // Convert to Series type for the SeriesCard component
        const seriesList: Series[] = mostWatchedSeries.map(item => ({
          id: item.id,
          name: item.title,
          poster_path: item.poster_path,
          vote_average: item.averageRating * 2, // Convert 5-star scale to 10-star scale
          vote_count: item.watchCount,
          overview: `Assistido por ${item.watchCount} usuários`,
          first_air_date: "",
          // Add other required Series properties
          backdrop_path: null,
          genre_ids: [],
          origin_country: [],
          original_language: "",
          original_name: "",
          popularity: item.watchCount
        }));
        
        setSeries(seriesList);
      }
      
      // Set best rated series for the best-rated tab
      if (activeFilter === "best-rated") {
        const bestRatedSeries = [...aggregatedSeriesList]
          .filter(series => series.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 20);
          
        const seriesList: Series[] = bestRatedSeries.map(item => ({
          id: item.id,
          name: item.title,
          poster_path: item.poster_path,
          vote_average: item.averageRating * 2, // Convert 5-star scale to 10-star scale
          vote_count: item.watchCount,
          overview: `Avaliação média: ${item.averageRating}/5`,
          first_air_date: "",
          // Add other required Series properties
          backdrop_path: null,
          genre_ids: [],
          origin_country: [],
          original_language: "",
          original_name: "",
          popularity: item.averageRating * 20 // Convert rating to popularity scale
        }));
        
        setSeries(seriesList);
      }

    } catch (error) {
      console.error("Error loading all user series:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load watchlist series data
  const loadWatchlistSeries = async () => {
    setLoading(true);
    try {
      // Fetch all user profiles
      const profiles = await supabaseService.getAllProfiles();
      
      // Fetch watchlists for each user and count occurrences of each series
      const allWatchlistItems: { userId: string, userName: string, profilePic: string | null, series: any }[] = [];
      const seriesCountMap = new Map<number, number>();
      
      await Promise.all(
        profiles.map(async (profile) => {
          const watchlist = await supabaseService.getWatchlist(profile.id);
          
          await Promise.all(
            watchlist.map(async (item) => {
              try {
                const seriesId = parseInt(item.tmdb_id);
                const seriesDetails = await api.getSeriesById(seriesId);
                
                // Count occurrences
                seriesCountMap.set(seriesId, (seriesCountMap.get(seriesId) || 0) + 1);
                
                allWatchlistItems.push({
                  userId: profile.id,
                  userName: profile.name || "Usuário",
                  profilePic: profile.profile_pic,
                  series: {
                    id: seriesId,
                    title: seriesDetails?.name || `Série ${seriesId}`,
                    poster_path: seriesDetails?.poster_path,
                    note: item.note,
                    popularity: seriesCountMap.get(seriesId) || 1
                  }
                });
              } catch (error) {
                console.error(`Error fetching details for watchlist item ${item.tmdb_id}:`, error);
              }
            })
          );
        })
      );
      
      // Group by series ID and count users who have it in watchlist
      const watchlistSeriesMap = new Map<number, any>();
      
      allWatchlistItems.forEach(item => {
        const seriesId = item.series.id;
        
        if (!watchlistSeriesMap.has(seriesId)) {
          watchlistSeriesMap.set(seriesId, {
            ...item.series,
            users: []
          });
        }
        
        const seriesData = watchlistSeriesMap.get(seriesId)!;
        seriesData.users.push({
          userId: item.userId,
          userName: item.userName,
          profilePic: item.profilePic,
          note: item.series.note
        });
      });
      
      // Convert to array and sort by popularity (number of users who added it)
      const watchlistSeriesArray = Array.from(watchlistSeriesMap.values())
        .map(series => ({
          ...series,
          userCount: series.users.length
        }))
        .sort((a, b) => b.userCount - a.userCount);
      
      setWatchlistSeries(watchlistSeriesArray);

      if (activeFilter === "lists") {
        const seriesList: Series[] = watchlistSeriesArray.map(item => ({
          id: item.id,
          name: item.title,
          poster_path: item.poster_path,
          vote_average: 0,
          vote_count: item.userCount,
          overview: `Na lista de ${item.userCount} usuários`,
          first_air_date: "",
          // Add other required Series properties
          backdrop_path: null,
          genre_ids: [],
          origin_country: [],
          original_language: "",
          original_name: "",
          popularity: item.userCount * 10
        }));
        
        setSeries(seriesList);
      }
      
    } catch (error) {
      console.error("Error loading watchlist series:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRankings = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const profiles = await supabaseService.getAllProfiles();
      
      // Get watched series stats for each user
      const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const watchedShows = await supabaseService.getWatchedSeries(profile.id);
          const validRatings = watchedShows.filter(show => show.rating);
          const averageRating = validRatings.length > 0
            ? validRatings.reduce((sum, show) => sum + (show.rating || 0), 0) / validRatings.length
            : 0;
          
          return {
            id: profile.id,
            name: profile.name || "Usuário",
            profilePic: profile.profile_pic,
            watchedCount: watchedShows.length,
            averageRating: parseFloat(averageRating.toFixed(1)),
            highestRated: [...watchedShows].sort((a, b) => 
              (b.rating || 0) - (a.rating || 0))[0]?.tmdb_id || null
          };
        })
      );
      
      // Sort users by number of series watched
      setUserRankings(usersWithStats.sort((a, b) => b.watchedCount - a.watchedCount));
    } catch (error) {
      console.error("Error loading user rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveFilter(value);
    
    if (value === "most-watched") {
      // Load most watched series from aggregated data
      if (aggregatedSeries.length === 0) {
        loadAllUserSeries();
      } else {
        const mostWatchedSeries = [...aggregatedSeries]
          .sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, 20);
          
        const seriesList: Series[] = mostWatchedSeries.map(item => ({
          id: item.id,
          name: item.title,
          poster_path: item.poster_path,
          vote_average: item.averageRating * 2,
          vote_count: item.watchCount,
          overview: `Assistido por ${item.watchCount} usuários`,
          first_air_date: "",
          backdrop_path: null,
          genre_ids: [],
          origin_country: [],
          original_language: "",
          original_name: "",
          popularity: item.watchCount
        }));
        
        setSeries(seriesList);
      }
    } 
    else if (value === "best-rated") {
      // Load best rated series from aggregated data
      if (aggregatedSeries.length === 0) {
        loadAllUserSeries();
      } else {
        const bestRatedSeries = [...aggregatedSeries]
          .filter(series => series.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 20);
          
        const seriesList: Series[] = bestRatedSeries.map(item => ({
          id: item.id,
          name: item.title,
          poster_path: item.poster_path,
          vote_average: item.averageRating * 2,
          vote_count: item.watchCount,
          overview: `Avaliação média: ${item.averageRating}/5`,
          first_air_date: "",
          backdrop_path: null,
          genre_ids: [],
          origin_country: [],
          original_language: "",
          original_name: "",
          popularity: item.averageRating * 20
        }));
        
        setSeries(seriesList);
      }
    }
    else if (value === "users") {
      loadUserRankings();
    }
    else if (value === "lists") {
      loadWatchlistSeries();
    }
    else if (value === "all-series") {
      loadAllUserSeries();
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    loadAllUserSeries();
  }, []);

  return (
    <div className="app-container pb-20">
      <Header title="Ranking" showSearchButton />
      
      <Tabs defaultValue="most-watched" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="most-watched" className="flex flex-col items-center text-xs py-2">
            <Eye size={18} className="mb-1" />
            <span>Mais Vistas</span>
          </TabsTrigger>
          <TabsTrigger value="best-rated" className="flex flex-col items-center text-xs py-2">
            <Star size={18} className="mb-1" />
            <span>Melhores</span>
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex flex-col items-center text-xs py-2">
            <List size={18} className="mb-1" />
            <span>Listas</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex flex-col items-center text-xs py-2">
            <Users size={18} className="mb-1" />
            <span>Amigos</span>
          </TabsTrigger>
          <TabsTrigger value="all-series" className="flex flex-col items-center text-xs py-2">
            <TrendingUp size={18} className="mb-1" />
            <span>Todas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="most-watched" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="best-rated" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="lists" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="users" className="mt-0">
          {renderUserRankings()}
        </TabsContent>
        <TabsContent value="all-series" className="mt-0">
          {renderAllSeriesStats()}
        </TabsContent>
      </Tabs>
      
      <BottomNav />
    </div>
  );
  
  function renderSeriesList() {
    if (loading) {
      return (
        <div className="animate-pulse grid grid-cols-2 gap-4 mt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-muted rounded-lg h-64"></div>
          ))}
        </div>
      );
    }
    
    if (series.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma série encontrada para este filtro.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-2">
        {series.map(item => (
          <SeriesCard 
            key={item.id} 
            series={item}
            showRating={activeFilter === "best-rated"}
          />
        ))}
      </div>
    );
  }
  
  function renderUserRankings() {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted h-16 rounded-lg"></div>
          ))}
        </div>
      );
    }
    
    if (userRankings.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Pos.</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Séries</TableHead>
              <TableHead className="text-right">Nota Média</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRankings.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-bold">{index + 1}</TableCell>
                <TableCell>
                  <Link to={`/profile/${user.id}`} className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                      {user.profilePic ? (
                        <AvatarImage src={user.profilePic} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{user.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right">{user.watchedCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <Star size={16} className="text-yellow-500 fill-yellow-500 mr-1" />
                    <span>{user.averageRating}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  function renderAllSeriesStats() {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted h-16 rounded-lg"></div>
          ))}
        </div>
      );
    }
    
    const mostWatchedSeries = [...aggregatedSeries].sort((a, b) => b.watchCount - a.watchCount);
    const bestRatedSeries = [...aggregatedSeries].filter(series => series.averageRating > 0).sort((a, b) => b.averageRating - a.averageRating);
    
    return (
      <div className="space-y-8">
        {/* Séries mais assistidas por todos os usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2" size={18} />
              Séries mais assistidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {mostWatchedSeries.slice(0, 8).map(series => (
                <Link to={`/series/${series.id}`} key={series.id} className="block">
                  <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                    {series.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${series.poster_path}`} 
                        alt={series.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-center p-2">
                        <span>{series.title}</span>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {series.watchCount}
                    </div>
                    {series.averageRating > 0 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white rounded-full px-2 py-1 flex items-center justify-center text-xs">
                        <Star size={12} className="text-yellow-500 fill-yellow-500 mr-1" />
                        {series.averageRating}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">{series.title}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Séries melhor avaliadas por todos os usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2" size={18} />
              Séries melhor avaliadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {bestRatedSeries.slice(0, 8).map(series => (
                <Link to={`/series/${series.id}`} key={series.id} className="block">
                  <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                    {series.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${series.poster_path}`} 
                        alt={series.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-center p-2">
                        <span>{series.title}</span>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full px-2 py-1 flex items-center justify-center text-xs font-bold">
                      <Star size={12} className="fill-white mr-1" />
                      {series.averageRating}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white rounded-full px-2 py-1 flex items-center justify-center text-xs">
                      {series.watchCount} usuários
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">{series.title}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários e suas séries */}
        <div className="space-y-8 mt-4">
          {userSeriesData.map(userData => (
            <div key={userData.userId} className="bg-white rounded-lg shadow overflow-hidden p-4">
              <Link to={`/profile/${userData.userId}`} className="flex items-center mb-4">
                <Avatar className="w-10 h-10 mr-3">
                  {userData.profilePic ? (
                    <AvatarImage src={userData.profilePic} alt={userData.userName} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {userData.userName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{userData.userName}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="mr-3">{userData.seriesCount} séries</span>
                    <div className="flex items-center">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                      <span>{userData.averageRating}</span>
                    </div>
                  </div>
                </div>
              </Link>
              
              {userData.seriesList.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {userData.seriesList.map(series => (
                    <Link to={`/series/${series.id}`} key={series.id} className="block">
                      <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                        {series.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${series.poster_path}`} 
                            alt={series.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-center p-2">
                            <span>{series.title}</span>
                          </div>
                        )}
                        {series.rating !== null && (
                          <div className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {series.rating}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Este usuário ainda não assistiu nenhuma série.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default Ranking;
