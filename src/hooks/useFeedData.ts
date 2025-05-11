
import { useState, useEffect } from "react";
import { supabaseService } from "../services/supabaseService";
import { api } from "../services/api";
import { toast } from "sonner";

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

const ITEMS_PER_PAGE = 5;

export const useFeedData = () => {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [allActivitiesProcessed, setAllActivitiesProcessed] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [combinedItems, setCombinedItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Clear any existing activities before loading new ones
        setActivities([]);
        setAllActivitiesProcessed(false);
        setPage(1);
        
        console.log("Feed hook: Iniciando busca de dados");
        
        // Get all data from Supabase first
        const fetchedWatchedShows = await supabaseService.getAllWatchedShows();
        const fetchedWatchlistItems = await supabaseService.getAllWatchlistItems();
        
        console.log("Feed hook: Séries assistidas encontradas:", fetchedWatchedShows?.length || 0);
        console.log("Feed hook: Itens da watchlist encontrados:", fetchedWatchlistItems?.length || 0);
        
        // Ensure we have arrays even if API returns null/undefined
        const safeWatchedShows = Array.isArray(fetchedWatchedShows) ? fetchedWatchedShows : [];
        const safeWatchlistItems = Array.isArray(fetchedWatchlistItems) ? fetchedWatchlistItems : [];
        
        // Combine both types of items
        const combined = [
          ...safeWatchedShows.map(item => ({...item, type: 'watched'})),
          ...safeWatchlistItems.map(item => ({...item, type: 'watchlist'}))
        ];
        
        // Sort by timestamp (newest first)
        combined.sort((a, b) => {
          // Handle different timestamp properties based on the item type
          const dateA = new Date(
            a.type === 'watched' ? a.watched_at || a.created_at : a.created_at
          ).getTime();
          const dateB = new Date(
            b.type === 'watched' ? b.watched_at || b.created_at : b.created_at
          ).getTime();
          return dateB - dateA;
        });
        
        console.log("Feed hook: Total de itens combinados:", combined.length);
        setCombinedItems(combined);
        setInitialLoadComplete(true);
        
        // Process first batch
        await processBatch(1, combined);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar feed de atividades");
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const processBatch = async (currentPage: number, items: any[]) => {
    console.log(`Feed hook: Processando lote ${currentPage}`);
    setLoadingMore(true);
    
    try {
      // Determine which items to process in this batch
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      // Make sure we have data to process
      if (!items || items.length === 0) {
        console.log("Feed hook: Nenhum item para processar");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Limit to what we need for this page
      const itemsToProcess = items.slice(startIndex, endIndex);
      console.log(`Feed hook: Processando ${itemsToProcess.length} itens do índice ${startIndex} ao ${endIndex-1}`);
      
      if (itemsToProcess.length === 0) {
        console.log("Feed hook: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Process this batch of items
      const newActivities = await Promise.all(itemsToProcess.map(async (item) => {
        try {
          const isWatched = item.type === 'watched';
          
          // Fetch series data
          console.log(`Feed hook: Buscando dados para série ${item.tmdb_id}`);
          const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          
          if (!seriesData || !userProfile) {
            console.log(`Feed hook: Dados faltando para o item: ${item.id} - Série: ${!!seriesData}, Usuário: ${!!userProfile}`);
            return null;
          }
          
          return {
            id: item.id,
            userId: item.user_id,
            seriesId: parseInt(item.tmdb_id, 10),
            type: isWatched ? 'review' : 'added-to-watchlist',
            timestamp: isWatched ? (item.watched_at || item.created_at) : item.created_at,
            reviewId: isWatched ? item.id : undefined,
            watchlistItemId: !isWatched ? item.id : undefined,
            seriesName: seriesData?.name || "Série desconhecida",
            username: userProfile?.name || "Usuário"
          };
        } catch (e) {
          console.error("Feed hook: Erro ao processar item:", e);
          return null;
        }
      }));
      
      // Filter out null items and add to existing activities
      const validNewActivities = newActivities.filter(Boolean) as FeedActivity[];
      console.log(`Feed hook: ${validNewActivities.length} novas atividades válidas processadas`);
      
      if (validNewActivities.length > 0) {
        setActivities(prev => [...prev, ...validNewActivities]);
      }
      
      // Check if we processed everything
      if (endIndex >= items.length) {
        console.log("Feed hook: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
      }
    } catch (error) {
      console.error("Feed hook: Erro ao processar lote:", error);
      toast.error("Erro ao carregar mais itens");
    } finally {
      setLoadingMore(false);
    }
  };
  
  const loadMoreItems = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    processBatch(nextPage, combinedItems);
  };

  return {
    activities,
    loading,
    initialLoadComplete,
    allActivitiesProcessed,
    loadingMore,
    combinedItems,
    loadMoreItems
  };
};
