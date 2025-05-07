import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { api } from '../services/api';
import FeedItem from './FeedItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [watchedSeries, setWatchedSeries] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Carregar perfil do usuário
        const profile = await supabaseService.getUserProfile(userId);
        setUserProfile(profile);
        
        // Carregar séries assistidas
        const watched = await supabaseService.getUserWatchedSeries(userId);
        const watchedWithDetails = await Promise.all(
          watched.map(async (show) => {
            const seriesDetails = await api.getSeriesById(show.series_id);
            return {
              ...show,
              seriesName: seriesDetails?.name,
              poster_path: seriesDetails?.poster_path
            };
          })
        );
        setWatchedSeries(watchedWithDetails);
        
        // Carregar watchlist
        const watchlistItems = await supabaseService.getUserWatchlist(userId);
        const watchlistWithDetails = await Promise.all(
          watchlistItems.map(async (item) => {
            const seriesDetails = await api.getSeriesById(item.series_id);
            return {
              ...item,
              seriesName: seriesDetails?.name,
              poster_path: seriesDetails?.poster_path
            };
          })
        );
        setWatchlist(watchlistWithDetails);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-20 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="p-4">Usuário não encontrado</div>;
  }

  return (
    <div className="p-4">
      {/* Cabeçalho do perfil */}
      <div className="flex items-center space-x-4 mb-6">
        <img
          src={userProfile.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.name}`}
          alt={userProfile.name || 'Usuário'}
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{userProfile.name}</h1>
          <p className="text-muted-foreground">
            {watchedSeries.length} séries assistidas • {watchlist.length} na lista de desejos
          </p>
        </div>
      </div>

      {/* Tabs para séries assistidas e lista de desejos */}
      <Tabs defaultValue="watched" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="watched">Séries Assistidas</TabsTrigger>
          <TabsTrigger value="watchlist">Quero Assistir</TabsTrigger>
        </TabsList>
        
        <TabsContent value="watched" className="mt-4">
          <div className="space-y-4">
            {watchedSeries.map((item) => (
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
            {watchedSeries.length === 0 && (
              <p className="text-center text-muted-foreground">
                Nenhuma série assistida ainda
              </p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="watchlist" className="mt-4">
          <div className="space-y-4">
            {watchlist.map((item) => (
              <FeedItem
                key={item.id}
                userId={item.user_id}
                seriesId={item.series_id}
                type="added-to-watchlist"
                timestamp={item.added_at}
                watchlistItemId={item.id}
                username={item.user_name}
                seriesName={item.seriesName}
                userProfilePic={item.user_profile_pic}
              />
            ))}
            {watchlist.length === 0 && (
              <p className="text-center text-muted-foreground">
                Nenhuma série na lista de desejos
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile; 