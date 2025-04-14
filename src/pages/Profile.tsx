
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, Search, ListChecks, ListPlus, Users, Grid, List } from "lucide-react";
import Header from "../components/Header";
import SeriesCard from "../components/SeriesCard";
import { api } from "../services/api";
import { User, Series } from "../types/Series";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import SeriesStatusFilter from "../components/SeriesStatusFilter";
import { seriesStatusService } from "../services/seriesStatusService";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [watchedSeries, setWatchedSeries] = useState<(Series & { userRating: number, userComment: string })[]>([]);
  const [watchlistSeries, setWatchlistSeries] = useState<(Series & { userNote?: string })[]>([]);
  const [watchingSeries, setWatchingSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filteredSeries, setFilteredSeries] = useState<number[]>([]);
  
  // ID do usuário a ser mostrado (atual ou o especificado na URL)
  const targetUserId = userId || (user?.id || 'user1');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Redirecionar para a página de login se não estiver autenticado
        if (!user && !userId) {
          navigate('/auth');
          return;
        }
        
        const userData = await api.getUserById(targetUserId);
        
        if (userData) {
          setProfileUser(userData);
          
          // Buscar séries assistidas
          const watched = await Promise.all(
            userData.watchedSeries.map(async review => {
              const series = await api.getSeriesById(review.seriesId);
              return series ? {
                ...series,
                userRating: review.rating,
                userComment: review.comment
              } : null;
            })
          );
          
          // Buscar séries da watchlist
          const watchlist = await Promise.all(
            userData.watchlist.map(async item => {
              const series = await api.getSeriesById(item.seriesId);
              return series ? {
                ...series,
                userNote: item.note
              } : null;
            })
          );
          
          setWatchedSeries(watched.filter(Boolean) as (Series & { userRating: number, userComment: string })[]);
          setWatchlistSeries(watchlist.filter(Boolean) as (Series & { userNote?: string })[]);
          
          // Se for o próprio usuário, buscar séries que está assistindo do Supabase
          if (user && (targetUserId === user.id)) {
            try {
              const assistindoIds = await seriesStatusService.getSeriesByStatus('assistindo');
              
              const assistindo = await Promise.all(
                assistindoIds.map(async id => {
                  const series = await api.getSeriesById(id);
                  return series;
                })
              );
              
              setWatchingSeries(assistindo.filter(Boolean) as Series[]);
            } catch (error) {
              console.error("Erro ao buscar séries assistindo:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [targetUserId, user, navigate]);
  
  const handleFilterChange = (seriesIds: number[]) => {
    setFilteredSeries(seriesIds);
  };
  
  // Filtrar as séries com base no filtro ativo
  const filteredWatchedSeries = activeFilter
    ? watchedSeries.filter(series => filteredSeries.includes(series.id))
    : watchedSeries;
  
  const filteredWatchlistSeries = activeFilter
    ? watchlistSeries.filter(series => filteredSeries.includes(series.id))
    : watchlistSeries;
  
  if (loading) {
    return (
      <div className="app-container">
        <Header title="Carregando..." showBackButton />
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="app-container">
        <Header title="Perfil não encontrado" showBackButton />
        <div className="text-center py-8">
          <p>Usuário não encontrado.</p>
          <Link to="/" className="text-primary mt-2 inline-block">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = user && (targetUserId === user.id);
  
  return (
    <div className="app-container">
      <Header title="Perfil" showBackButton />
      
      {/* Profile header */}
      <div className="flex items-center p-4">
        <img 
          src={profileUser.profilePic || "/placeholder.svg"} 
          alt={profileUser.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="ml-4">
          <h2 className="text-xl font-semibold">{profileUser.name}</h2>
          <p className="text-muted-foreground">
            <span>{watchedSeries.length} séries assistidas</span>
            <span className="mx-2">•</span>
            <span>{watchlistSeries.length} na lista</span>
            {watchingSeries.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <span>{watchingSeries.length} assistindo</span>
              </>
            )}
          </p>
        </div>
      </div>
      
      {/* Status filter (apenas para o próprio perfil) */}
      {isOwnProfile && (
        <SeriesStatusFilter 
          onFilterChange={handleFilterChange} 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
        />
      )}
      
      {/* Series tabs */}
      <Tabs defaultValue="watched" className="mt-2">
        <div className="flex justify-between items-center px-2">
          <TabsList>
            <TabsTrigger value="watched">Assistiu</TabsTrigger>
            <TabsTrigger value="watching">Assistindo</TabsTrigger>
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
        
        {/* Séries assistidas */}
        <TabsContent value="watched">
          {filteredWatchedSeries.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {filteredWatchedSeries.map(series => (
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
                {filteredWatchedSeries.map(series => (
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

        {/* Séries assistindo */}
        <TabsContent value="watching">
          {watchingSeries.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {watchingSeries.map(series => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    showRating={false}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {watchingSeries.map(series => (
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
                      <div className="flex items-center text-xs mt-1">
                        <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5">Assistindo</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "Você não está assistindo nenhuma série atualmente." 
                  : "Este usuário não está assistindo nenhuma série atualmente."}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Watchlist */}
        <TabsContent value="watchlist">
          {filteredWatchlistSeries.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {filteredWatchlistSeries.map(series => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    showRating={false}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {filteredWatchlistSeries.map(series => (
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
      
      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <Link to="/" className="nav-tab inactive p-3">
            <Home size={22} />
            <span>Início</span>
          </Link>
          <Link to="/search" className="nav-tab inactive p-3">
            <Search size={22} />
            <span>Busca</span>
          </Link>
          <Link to="/watched" className="nav-tab active p-3">
            <ListChecks size={22} />
            <span>Assistidos</span>
          </Link>
          <Link to="/watchlist" className="nav-tab inactive p-3">
            <ListPlus size={22} />
            <span>Quero ver</span>
          </Link>
          <Link to="/invite" className="nav-tab inactive p-3">
            <Users size={22} />
            <span>Amigos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
