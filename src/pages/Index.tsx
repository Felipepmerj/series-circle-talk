import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Loader } from "lucide-react";
import Header from "../components/Header";
import FeedItem from "../components/FeedItem";
import { api } from "../services/api";
import { supabaseService } from "../services/supabaseService";
import { Series, Genre } from "../types/Series";
import BottomNav from "../components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

const ITEMS_PER_PAGE = 5; // Number of items to load per batch

const Index: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allActivitiesProcessed, setAllActivitiesProcessed] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [combinedItems, setCombinedItems] = useState<any[]>([]);
  
  // Filter-related states
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Index.tsx: Iniciando busca de dados");
        setFeedItems([]);
        setAllActivitiesProcessed(false);
        setPage(1);
        
        // Get all data from Supabase
        const fetchedWatchedShows = await supabaseService.getAllWatchedShows();
        const fetchedWatchlistItems = await supabaseService.getAllWatchlistItems();
        
        console.log("Index.tsx: Séries assistidas encontradas:", fetchedWatchedShows?.length || 0);
        console.log("Index.tsx: Itens da watchlist encontrados:", fetchedWatchlistItems?.length || 0);
        
        // Garantir que temos arrays mesmo se a API retornar null/undefined
        const safeWatchedShows = Array.isArray(fetchedWatchedShows) ? fetchedWatchedShows : [];
        const safeWatchlistItems = Array.isArray(fetchedWatchlistItems) ? fetchedWatchlistItems : [];
        
        // Filter items if filters are applied
        let filteredWatchedShows = safeWatchedShows;
        let filteredWatchlistItems = safeWatchlistItems;
        
        if (filterUser) {
          filteredWatchedShows = filteredWatchedShows.filter(item => item.user_id === filterUser);
          filteredWatchlistItems = filteredWatchlistItems.filter(item => item.user_id === filterUser);
        }
        
        // Combine both lists for sorting
        const combined = [
          ...filteredWatchedShows.map(item => ({...item, type: 'watched'})),
          ...filteredWatchlistItems.map(item => ({...item, type: 'watchlist'}))
        ];
        
        // Sort combined items by timestamp (newest first)
        combined.sort((a, b) => {
          const dateA = new Date(
            a.type === 'watched' ? (a.watched_at || a.created_at || "") : (a.created_at || "")
          ).getTime();
          const dateB = new Date(
            b.type === 'watched' ? (b.watched_at || b.created_at || "") : (a.created_at || "")
          ).getTime();
          return dateB - dateA;
        });
        
        console.log("Index.tsx: Total de itens combinados:", combined.length);
        setCombinedItems(combined);
        
        // Fetch users for filtering
        const profiles = await supabaseService.getAllProfiles();
        setUsers(profiles.map(profile => ({
          id: profile.id,
          name: profile.name || profile.id
        })));
        
        setInitialLoadComplete(true);
        await processBatch(1, combined);
        setLoading(false);
      } catch (error) {
        console.error("Index.tsx: Erro ao carregar dados iniciais:", error);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [filterUser, filterGenre]); // Reprocessar quando os filtros mudarem
  
  const processBatch = async (currentPage: number, items: any[]) => {
    console.log(`Index.tsx: Processando lote ${currentPage}`);
    setLoadingMore(true);
    
    try {
      // Determine what items to process in this batch
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      // Check if we have data to process
      if (!items || items.length === 0) {
        console.log("Index.tsx: Nenhum item para processar");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Limit to what we need for this page
      const itemsToProcess = items.slice(startIndex, endIndex);
      console.log(`Index.tsx: Processando ${itemsToProcess.length} itens do índice ${startIndex} ao ${endIndex-1}`);
      
      if (itemsToProcess.length === 0) {
        console.log("Index.tsx: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Process this batch of items
      const newActivities = await Promise.all(itemsToProcess.map(async (item) => {
        try {
          const isWatched = item.type === 'watched';
          
          // Fetch series data
          console.log(`Index.tsx: Buscando dados para série ${item.tmdb_id}`);
          const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          
          if (!seriesData || !userProfile) {
            console.log(`Index.tsx: Dados faltando para o item: ${item.id} - Série: ${!!seriesData}, Usuário: ${!!userProfile}`);
            return null;
          }
          
          // Store genres for filtering if we find new ones
          if (seriesData.genres) {
            const newGenres = seriesData.genres.filter(
              genre => !allGenres.some(existingGenre => existingGenre.id === genre.id)
            );
            
            if (newGenres.length > 0) {
              setAllGenres(prev => [...prev, ...newGenres]);
            }
          }
          
          // If genre filter is active and this series doesn't match, skip it
          if (filterGenre && (!seriesData.genres || !seriesData.genres.some(genre => genre.id === filterGenre))) {
            return null;
          }
          
          return {
            id: item.id,
            userId: item.user_id,
            seriesId: parseInt(item.tmdb_id, 10),
            type: isWatched ? 'review' : 'added-to-watchlist' as 'review' | 'added-to-watchlist',
            timestamp: item.created_at || item.watched_at || new Date().toISOString(),
            reviewId: isWatched ? item.id : undefined,
            watchlistItemId: !isWatched ? item.id : undefined,
            seriesName: seriesData?.name,
            username: userProfile?.name
          };
        } catch (e) {
          console.error("Index.tsx: Erro ao processar item:", e);
          return null;
        }
      }));
      
      // Filter out null items and add to existing activities
      const validNewActivities = newActivities.filter(Boolean) as FeedActivity[];
      console.log(`Index.tsx: ${validNewActivities.length} novas atividades válidas processadas`);
      
      if (validNewActivities.length > 0) {
        setFeedItems(prev => [...prev, ...validNewActivities]);
      }
      
      // Check if we've processed everything
      if (endIndex >= items.length) {
        console.log("Index.tsx: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
      }
    } catch (error) {
      console.error("Index.tsx: Erro ao processar lote:", error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  const loadMoreItems = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    processBatch(nextPage, combinedItems);
  };
  
  // Filter the feed items
  const filteredFeed = feedItems;
  
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
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="mt-3 flex">
                <Skeleton className="h-20 w-16" />
                <div className="ml-3 space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFeed.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredFeed.map(item => (
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
            ))}
          </div>
          
          {!allActivitiesProcessed && (
            <div className="mt-4 flex justify-center pb-20">
              <Button 
                onClick={loadMoreItems} 
                disabled={loadingMore}
                variant="outline"
                className="w-full max-w-xs"
              >
                {loadingMore ? (
                  <span className="flex items-center">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </span>
                ) : (
                  "Carregar mais"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 mb-20">
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
