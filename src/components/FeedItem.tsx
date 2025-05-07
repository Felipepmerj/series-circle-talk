import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../services/api";
import { Series } from "../types/Series";
import RatingStars from "./RatingStars";
import { supabaseService } from "../services/supabaseService";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface FeedItemProps {
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
  username?: string;
  seriesName?: string;
  userProfilePic?: string;
}

const FeedItem: React.FC<FeedItemProps> = ({
  userId,
  seriesId,
  type,
  timestamp,
  reviewId,
  watchlistItemId,
  username,
  seriesName,
  userProfilePic
}) => {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(userProfilePic || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar informações da série
        const seriesData = await api.getSeriesById(seriesId);
        if (seriesData) setSeries(seriesData);
        
        // Se for um review, obter detalhes adicionais do Supabase
        if (type === 'review' && reviewId) {
          const reviewDetails = await supabaseService.getWatchedShowDetails(reviewId);
          
          if (reviewDetails) {
            setRating(reviewDetails.rating);
            setComment(reviewDetails.comment);
          }
        }
        
        // Se não tiver foto de perfil, usar o avatar gerado
        if (!profilePic) {
          setProfilePic(`https://api.dicebear.com/7.x/initials/svg?seed=${username || userId}`);
        }
      } catch (error) {
        console.error("Error fetching feed item data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, seriesId, type, reviewId, watchlistItemId, username, profilePic]);
  
  if (loading || !series) {
    return <div className="p-4 border rounded-lg animate-pulse bg-muted/50 mb-4">Carregando...</div>;
  }
  
  // Formato ano apenas
  const yearWatched = new Date(timestamp).getFullYear();

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
      {/* User info */}
      <div className="flex items-center p-4 border-b">
        <Link to={`/profile/${userId}`} className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profilePic || ""} alt={username || "Usuário"} />
            <AvatarFallback>
              {(username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h4 className="font-medium">{username || "Usuário"}</h4>
            <p className="text-xs text-muted-foreground">{yearWatched}</p>
          </div>
        </Link>
      </div>
      
      {/* Series info */}
      <div className="p-4">
        <div className="flex">
          <Link to={`/series/${series.id}`} className="flex-shrink-0 w-16">
            <img 
              src={api.getImageUrl(series.poster_path, "w185")} 
              alt={series.name}
              className="rounded-md shadow"
            />
          </Link>
          <div className="ml-4">
            <Link to={`/series/${series.id}`} className="hover:underline">
              <h3 className="font-medium">{seriesName || series.name}</h3>
            </Link>
            
            {type === 'review' && (
              <>
                <div className="mt-1">
                  <RatingStars rating={rating || 0} />
                </div>
                {comment && <p className="mt-2 text-sm">{comment}</p>}
              </>
            )}
            
            {type === 'added-to-watchlist' && (
              <p className="mt-1 text-sm">
                Adicionou à lista "Quero assistir"
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Interaction buttons */}
      <div className="px-4 py-2 border-t">
        <button 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircle size={18} className="mr-1" />
          Comentar
        </button>
      </div>
    </div>
  );
};

export default FeedItem;
