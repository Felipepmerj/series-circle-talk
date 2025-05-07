import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import FeedItem from './FeedItem';
import { api } from '../services/api';

const SeriesFeed: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      
      // Buscar todas as séries assistidas com informações dos usuários
      const watchedShows = await supabaseService.getAllWatchedShowsWithUsers();
      
      // Buscar informações detalhadas das séries em paralelo
      const feedItemsWithDetails = await Promise.all(
        watchedShows.map(async (show) => {
          try {
            const seriesDetails = await api.getSeriesById(show.series_id);
            return {
              ...show,
              seriesName: seriesDetails?.name,
              poster_path: seriesDetails?.poster_path
            };
          } catch (error) {
            console.error('Erro ao buscar detalhes da série:', error);
            return show;
          }
        })
      );
      
      setFeedItems(prevItems => 
        pageNumber === 1 ? feedItemsWithDetails : [...prevItems, ...feedItemsWithDetails]
      );
      setHasMore(feedItemsWithDetails.length === 20); // Se retornou menos que o limite, não há mais itens
    } catch (error) {
      console.error('Erro ao carregar feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Função para carregar mais itens quando o usuário rolar até o final
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      setPage(prev => prev + 1);
      loadFeed(page + 1);
    }
  };

  if (loading && feedItems.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse bg-muted/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      {feedItems.map((item) => (
        <FeedItem
          key={item.id}
          userId={item.user_id}
          seriesId={item.series_id}
          type="review"
          timestamp={item.watched_at}
          reviewId={item.id}
          username={item.user_name}
          seriesName={item.seriesName}
          userProfilePic={item.user_profile_pic}
        />
      ))}
      {loading && feedItems.length > 0 && (
        <div className="p-4 border rounded-lg animate-pulse bg-muted/50">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}
      {!hasMore && feedItems.length > 0 && (
        <p className="text-center text-muted-foreground py-4">
          Não há mais séries para carregar
        </p>
      )}
    </div>
  );
};

export default SeriesFeed; 