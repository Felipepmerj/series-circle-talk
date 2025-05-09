
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../services/api";
import { Series } from "../types/Series";
import RatingStars from "./RatingStars";
import { supabaseService } from "../services/supabaseService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface FeedItemProps {
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
  username?: string;
  seriesName?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  userName?: string;
  profilePic?: string;
}

const FeedItem: React.FC<FeedItemProps> = ({
  userId,
  seriesId,
  type,
  timestamp,
  reviewId,
  watchlistItemId,
  username,
  seriesName
}) => {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch series information
        const seriesData = await api.getSeriesById(seriesId);
        if (seriesData) setSeries(seriesData);
        
        // If it's a review, get additional details from Supabase
        if (type === 'review' && reviewId) {
          // Get review details directly from Supabase
          const reviewDetails = await supabaseService.getWatchedShowDetails(reviewId);
          
          if (reviewDetails) {
            setRating(reviewDetails.rating);
            setComment(reviewDetails.comment);
            
            // Fetch comments for this review
            await fetchComments(reviewId);
          }
        }
        
        // Fetch user's avatar from Supabase
        const userProfile = await supabaseService.getUserProfile(userId);
        if (userProfile && userProfile.profile_pic) {
          setProfilePic(userProfile.profile_pic);
        } else {
          // Fallback to generated avatar
          setProfilePic(`https://api.dicebear.com/7.x/initials/svg?seed=${username || userId}`);
        }
      } catch (error) {
        console.error("Error fetching feed item data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, seriesId, type, reviewId, watchlistItemId, username]);

  const fetchComments = async (watchedShowId: string) => {
    setLoadingComments(true);
    try {
      const commentsList = await supabaseService.getComments(watchedShowId);
      
      // Fetch user profiles for each comment
      const commentsWithProfiles = await Promise.all(
        commentsList.map(async (comment: any) => {
          const userProfile = await supabaseService.getUserProfile(comment.user_id);
          return {
            ...comment,
            userName: userProfile?.name || "Usuário",
            profilePic: userProfile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || comment.user_id}`
          };
        })
      );
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentClick = () => {
    setShowCommentForm(!showCommentForm);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      // Save comment to Supabase
      const savedComment = await supabaseService.addComment({
        content: newComment,
        watched_show_id: reviewId,
        public: true
      });
      
      if (savedComment && reviewId) {
        // Refresh comments list
        await fetchComments(reviewId);
      }
      
      toast.success("Comentário adicionado com sucesso!");
      setNewComment("");
      setShowCommentForm(false);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading || !series) {
    return <div className="p-4 border rounded-lg animate-pulse bg-muted/50 mb-4">Carregando...</div>;
  }
  
  // Format year only
  const yearWatched = new Date(timestamp).getFullYear();

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
      {/* User info */}
      <div className="flex items-center p-4 border-b">
        <Link to={`/profile/${userId}`} className="flex items-center">
          <img 
            src={profilePic || "/placeholder.svg"} 
            alt={username || "Usuário"}
            className="w-10 h-10 rounded-full object-cover"
          />
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
      
      {/* Comments section */}
      {comments.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Comentários ({comments.length})</h4>
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profilePic} alt={comment.userName} />
                  <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-white p-2 rounded-md shadow-sm flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <Link to={`/profile/${comment.user_id}`} className="text-xs font-medium">
                      {comment.userName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Interaction buttons */}
      <div className="px-4 py-3 border-t">
        <button 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={handleCommentClick}
        >
          <MessageCircle size={18} className="mr-1" />
          Comentar
        </button>
        
        {/* Comment form */}
        {showCommentForm && (
          <div className="mt-3">
            <Textarea
              placeholder="Escreva seu comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCommentForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedItem;
