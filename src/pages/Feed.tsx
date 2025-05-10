
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import FeedItem from "../components/FeedItem";
import BottomNav from "../components/BottomNav";
import { supabaseService } from "../services/supabaseService";
import { api } from "../services/api";
import { Loader } from "lucide-react";
import { toast } from "sonner";
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

const Feed: React.FC = () => {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [allActivitiesProcessed, setAllActivitiesProcessed] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [watchedShows, setWatchedShows] = useState<any[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get all data from Supabase first
        const fetchedWatchedShows = await supabaseService.getAllWatchedShows();
        const fetchedWatchlistItems = await supabaseService.getAllWatchlistItems();
        
        // Sort by timestamp
        fetchedWatchedShows.sort((a, b) => 
          new Date(b.created_at || b.watched_at || "").getTime() - 
          new Date(a.created_at || a.watched_at || "").getTime()
        );
        
        fetchedWatchlistItems.sort((a, b) => 
          new Date(b.created_at || "").getTime() - 
          new Date(a.created_at || "").getTime()
        );
        
        setWatchedShows(fetchedWatchedShows);
        setWatchlistItems(fetchedWatchlistItems);
        setInitialLoadComplete(true);
        processInitialBatch();
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar feed de atividades");
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const processInitialBatch = async () => {
    try {
      await processBatch(1);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao processar lote inicial:", error);
      toast.error("Erro ao processar feed de atividades");
      setLoading(false);
    }
  };
  
  const processBatch = async (currentPage: number) => {
    setLoadingMore(true);
    
    try {
      // Determine what items to process in this batch
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      
      // Combine both lists for sorting but only take what we need for this batch
      const combinedItems = [
        ...watchedShows.slice(0, startIndex + ITEMS_PER_PAGE).map(item => ({...item, type: 'watched'})),
        ...watchlistItems.slice(0, startIndex + ITEMS_PER_PAGE).map(item => ({...item, type: 'watchlist'}))
      ];
      
      // Sort combined items by timestamp
      combinedItems.sort((a, b) => {
        const dateA = new Date(a.created_at || a.watched_at || "").getTime();
        const dateB = new Date(b.created_at || b.watched_at || "").getTime();
        return dateB - dateA;
      });
      
      // Limit to what we need for this page
      const itemsToProcess = combinedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      if (itemsToProcess.length === 0) {
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Process this batch of items
      const newActivities = await Promise.all(itemsToProcess.map(async (item) => {
        try {
          const isWatched = item.type === 'watched';
          
          // Fetch series data
          const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          
          if (!seriesData || !userProfile) return null;
          
          return {
            id: item.id,
            userId: item.user_id,
            seriesId: parseInt(item.tmdb_id, 10),
            type: isWatched ? 'review' : 'added-to-watchlist' as 'review' | 'added-to-watchlist',
            timestamp: item.created_at || item.watched_at || new Date().toISOString(),
            reviewId: isWatched ? item.id : undefined,
            watchlistItemId: !isWatched ? item.id : undefined,
            seriesName: seriesData?.name || "Série desconhecida",
            username: userProfile?.name || "Usuário"
          };
        } catch (e) {
          console.error("Erro ao processar item:", e);
          return null;
        }
      }));
      
      // Filter out null items and add to existing activities
      const validNewActivities = newActivities.filter(Boolean) as FeedActivity[];
      setActivities(prev => [...prev, ...validNewActivities]);
      
      // Check if we've processed everything
      if (
        startIndex + ITEMS_PER_PAGE >= watchedShows.length && 
        startIndex + ITEMS_PER_PAGE >= watchlistItems.length
      ) {
        setAllActivitiesProcessed(true);
      }
    } catch (error) {
      console.error("Erro ao processar lote:", error);
      toast.error("Erro ao carregar mais itens");
    } finally {
      setLoadingMore(false);
    }
  };
  
  const loadMoreItems = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    processBatch(nextPage);
  };

  return (
    <div className="app-container pb-20">
      <Header title="Feed de Atividades" />

      <div className="mt-4">
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
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {activities.map((activity) => (
                <FeedItem
                  key={activity.id}
                  userId={activity.userId}
                  seriesId={activity.seriesId}
                  type={activity.type}
                  timestamp={activity.timestamp}
                  reviewId={activity.reviewId}
                  watchlistItemId={activity.watchlistItemId}
                  username={activity.username}
                  seriesName={activity.seriesName}
                />
              ))}
            </div>
            
            {!allActivitiesProcessed && (
              <div className="mt-4 flex justify-center">
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
        ) : initialLoadComplete ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-muted-foreground">Nenhuma atividade recente.</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
