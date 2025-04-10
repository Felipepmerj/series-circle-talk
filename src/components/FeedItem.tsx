
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../services/api";
import { User, Series, SeriesReview, WatchlistItem } from "../types/Series";
import RatingStars from "./RatingStars";

interface FeedItemProps {
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
}

const FeedItem: React.FC<FeedItemProps> = ({
  userId,
  seriesId,
  type,
  timestamp,
  reviewId,
  watchlistItemId
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [review, setReview] = useState<SeriesReview | null>(null);
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user and series data
        const userData = await api.getUserById(userId);
        const seriesData = await api.getSeriesById(seriesId);
        
        if (userData) setUser(userData);
        if (seriesData) setSeries(seriesData);
        
        // If it's a review, find the review data
        if (type === 'review' && reviewId && userData) {
          const userReview = userData.watchedSeries.find(r => r.id === reviewId);
          if (userReview) setReview(userReview);
        }
        
        // If it's a watchlist item, find the watchlist data
        if (type === 'added-to-watchlist' && watchlistItemId && userData) {
          const userWatchlistItem = userData.watchlist.find(w => w.id === watchlistItemId);
          if (userWatchlistItem) setWatchlistItem(userWatchlistItem);
        }
      } catch (error) {
        console.error("Error fetching feed item data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, seriesId, type, reviewId, watchlistItemId]);
  
  if (loading || !user || !series) {
    return <div className="p-4 border rounded-lg animate-pulse bg-muted/50">Carregando...</div>;
  }
  
  const formattedDate = new Date(timestamp).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
      {/* User info */}
      <div className="flex items-center p-4 border-b">
        <Link to={`/profile/${user.id}`} className="flex items-center">
          <img 
            src={user.profilePic || "/placeholder.svg"} 
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <h4 className="font-medium">{user.name}</h4>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
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
              <h3 className="font-medium">{series.name}</h3>
            </Link>
            
            {type === 'review' && review && (
              <>
                <div className="mt-1">
                  <RatingStars rating={review.rating} />
                </div>
                <p className="mt-2 text-sm">{review.comment}</p>
              </>
            )}
            
            {type === 'added-to-watchlist' && (
              <p className="mt-1 text-sm">
                Adicionou à lista "Quero assistir"
                {watchlistItem?.note && (
                  <span className="block mt-1 italic text-muted-foreground">
                    "{watchlistItem.note}"
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Interaction buttons */}
      <div className="px-4 py-3 border-t">
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
