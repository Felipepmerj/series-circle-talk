import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Edit, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { Series } from "../types/Series";
import RatingStars from "./RatingStars";
import { supabaseService } from "../services/supabaseService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "../hooks/useAuth";

interface FeedItemProps {
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
  username?: string;
  seriesName?: string;
  onCommentAdded?: () => void;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  userName?: string;
  profilePic?: string;
}

const INITIAL_COMMENTS_LIMIT = 4;
const COMMENTS_PER_LOAD = 10;

const FeedItem: React.FC<FeedItemProps> = ({
  userId,
  seriesId,
  type,
  timestamp,
  reviewId,
  watchlistItemId,
  username,
  seriesName,
  onCommentAdded
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState("");
  const [visibleComments, setVisibleComments] = useState<number>(INITIAL_COMMENTS_LIMIT);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const { user } = useAuth();

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
            setComment(reviewDetails.review);
            
            // Fetch comments for this review
            await fetchComments(reviewId, 'watched_show_id');
          }
        }
        
        // If it's a watchlist item, get additional details and comments
        if (type === 'added-to-watchlist' && watchlistItemId) {
          const watchlistDetails = await supabaseService.getWatchlistItemDetails(watchlistItemId);
          
          if (watchlistDetails) {
            setComment(watchlistDetails.note);
            
            // Fetch comments for this watchlist item
            await fetchComments(watchlistItemId, 'watchlist_item_id');
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

  const fetchComments = async (itemId: string, idField: 'watched_show_id' | 'watchlist_item_id') => {
    setLoadingComments(true);
    try {
      // Get comments for either watched show or watchlist item
      const commentsList = await supabaseService.getComments(itemId, idField);
      
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
    if (!newComment.trim() || !user) return;
    
    setSubmitting(true);
    try {
      // Save comment to Supabase
      const commentData: any = {
        content: newComment,
        user_id: user.id,
        public: true
      };
      
      // Set the appropriate ID field based on item type
      if (type === 'review' && reviewId) {
        commentData.watched_show_id = reviewId;
      } else if (type === 'added-to-watchlist' && watchlistItemId) {
        commentData.watchlist_item_id = watchlistItemId;
      }
      
      const savedComment = await supabaseService.addComment(commentData);
      
      if (savedComment) {
        // Refresh comments list
        if (type === 'review' && reviewId) {
          await fetchComments(reviewId, 'watched_show_id');
        } else if (type === 'added-to-watchlist' && watchlistItemId) {
          await fetchComments(watchlistItemId, 'watchlist_item_id');
        }
        
        // Notify parent component to refresh the feed
        onCommentAdded?.();
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

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditedComment(content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editedComment.trim()) return;
    
    try {
      const updated = await supabaseService.updateComment(commentId, editedComment);
      if (updated) {
        if (type === 'review' && reviewId) {
          await fetchComments(reviewId, 'watched_show_id');
        } else if (type === 'added-to-watchlist' && watchlistItemId) {
          await fetchComments(watchlistItemId, 'watchlist_item_id');
        }
        
        toast.success("Comentário atualizado com sucesso!");
        setEditingCommentId(null);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Erro ao atualizar comentário");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const deleted = await supabaseService.deleteComment(commentId);
      if (deleted) {
        if (type === 'review' && reviewId) {
          await fetchComments(reviewId, 'watched_show_id');
        } else if (type === 'added-to-watchlist' && watchlistItemId) {
          await fetchComments(watchlistItemId, 'watchlist_item_id');
        }
        
        toast.success("Comentário removido com sucesso!");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao remover comentário");
    }
  };

  const handleLoadMoreComments = () => {
    setVisibleComments(prev => prev + COMMENTS_PER_LOAD);
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
              <>
                <p className="mt-1 text-sm">
                  Adicionou à lista "Quero assistir"
                </p>
                {comment && <p className="mt-2 text-sm italic">"{comment}"</p>}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Comments section */}
      {comments.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Comentários ({comments.length})</h4>
          <div className="space-y-3">
            {comments.slice(0, visibleComments).map(comment => (
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
                  
                  {editingCommentId === comment.id ? (
                    <div>
                      <Textarea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                        className="mb-2 text-sm"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.id)}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.content}</p>
                      {user && user.id === comment.user_id && (
                        <div className="flex justify-end space-x-2 mt-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditComment(comment.id, comment.content)}
                            className="h-6 px-2"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Load more comments button */}
          {comments.length > visibleComments && (
            <div className="mt-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMoreComments}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Ver mais {Math.min(COMMENTS_PER_LOAD, comments.length - visibleComments)} comentários
              </Button>
            </div>
          )}
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
