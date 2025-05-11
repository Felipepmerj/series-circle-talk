
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Users } from "lucide-react";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { supabaseService } from "../services/supabaseService";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

interface FriendProfile {
  id: string;
  name: string;
  profile_pic: string | null;
  topSeries?: {
    id: number;
    title: string;
    poster_path: string | null;
    rating: number;
  }[];
}

const Invite: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfilesWithTopSeries = async () => {
      try {
        setLoading(true);
        const profiles = await supabaseService.getAllProfiles();
        
        // Filtrar o usuário atual da lista
        const filteredProfiles = profiles.filter(profile => 
          user ? profile.id !== user.id : true
        );
        
        // Buscar as 5 séries mais bem avaliadas de cada amigo
        const profilesWithTopSeries = await Promise.all(
          filteredProfiles.map(async (profile) => {
            try {
              // Buscar séries assistidas por este perfil
              const watchedShows = await supabaseService.getWatchedSeries(profile.id);
              
              // Filtrar séries com avaliações e ordenar por nota (mais alta primeiro)
              const ratedShows = watchedShows
                .filter(show => show.rating !== null)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0));
              
              // Pegar as 5 melhores séries
              const topSeries = await Promise.all(
                ratedShows.slice(0, 5).map(async (show) => {
                  try {
                    // Use the series_id property that was added by our mapper
                    const seriesDetails = await api.getSeriesById(show.series_id);
                    return {
                      id: show.series_id,
                      title: seriesDetails?.name || `Série ${show.series_id}`,
                      poster_path: seriesDetails?.poster_path,
                      rating: show.rating || 0
                    };
                  } catch (error) {
                    console.error(`Erro ao buscar detalhes da série ${show.series_id}:`, error);
                    return {
                      id: show.series_id,
                      title: `Série ${show.series_id}`,
                      poster_path: null,
                      rating: show.rating || 0
                    };
                  }
                })
              );
              
              return {
                ...profile,
                topSeries
              };
            } catch (error) {
              console.error(`Erro ao buscar séries para o perfil ${profile.id}:`, error);
              return { ...profile, topSeries: [] };
            }
          })
        );
        
        setFriends(profilesWithTopSeries);
      } catch (error) {
        console.error("Erro ao buscar perfis:", error);
        toast.error("Não foi possível carregar a lista de amigos");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfilesWithTopSeries();
  }, [user]);
  
  const appUrl = window.location.origin;
  const inviteLink = `${appUrl}/register?invitedBy=${user?.id || 'user'}`;
  
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Junte-se a mim no SeriesTalk para compartilharmos nossas experiências sobre séries! ${inviteLink}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <div className="app-container pb-20">
      <Header title="Amigos" showBackButton />
      
      {/* Invite section */}
      <div className="bg-white rounded-lg shadow p-4 mt-4">
        <h2 className="text-lg font-medium mb-4">Convidar amigos</h2>
        
        <Button 
          variant="default" 
          className="flex w-full bg-green-600 hover:bg-green-700"
          onClick={handleShareWhatsApp}
        >
          <MessageSquare size={16} className="mr-2" />
          Compartilhar via WhatsApp
        </Button>
      </div>
      
      {/* Friends list */}
      <div className="mt-6 mb-20">
        <h2 className="text-lg font-medium mb-3">
          {loading ? "Carregando..." : `Usuários (${friends.length})`}
        </h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">Carregando usuários...</div>
          ) : friends.length > 0 ? (
            <div className="divide-y">
              {friends.map((friend) => (
                <div key={friend.id} className="p-4">
                  <Link 
                    to={`/profile/${friend.id}`}
                    className="flex items-center hover:bg-muted/10"
                  >
                    <img 
                      src={friend.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name || friend.id}`} 
                      alt={friend.name || "Usuário"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <p className="ml-3 font-medium">{friend.name || "Usuário"}</p>
                  </Link>
                  
                  {friend.topSeries && friend.topSeries.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Séries mais bem avaliadas:</p>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {friend.topSeries.map(series => (
                          <Link 
                            key={`${friend.id}-${series.id}`}
                            to={`/series/${series.id}`}
                            className="flex-shrink-0 w-16 text-center"
                          >
                            <img 
                              src={series.poster_path ? api.getImageUrl(series.poster_path, "w92") : "/placeholder.svg"}
                              alt={series.title}
                              className="w-full rounded-md shadow-sm mb-1"
                            />
                            <div className="flex items-center justify-center text-xs font-bold text-yellow-500">
                              ★ {series.rating.toFixed(1)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Sem avaliações de séries</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users size={40} className="mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Nenhum usuário encontrado
              </p>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Invite;
