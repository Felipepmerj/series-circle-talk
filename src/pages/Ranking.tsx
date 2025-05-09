import React, { useState, useEffect } from "react";
import { Star, Eye, List, Grid, Heart, BookmarkIcon } from "lucide-react";
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
  const [userSeriesData, setUserSeriesData] = useState<any[]>([]);
  const [aggregatedSeries, setAggregatedSeries] = useState<any[]>([]);
  const [watchlistSeries, setWatchlistSeries] = useState<any[]>([]);
  const [interestSeries, setInterestSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("most-watched");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
                const seriesDetails = await api.getSeriesById(parseInt(show.series_id.toString()));
                return {
                  id: parseInt(show.series_id.toString()),
                  title: seriesDetails?.name || `Série ${show.series_id}`,
                  poster_path: seriesDetails?.poster_path,
                  rating: show.rating
                };
              } catch (error) {
                console.error(`Error fetching details for series ${show.series_id}:`, error);
                return {
                  id: parseInt(show.series_id.toString()),
                  title: `Série ${show.series_id}`,
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
      
      // Update series lists based on the active filter
      updateSeriesList(aggregatedSeriesList, activeFilter);

    } catch (error) {
      console.error("Error loading all user series:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update the series list based on active filter
  const updateSeriesList = (aggregatedSeriesList: AggregatedSeriesData[], filter: string) => {
    if (filter === "most-watched") {
      const mostWatchedSeries = [...aggregatedSeriesList]
        .sort((a, b) => b.watchCount - a.watchCount)
        .slice(0, 20);
      
      const seriesList: Series[] = mostWatchedSeries.map(item => ({
        id: item.id,
        name: item.title,
        poster_path: item.poster_path,
        vote_average: item.averageRating * 2, // Convert 5-star scale to 10-star scale
        overview: `Assistido por ${item.watchCount} usuários`,
        first_air_date: "",
        backdrop_path: null,
        genres: [], // Add empty genres array to satisfy the type
      }));
      
      setSeries(seriesList);
    } 
    else if (filter === "best-rated") {
      const bestRatedSeries = [...aggregatedSeriesList]
        .filter(series => series.averageRating > 0)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 20);
        
      const seriesList: Series[] = bestRatedSeries.map(item => ({
        id: item.id,
        name: item.title,
        poster_path: item.poster_path,
        vote_average: item.averageRating * 2,
        overview: `Avaliação média: ${item.averageRating}/5`,
        first_air_date: "",
        backdrop_path: null,
        genres: [], // Add empty genres array
      }));
      
      setSeries(seriesList);
    }
  };

  // Load watchlist series data - completely rewritten to fix the issue
  const loadWatchlistSeries = async () => {
    setLoading(true);
    try {
      // Get all watchlist items directly from Supabase
      const watchlistItems = await supabaseService.getAllWatchlistItems();
      
      // Group watchlist items by series ID and count how many users added each series
      const seriesCountMap = new Map<number, { count: number, seriesData: any, users: any[] }>();
      
      // Process all watchlist items
      for (const item of watchlistItems) {
        const seriesId = parseInt(item.tmdb_id);
        
        if (!seriesCountMap.has(seriesId)) {
          try {
            // Fetch series details from API
            const seriesDetails = await api.getSeriesById(seriesId);
            
            // Get user who added this item
            const userProfile = await supabaseService.getUserProfile(item.user_id);
            
            seriesCountMap.set(seriesId, {
              count: 1,
              seriesData: {
                id: seriesId,
                name: seriesDetails?.name || `Série ${seriesId}`,
                poster_path: seriesDetails?.poster_path,
                overview: seriesDetails?.overview,
              },
              users: [{
                id: item.user_id,
                name: userProfile?.name || "Usuário",
                profilePic: userProfile?.profile_pic,
                notes: item.note
              }]
            });
          } catch (error) {
            console.error(`Error fetching details for series ${seriesId}:`, error);
          }
        } else {
          // Series already in map, increment count and add user
          const entry = seriesCountMap.get(seriesId)!;
          entry.count += 1;
          
          // Add user to the users array if not already present
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          entry.users.push({
            id: item.user_id,
            name: userProfile?.name || "Usuário",
            profilePic: userProfile?.profile_pic,
            notes: item.note
          });
        }
      }
      
      // Convert map to array and sort by number of users
      const sortedWatchlistSeries = Array.from(seriesCountMap.values())
        .sort((a, b) => b.count - a.count)
        .map(item => ({
          ...item.seriesData,
          userCount: item.count,
          users: item.users
        }));
      
      setWatchlistSeries(sortedWatchlistSeries);
      
      // Update the series list if the active filter is "watchlist"
      if (activeFilter === "watchlist") {
        const seriesList: Series[] = sortedWatchlistSeries.map(item => ({
          id: item.id,
          name: item.name,
          poster_path: item.poster_path,
          vote_average: 0,
          overview: `Na lista de ${item.userCount} usuários`,
          first_air_date: "",
          backdrop_path: null,
          genres: [] // Add empty genres array to satisfy the type
        }));
        
        setSeries(seriesList);
      }
    } catch (error) {
      console.error("Error loading watchlist series:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to load watchlist items for new "Lista de Interesses" tab
  const loadInterestList = async () => {
    setLoading(true);
    try {
      // Get all watchlist items directly from Supabase
      const watchlistItems = await supabaseService.getAllWatchlistItems();
      
      // Process each watchlist item to get series details
      const seriesDetailsPromises = watchlistItems.map(async (item) => {
        try {
          const seriesId = parseInt(item.tmdb_id);
          const seriesDetails = await api.getSeriesById(seriesId);
          
          // Get the user who added this item to their watchlist
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          
          return {
            id: seriesId,
            name: seriesDetails?.name || `Série ${seriesId}`,
            poster_path: seriesDetails?.poster_path,
            note: item.note,
            user: {
              id: item.user_id,
              name: userProfile?.name || "Usuário",
              profilePic: userProfile?.profile_pic
            },
            added_at: item.created_at
          };
        } catch (error) {
          console.error(`Error fetching details for series ${item.tmdb_id}:`, error);
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(seriesDetailsPromises);
      
      // Filter out null results and sort by most recent
      const validResults = results.filter(Boolean).sort(
        (a, b) => new Date(b!.added_at).getTime() - new Date(a!.added_at).getTime()
      );
      
      setInterestSeries(validResults);
      
      // If currently on the interests tab, update the series list
      if (activeFilter === "interests") {
        const seriesList: Series[] = validResults.map(item => ({
          id: item!.id,
          name: item!.name,
          poster_path: item!.poster_path,
          vote_average: 0,
          overview: `Adicionado por ${item!.user.name}`,
          first_air_date: item!.added_at,
          backdrop_path: null,
          genres: []
        }));
        
        setSeries(seriesList);
      }
    } catch (error) {
      console.error("Error loading interest list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load user rankings data
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
      if (aggregatedSeries.length === 0) {
        loadAllUserSeries();
      } else {
        updateSeriesList(aggregatedSeries, "most-watched");
      }
    } 
    else if (value === "best-rated") {
      if (aggregatedSeries.length === 0) {
        loadAllUserSeries();
      } else {
        updateSeriesList(aggregatedSeries, "best-rated");
      }
    }
    else if (value === "users") {
      loadUserRankings();
    }
    else if (value === "watchlist") {
      loadWatchlistSeries();
    }
    else if (value === "interests") {
      loadInterestList();
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    if (activeFilter === "most-watched") {
      loadAllUserSeries();
    }
  }, []);

  return (
    <div className="app-container pb-20">
      <Header title="Ranking" showSearchButton />
      
      <Tabs defaultValue="most-watched" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="most-watched" className="flex flex-col items-center text-xs py-2">
            <Eye size={18} className="mb-1" />
            <span>Mais Vistas</span>
          </TabsTrigger>
          <TabsTrigger value="best-rated" className="flex flex-col items-center text-xs py-2">
            <Star size={18} className="mb-1" />
            <span>Melhores</span>
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex flex-col items-center text-xs py-2">
            <List size={18} className="mb-1" />
            <span>Querem Ver</span>
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex flex-col items-center text-xs py-2">
            <BookmarkIcon size={18} className="mb-1" />
            <span>Interesses</span>
          </TabsTrigger>
        </TabsList>
        
        {/* View mode toggle */}
        <div className="flex justify-end mb-2">
          <div className="flex space-x-1">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1 rounded-md ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              aria-label="Visualização em grade"
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-muted' : ''}`}
              aria-label="Visualização em lista"
            >
              <List size={18} />
            </button>
          </div>
        </div>
        
        <TabsContent value="most-watched" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="best-rated" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="watchlist" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="interests" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="users" className="mt-0">
          {renderUserRankings()}
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
    
    return viewMode === 'grid' ? (
      <div className="grid grid-cols-2 gap-4 mt-2">
        {series.map(item => (
          <SeriesCard 
            key={item.id} 
            series={item}
            showRating={activeFilter === "best-rated"}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-3 mt-2">
        {series.map(item => (
          <Link 
            key={item.id}
            to={`/series/${item.id}`}
            className="flex items-center p-3 bg-white rounded-lg shadow"
          >
            <img 
              src={api.getImageUrl(item.poster_path, "w92")} 
              alt={item.name}
              className="w-12 h-18 object-cover rounded"
            />
            <div className="ml-3 flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <div className="flex items-center text-xs space-x-2 mt-1">
                {activeFilter === "best-rated" && (
                  <span className="text-yellow-500 font-bold">{(item.vote_average / 2).toFixed(1)}/5</span>
                )}
                <span className="text-muted-foreground line-clamp-1">{item.overview}</span>
              </div>
            </div>
          </Link>
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
};

export default Ranking;
