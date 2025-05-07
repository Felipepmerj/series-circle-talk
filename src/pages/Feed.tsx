
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import FeedItem from "../components/FeedItem";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import { api } from "../services/api";
import { Series } from "../types/Series";
import { Loader } from "lucide-react";
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

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFeedActivities = async () => {
      setLoading(true);
      try {
        // Obter todas as séries assistidas dos amigos (todos os usuários por enquanto)
        const watchedShows = await supabaseService.getAllWatchedShows();
        const watchlistItems = await supabaseService.getAllWatchlistItems();
        
        // Adicionar séries assistidas ao feed
        const watchedActivities = await Promise.all(watchedShows.map(async (item) => {
          try {
            // Buscar informações da série
            const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
            const userProfile = await supabaseService.getUserProfile(item.user_id);
            
            return {
              id: item.id,
              userId: item.user_id,
              seriesId: parseInt(item.tmdb_id, 10),
              type: 'review' as const,
              timestamp: item.created_at || item.watched_at || new Date().toISOString(),
              reviewId: item.id,
              seriesName: seriesData?.name || "Série desconhecida",
              username: userProfile?.name || "Usuário"
            };
          } catch (e) {
            console.error("Erro ao processar atividade de série assistida:", e);
            return null;
          }
        }));
        
        // Adicionar itens da watchlist ao feed
        const watchlistActivities = await Promise.all(watchlistItems.map(async (item) => {
          try {
            // Buscar informações da série
            const seriesData = await api.getSeriesById(parseInt(item.tmdb_id, 10));
            const userProfile = await supabaseService.getUserProfile(item.user_id);
            
            return {
              id: item.id,
              userId: item.user_id,
              seriesId: parseInt(item.tmdb_id, 10),
              type: 'added-to-watchlist' as const,
              timestamp: item.created_at || new Date().toISOString(),
              watchlistItemId: item.id,
              seriesName: seriesData?.name || "Série desconhecida",
              username: userProfile?.name || "Usuário"
            };
          } catch (e) {
            console.error("Erro ao processar atividade de watchlist:", e);
            return null;
          }
        }));
        
        // Combinar, filtrar nulos, e ordenar por data (mais recente primeiro)
        const allActivities = [...watchedActivities, ...watchlistActivities]
          .filter(Boolean)
          .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
        
        setActivities(allActivities as FeedActivity[]);
      } catch (error) {
        console.error("Erro ao carregar atividades do feed:", error);
        toast.error("Erro ao carregar feed de atividades");
      } finally {
        setLoading(false);
      }
    };

    loadFeedActivities();
  }, [user]);

  if (!user) {
    return (
      <div className="app-container">
        <Header title="Feed de Atividades" />
        <div className="p-8 text-center">
          <p>Você precisa estar logado para ver o feed de atividades.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header title="Feed de Atividades" />

      <div className="mt-4 mb-24">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
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
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-muted-foreground">Nenhuma atividade recente.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
