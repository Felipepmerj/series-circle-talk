
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

const ITEMS_PER_PAGE = 5; // Número de itens para carregar por lote

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
        // Limpar todas as atividades existentes antes de carregar novas
        setActivities([]);
        
        // Obter todos os dados do Supabase primeiro
        const fetchedWatchedShows = await supabaseService.getAllWatchedShows();
        const fetchedWatchlistItems = await supabaseService.getAllWatchlistItems();
        
        console.log("Feed: Buscando dados iniciais");
        console.log("Feed: Séries assistidas encontradas:", fetchedWatchedShows?.length || 0);
        console.log("Feed: Itens da watchlist encontrados:", fetchedWatchlistItems?.length || 0);
        
        // Garantir que temos arrays mesmo se a API retornar null/undefined
        const safeWatchedShows = Array.isArray(fetchedWatchedShows) ? fetchedWatchedShows : [];
        const safeWatchlistItems = Array.isArray(fetchedWatchlistItems) ? fetchedWatchlistItems : [];
        
        // Ordenar por timestamp (mais recente primeiro)
        safeWatchedShows.sort((a, b) => 
          new Date(b.created_at || b.watched_at || "").getTime() - 
          new Date(a.created_at || a.watched_at || "").getTime()
        );
        
        safeWatchlistItems.sort((a, b) => 
          new Date(b.created_at || "").getTime() - 
          new Date(a.created_at || "").getTime()
        );
        
        // Armazenar dados no estado
        setWatchedShows(safeWatchedShows);
        setWatchlistItems(safeWatchlistItems);
        setInitialLoadComplete(true);
        
        // Processar primeiro lote se tivermos dados
        if (safeWatchedShows.length > 0 || safeWatchlistItems.length > 0) {
          console.log("Feed: Processando primeiro lote de dados");
          await processBatch(1);
        } else {
          console.log("Feed: Nenhum dado encontrado");
        }
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar feed de atividades");
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const processBatch = async (currentPage: number) => {
    setLoadingMore(true);
    
    try {
      // Determinar quais itens processar neste lote
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      
      // Certificar que temos dados para processar
      if (!watchedShows.length && !watchlistItems.length) {
        console.log("Feed: Nenhum item para processar");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      // Combinar ambas as listas para ordenação
      const combinedItems = [
        ...watchedShows.map(item => ({...item, type: 'watched'})),
        ...watchlistItems.map(item => ({...item, type: 'watchlist'}))
      ];
      
      // Ordenar itens combinados por timestamp (mais recente primeiro)
      combinedItems.sort((a, b) => {
        const dateA = new Date(a.created_at || a.watched_at || "").getTime();
        const dateB = new Date(b.created_at || b.watched_at || "").getTime();
        return dateB - dateA;
      });
      
      // Limitar ao que precisamos para esta página
      const itemsToProcess = combinedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      if (itemsToProcess.length === 0) {
        console.log("Feed: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
        setLoadingMore(false);
        return;
      }
      
      console.log("Feed: Processando lote:", itemsToProcess.length, "itens");
      
      // Processar este lote de itens
      const newActivities = await Promise.all(itemsToProcess.map(async (item) => {
        try {
          const isWatched = item.type === 'watched';
          
          // Buscar dados da série
          const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
          const userProfile = await supabaseService.getUserProfile(item.user_id);
          
          if (!seriesData || !userProfile) {
            console.log("Feed: Dados faltando para o item:", item.id, "- Série:", !!seriesData, "Usuário:", !!userProfile);
            return null;
          }
          
          return {
            id: item.id,
            userId: item.user_id,
            seriesId: parseInt(item.tmdb_id, 10),
            type: isWatched ? 'review' : 'added-to-watchlist',
            timestamp: item.created_at || item.watched_at || new Date().toISOString(),
            reviewId: isWatched ? item.id : undefined,
            watchlistItemId: !isWatched ? item.id : undefined,
            seriesName: seriesData?.name || "Série desconhecida",
            username: userProfile?.name || "Usuário"
          };
        } catch (e) {
          console.error("Feed: Erro ao processar item:", e);
          return null;
        }
      }));
      
      // Filtrar itens nulos e adicionar às atividades existentes
      const validNewActivities = newActivities.filter(Boolean) as FeedActivity[];
      console.log("Feed: Novas atividades válidas:", validNewActivities.length);
      
      if (validNewActivities.length > 0) {
        setActivities(prev => [...prev, ...validNewActivities]);
      }
      
      // Verificar se processamos tudo
      const processedCount = startIndex + ITEMS_PER_PAGE;
      if (processedCount >= combinedItems.length) {
        console.log("Feed: Todos os itens foram processados");
        setAllActivitiesProcessed(true);
      }
    } catch (error) {
      console.error("Feed: Erro ao processar lote:", error);
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
            <p className="text-sm text-muted-foreground mt-2">
              {watchedShows.length || watchlistItems.length ? 
                "Erro ao processar atividades. Por favor, recarregue a página." :
                "Comece adicionando séries à sua lista!"}
            </p>
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
