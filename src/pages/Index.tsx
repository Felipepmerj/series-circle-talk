import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import Header from "../components/Header";
import FeedItem from "../components/FeedItem";
import { api } from "../services/api";
import { supabaseService } from "../services/supabaseService";
import { Series, Genre } from "../types/Series";
import BottomNav from "../components/BottomNav";

interface FeedActivity {
  id: string;
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
  seriesName?: string;
  username?: string;
}

const Index: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // Get data from Supabase directly instead of using api.getFeedItems()
        const watchedShows = await supabaseService.getAllWatchedShows();
        const watchlistItems = await supabaseService.getAllWatchlistItems();
        
        // Process watched shows
        const watchedActivities = await Promise.all(watchedShows.map(async (item) => {
          try {
            const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
            const userProfile = await supabaseService.getUserProfile(item.user_id);
            
            if (!seriesData || !userProfile) return null;
            
            return {
              id: item.id,
              userId: item.user_id,
              seriesId: parseInt(item.tmdb_id, 10),
              type: 'review' as const,
              timestamp: item.created_at || item.watched_at || new Date().toISOString(),
              reviewId: item.id,
              seriesName: seriesData?.name,
              username: userProfile?.name
            };
          } catch (e) {
            console.error("Error processing watched show:", e);
            return null;
          }
        }));
        
        // Process watchlist items
        const watchlistActivities = await Promise.all(watchlistItems.map(async (item) => {
          try {
            const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
            const userProfile = await supabaseService.getUserProfile(item.user_id);
            
            if (!seriesData || !userProfile) return null;
            
            return {
              id: item.id,
              userId: item.user_id,
              seriesId: parseInt(item.tmdb_id, 10),
              type: 'added-to-watchlist' as const,
              timestamp: item.created_at || new Date().toISOString(),
              watchlistItemId: item.id,
              seriesName: seriesData?.name,
              username: userProfile?.name
            };
          } catch (e) {
            console.error("Error processing watchlist item:", e);
            return null;
          }
        }));
        
        const allActivities = [...watchedActivities, ...watchlistActivities]
          .filter(Boolean)
          .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
          
        setFeedItems(allActivities as FeedActivity[]);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeed();
  }, []);
  
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      // Get users from Supabase instead of using api.getUsers()
      try {
        const profiles = await supabaseService.getAllUserProfiles();
        setUsers(profiles.map(profile => ({
          id: profile.id,
          name: profile.name || profile.email || 'Usuário'
        })));
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    };
    
    const fetchGenres = async () => {
      const genresMap = new Map<number, string>();
      
      for (const item of feedItems) {
        try {
          const series = await api.getSeriesById(item.seriesId);
          if (series) {
            for (const genre of series.genres) {
              genresMap.set(genre.id, genre.name);
            }
          }
        } catch (error) {
          console.error("Error fetching series details:", error);
        }
      }
      
      setAllGenres(Array.from(genresMap).map(([id, name]) => ({ id, name })));
    };
    
    if (feedItems.length > 0) {
      fetchUsers();
      fetchGenres();
    }
  }, [feedItems]);
  
  const filteredFeed = feedItems.filter(item => {
    let include = true;
    
    if (filterUser) {
      include = include && item.userId === filterUser;
    }
    
    if (filterGenre) {
      // This would need to check if the series has this genre
      // For now, we'll just keep all items if a genre filter is set
      // as we'd need to fetch all series data to check genres
    }
    
    return include;
  });
  
  return (
    <div className="app-container">
      <Header title="SeriesTalk" showSearchButton />
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Feed de Atividades</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-primary"
        >
          <Filter size={16} className="mr-1" />
          Filtros
        </button>
      </div>
      
      {showFilters && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Filtrar por amigo:</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filterUser || ""}
              onChange={(e) => setFilterUser(e.target.value || null)}
            >
              <option value="">Todos os amigos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por gênero:</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filterGenre || ""}
              onChange={(e) => setFilterGenre(Number(e.target.value) || null)}
            >
              <option value="">Todos os gêneros</option>
              {allGenres.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted h-40 rounded-lg"></div>
          ))}
        </div>
      ) : filteredFeed.length > 0 ? (
        filteredFeed.map(item => (
          <FeedItem 
            key={item.id}
            userId={item.userId}
            seriesId={item.seriesId}
            type={item.type}
            timestamp={item.timestamp}
            reviewId={item.reviewId}
            watchlistItemId={item.watchlistItemId}
            username={item.username}
            seriesName={item.seriesName}
          />
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma atividade encontrada.</p>
          {filterUser || filterGenre ? (
            <button 
              onClick={() => {
                setFilterUser(null);
                setFilterGenre(null);
              }}
              className="text-primary mt-2"
            >
              Limpar filtros
            </button>
          ) : (
            <Link to="/search" className="text-primary mt-2 inline-block">
              Comece a adicionar séries!
            </Link>
          )}
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default Index;
