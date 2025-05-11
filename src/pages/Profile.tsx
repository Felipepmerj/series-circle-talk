
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Grid, List } from "lucide-react";
import Header from "../components/Header";
import SeriesCard from "../components/SeriesCard";
import { api } from "../services/api";
import { Series } from "../types/Series";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import BottomNav from "../components/BottomNav";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [watchedSeries, setWatchedSeries] = useState<(Series & { userRating: number, userComment: string })[]>([]);
  const [watchlistSeries, setWatchlistSeries] = useState<(Series & { userNote?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Usar o ID do usuário atual se não for especificado na URL
  const currentProfileId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentProfileId) return;
      
      try {
        // Buscar perfil do usuário
        const profileData = await supabaseService.getUserProfile(currentProfileId);
        
        if (profileData) {
          setProfile(profileData);
          
          // Buscar séries assistidas - now uses properly mapped data
          const watched = await supabaseService.getWatchedSeries(currentProfileId);
          const watchedWithDetails = await Promise.all(
            watched.map(async item => {
              try {
                // series_id is now mapped by our helper method
                const series = await api.getSeriesById(item.series_id);
                return series ? {
                  ...series,
                  userRating: item.rating || 0,
                  userComment: item.comment || "" // comment is mapped from review
                } : null;
              } catch (error) {
                console.error(`Erro ao buscar detalhes da série ${item.series_id}:`, error);
                return null;
              }
            })
          );
          
          // Buscar lista de séries para assistir
          const watchlist = await supabaseService.getWatchlist(currentProfileId);
          const watchlistWithDetails = await Promise.all(
            watchlist.map(async item => {
              try {
                // series_id is now mapped by our helper method
                const series = await api.getSeriesById(item.series_id);
                return series ? {
                  ...series,
                  userNote: item.notes // notes is mapped from note
                } : null;
              } catch (error) {
                console.error(`Erro ao buscar detalhes da série ${item.series_id}:`, error);
                return null;
              }
            })
          );
          
          setWatchedSeries(watchedWithDetails.filter(Boolean) as (Series & { userRating: number, userComment: string })[]);
          setWatchlistSeries(watchlistWithDetails.filter(Boolean) as (Series & { userNote?: string })[]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentProfileId, user?.id]);
  
  // Botão para acessar o perfil do usuário
  const renderProfileButton = () => {
    if (!user || !isOwnProfile) return null;
    
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-auto" 
        onClick={() => navigate("/user-profile")}
      >
        Editar Perfil
      </Button>
    );
  };
  
  if (loading) {
    return (
      <div className="app-container pb-20">
        <Header title="Carregando..." showBackButton />
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <BottomNav />
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="app-container pb-20">
        <Header title="Perfil não encontrado" showBackButton />
        <div className="text-center py-8">
          <p>Usuário não encontrado.</p>
          <Link to="/" className="text-primary mt-2 inline-block">
            Voltar para a página inicial
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }
  
  return (
    <div className="app-container pb-20">
      <Header title={isOwnProfile ? "Meu Perfil" : "Perfil"} showBackButton={!isOwnProfile} />
      
      {/* Profile header */}
      <div className="flex items-center p-4">
        <img 
          src={profile.profile_pic || "/placeholder.svg"} 
          alt={profile.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="ml-4 flex-1">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-muted-foreground">
            <span>{watchedSeries.length} séries assistidas</span>
            <span className="mx-2">•</span>
            <span>{watchlistSeries.length} na lista</span>
          </p>
        </div>
        {renderProfileButton()}
      </div>
      
      {/* Series tabs */}
      <Tabs defaultValue="watched" className="mt-4">
        <div className="flex justify-between items-center px-2">
          <TabsList>
            <TabsTrigger value="watched">Já Assistiu</TabsTrigger>
            <TabsTrigger value="watchlist">Quer Assistir</TabsTrigger>
          </TabsList>
          
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
        
        <TabsContent value="watched">
          {watchedSeries.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {watchedSeries.map(series => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    userRating={series.userRating}
                    comment={series.userComment}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {watchedSeries.map(series => (
                  <Link 
                    key={series.id}
                    to={`/series/${series.id}`}
                    className="flex items-center p-3 bg-white rounded-lg shadow"
                  >
                    <img 
                      src={api.getImageUrl(series.poster_path, "w92")} 
                      alt={series.name}
                      className="w-12 h-18 object-cover rounded"
                    />
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium">{series.name}</h3>
                      <div className="flex items-center text-xs space-x-2 mt-1">
                        <span className="text-yellow-500 font-bold">{series.userRating}/10</span>
                        <span className="text-muted-foreground line-clamp-1">{series.userComment}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma série assistida.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="watchlist">
          {watchlistSeries.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {watchlistSeries.map(series => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    showRating={false}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {watchlistSeries.map(series => (
                  <Link 
                    key={series.id}
                    to={`/series/${series.id}`}
                    className="flex items-center p-3 bg-white rounded-lg shadow"
                  >
                    <img 
                      src={api.getImageUrl(series.poster_path, "w92")} 
                      alt={series.name}
                      className="w-12 h-18 object-cover rounded"
                    />
                    <div className="ml-3">
                      <h3 className="font-medium">{series.name}</h3>
                      {series.userNote && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          "{series.userNote}"
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma série na lista.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
