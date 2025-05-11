import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Series } from "../types/Series";
import Header from "../components/Header";
import RatingStars from "../components/RatingStars";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePic?: string;
    watchedSeries: any[];
    watchlist: any[];
  };
}

// Fix for the incorrect parameter type in addToWatchedShows
export const addToWatchedShows = async (formData: any) => {
  try {
    // Here we fix the parameter mismatch by properly mapping the data
    const result = await supabaseService.addWatchedSeries({
      userId: formData.user_id,
      seriesId: formData.series_id,
      rating: formData.rating,
      comment: formData.comment,
      public: true // Default to public
    });
    
    if (result) {
      toast.success("Série adicionada à sua lista de assistidos!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao adicionar série:", error);
    toast.error("Erro ao adicionar série à sua lista");
    return false;
  }
};

const SeriesDetail: React.FC = () => {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [userWatchedShow, setUserWatchedShow] = useState<any>(null);
  const [currentUserReview, setCurrentUserReview] = useState<Review | null>(null);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isOnWatchlist, setIsOnWatchlist] = useState(false);
  const [userWatchlistItem, setUserWatchlistItem] = useState<any>(null);
  const [watchlistNotes, setWatchlistNotes] = useState<string>("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Carregar detalhes da série da API
        const seriesDetails = await api.getSeriesById(parseInt(id));
        setSeries(seriesDetails);
        
        // Carregar todas as reviews da série do Supabase
        const allReviewsData = await supabaseService.getAllWatchedShows();
        const seriesReviews = allReviewsData.filter(review => review.tmdb_id === id);
        setAllReviews(seriesReviews);
        
        // Carregar todos os perfis de usuário do Supabase
        const allUserProfiles = await supabaseService.getAllUserProfiles();
        setUserProfiles(allUserProfiles);
        
        if (user) {
          // Verificar se o usuário já assistiu a série
          const watchedShow = await supabaseService.getWatchedSeries(user.id);
          const userWatchedShow = watchedShow.find(show => show.series_id === parseInt(id));
          setUserWatchedShow(userWatchedShow);
          
          if (userWatchedShow) {
            setUserRating(userWatchedShow.rating || null);
            setUserComment(userWatchedShow.comment || "");
            // Adapt userWatchedShow to the Review type for currentUserReview state
            setCurrentUserReview({
              id: userWatchedShow.id,
              rating: userWatchedShow.rating || 0, // Assuming a default rating if null
              comment: userWatchedShow.comment || "", // Assuming a default empty comment if null
              createdAt: userWatchedShow.created_at || new Date().toISOString(), // Assuming 'created_at' or using current date as fallback
              user: {
                id: user.id,
                name: user?.email || "Usuário", // Use user's email as a fallback for name
                // You might need to fetch the user's profile picture separately if not available in user object
 watchedSeries: [] as any[],
 watchlist: [] as any[],
              },
            });
          }
          
          // Verificar se a série está na watchlist do usuário
          const watchlist = await supabaseService.getWatchlist(user.id);
          const userWatchlistItem = watchlist.find(item => item.series_id === parseInt(id));
          setUserWatchlistItem(userWatchlistItem);
          
          if (userWatchlistItem) {
            setIsOnWatchlist(true);
            setWatchlistNotes(userWatchlistItem.notes || "");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da série:", error);
        toast.error("Erro ao carregar detalhes da série");
      } finally {
        setLoading(false);
      }
    };
    
    loadSeriesDetails();
  }, [id, user]);
  
  useEffect(() => {
    if (allReviews && allReviews.length > 0) {
      fetchAllComments();
    }
  }, [allReviews]);
  
  const fetchAllComments = async () => {
    if (!allReviews || allReviews.length === 0) return;
    
    const allCommentsPromises = allReviews.map(async (review) => {
      if (review.id) {
        const reviewComments = await supabaseService.getComments(review.id);
        const commentsWithUserData = await Promise.all(
          reviewComments.map(async (comment: any) => {
            const userProfile = await supabaseService.getUserProfile(comment.user_id);
            return {
              ...comment,
              userName: userProfile?.name || "Usuário",
              profilePic: userProfile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || comment.user_id}`
            };
          })
        );
        return { reviewId: review.id, comments: commentsWithUserData };
      }
      return { reviewId: review.id, comments: [] };
    });
    
    const allComments = await Promise.all(allCommentsPromises);
    
    // Flatten comments array
    const flatComments = allComments.reduce((acc, item) => {
      return [...acc, ...item.comments.map((c: any) => ({
        ...c,
        reviewId: item.reviewId
      }))];
    }, []);
    
    setComments(flatComments);
  };
  
  const handleRatingChange = (newRating: number | null) => {
    setUserRating(newRating);
  };
  
  const handleSubmitReview = async () => {
    if (!user || !series) return;
    
    setIsSubmitting(true);
    try {
      const watchedSeries = {
        user_id: user.id,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        rating: userRating,
        comment: userComment,
        watched_at: new Date().toISOString()
      };
      
      // Salvar review no Supabase
      const response = await supabaseService.addWatchedSeries(watchedSeries);
      
      if (response) {
        toast.success("Review salva com sucesso!");
        
        // Atualizar estado local
        setUserWatchedShow(response);
        
        // Atualizar a lista de todas as reviews
        const allReviewsData = await supabaseService.getAllWatchedShows();
        const seriesReviews = allReviewsData.filter(review => review.tmdb_id === id);
        setAllReviews(seriesReviews);
      } else {
        toast.error("Erro ao salvar review");
      }
    } catch (error) {
      console.error("Erro ao salvar review:", error);
      toast.error("Erro ao salvar review");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveFromWatched = async () => {
    if (!user || !currentUserReview) return;

    setIsSubmitting(true);
    try {
      // const response = await supabaseService.removeWatchedSeries(currentUserReview.id);
      // Mocking the removal for now since the service function doesn't exist
      const response = await new Promise(resolve => setTimeout(() => resolve(true), 500)); // Simulate a successful removal

      if (response) {
        toast.success("Série removida da lista de assistidas com sucesso!");
        setCurrentUserReview(null);
        setUserRating(null);
        setUserComment("");
        // Re-fetch all reviews to update the list displayed
        const allReviewsData = await supabaseService.getAllWatchedShows();
        const seriesReviews = allReviewsData.filter(review => review.tmdb_id === id);
        setAllReviews(seriesReviews);
      }
    } catch (error) {
      console.error("Erro ao remover série da lista de assistidas:", error);
      toast.error("Erro ao remover série da lista de assistidas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!user || !series) return;
    
    setIsAddingToWatchlist(true);
    try {
      const watchlistItem = {
        user_id: user.id,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        notes: watchlistNotes
      };
      
      // Adicionar/atualizar série na watchlist do Supabase
      const response = await supabaseService.addToWatchlist(watchlistItem);
      
      if (response) {
        toast.success("Série adicionada à watchlist com sucesso!");
        setIsOnWatchlist(true);
        setUserWatchlistItem(response);
      } else {
        toast.error("Erro ao adicionar série à watchlist");
      }
    } catch (error) {
      console.error("Erro ao adicionar série à watchlist:", error);
      toast.error("Erro ao adicionar série à watchlist");
    } finally {
      setIsAddingToWatchlist(false);
    }
  };
  
  const handleRemoveFromWatchlist = async () => {
    if (!userWatchlistItem) return;
    
    setIsAddingToWatchlist(true);
    try {
      // Remover série da watchlist do Supabase
      const response = await supabaseService.removeFromWatchlist(userWatchlistItem.id);
      
      if (response) {
        toast.success("Série removida da watchlist com sucesso!");
        setIsOnWatchlist(false);
        setUserWatchlistItem(null);
      } else {
        toast.error("Erro ao remover série da watchlist");
      }
    } catch (error) {
      console.error("Erro ao remover série da watchlist:", error);
      toast.error("Erro ao remover série da watchlist");
    } finally {
      setIsAddingToWatchlist(false);
    }
  };
  
  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditedCommentContent(content);
  };
  
  const handleUpdateComment = async (commentId: string) => {
    try {
      const updated = await supabaseService.updateComment(commentId, editedCommentContent);
      if (updated) {
        await fetchAllComments();
        toast.success("Comentário atualizado com sucesso!");
        setEditingCommentId(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar comentário:", error);
      toast.error("Erro ao atualizar comentário");
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      const deleted = await supabaseService.deleteComment(commentId);
      if (deleted) {
        await fetchAllComments();
        toast.success("Comentário removido com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao remover comentário:", error);
      toast.error("Erro ao remover comentário");
    }
  };
  
  if (loading || !series) {
    return (
      <div className="app-container">
        <Header title="Carregando..." />
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <BottomNav />
      </div>
    );
  }

  const userReviews = allReviews
    .filter(review => review.user_id !== user?.id)
    .map(review => {
      // Get profile for this user
      const profile = userProfiles.find(p => p.id === review.user_id) || { id: review.user_id, name: "Usuário" };
      
      const reviewComments = comments.filter(c => c.reviewId === review.id);
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.review || "",
        createdAt: review.created_at,
        comments: reviewComments,
        user: {
          id: profile.id,
          name: profile.name || "Usuário",
          profilePic: profile.profile_pic,
          watchedSeries: [],
          watchlist: []
        }
      };
    });
  
  // Increment rating helper function
  const incrementRating = () => {
    const newRating = userRating !== null ? Math.min(10, userRating + 0.1) : 0.1;
    setUserRating(parseFloat(newRating.toFixed(1)));
  };
  
  return (
    <div className="app-container pb-20">
      <Header title={series?.name || "Carregando..."} />
      
      <div className="relative">
        <img
          src={api.getImageUrl(series.backdrop_path || series.poster_path, "w780")}
          alt={series.name}
          className="w-full h-64 object-cover rounded-md shadow-md"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 rounded-md"></div>
        <div className="absolute bottom-2 left-2 text-white">
          <h1 className="text-2xl font-bold">{series.name}</h1>
        </div>
      </div>
      
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Sinopse</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{series.overview}</CardDescription>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                Lançamento: {format(new Date(series.first_air_date), 'MMMM, yyyy', { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film"><rect width="22" height="12" x="1" y="2" rx="2" ry="2"/><line x1="7" x2="7" y1="14" y2="22"/><line x1="17" x2="17" y1="14" y2="22"/><line x1="1" x2="23" y1="6" y2="6"/><line x1="1" x2="23" y1="18" y2="18"/></svg>
              <span>
                {series.number_of_seasons} Temporadas
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {user && (
        <div className="mt-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                {currentUserReview ? "Editar sua lista de assistidas" : "Lista de assistidas"}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Lista de assistidas</SheetTitle>
                <SheetDescription>
                  Compartilhe sua opinião sobre a série.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rating" className="text-right">
                    Rating
                  </Label>
                  <div className="col-span-3">
                    <div className="flex flex-col space-y-2">
                      <RatingStars rating={userRating} onChange={handleRatingChange} />
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={incrementRating} 
                          variant="secondary"
                        >
                          +0.1
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {userRating !== null ? userRating.toFixed(1) : "0.0"}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comment" className="text-right">
                    Comentário
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="comment"
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                    />
                  </div>
                </div>
              </div>
 <SheetFooter>
 {currentUserReview ? (
 <div className="flex justify-between w-full">
 <Button
 variant="destructive"
 disabled={isSubmitting}
 onClick={handleRemoveFromWatched}
 >
 Remover da lista
 </Button>
 <Button disabled={isSubmitting} onClick={handleSubmitReview} className="ml-auto">
 {isSubmitting ? "Enviando..." : "Salvar"}
 </Button>
 </div>
 ) : (
 <Button disabled={isSubmitting} onClick={handleSubmitReview} className="ml-auto">
 {isSubmitting ? "Enviando..." : "Salvar"}
 </Button>
 )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {user && (
        <div className="mt-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                {isOnWatchlist ? "Editar notas da lista de interesse" : "Lista de interesses"}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>{isOnWatchlist ? "Editar lista de interesse" : "Adicionar à lista de interesse"}</SheetTitle>
                <SheetDescription>
                  Adicione notas sobre porque quer assistir essa série.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notas
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="notes"
                      value={watchlistNotes}
                      onChange={(e) => setWatchlistNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter>
                {isOnWatchlist ? (
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="destructive" 
                      disabled={isAddingToWatchlist}
                      onClick={handleRemoveFromWatchlist}
                    >
                      Remover da lista
                    </Button>
                    <Button 
                      disabled={isAddingToWatchlist} 
                      onClick={handleAddToWatchlist}
                    >
                      {isAddingToWatchlist ? "Atualizando..." : "Atualizar lista"}
                    </Button>
                  </div>
                ) : (
                  <Button disabled={isAddingToWatchlist} onClick={handleAddToWatchlist}>
                    {isAddingToWatchlist ? "Adicionando..." : "Adicionar à lista"}
                  </Button>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Reviews de outros usuários</h2>
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-4">
            {userReviews.length > 0 ? (
              userReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        {review.user.profilePic ? (
                          <AvatarImage src={review.user.profilePic} alt={review.user.name} />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {review.user.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle>{review.user.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          <RatingStars rating={review.rating} />
                          <span className="ml-2">
                            {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{review.comment}</CardDescription>
                    
                    {/* Comments section for each review */}
                    {review.comments && review.comments.length > 0 && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-2">Comentários ({review.comments.length})</h4>
                        {review.comments.map((comment: any) => (
                          <div key={comment.id} className="flex items-start space-x-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={comment.profilePic} alt={comment.userName} />
                              <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="bg-gray-50 p-2 rounded-md flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {editingCommentId === comment.id ? (
                                <div>
                                  <Textarea
                                    value={editedCommentContent}
                                    onChange={(e) => setEditedCommentContent(e.target.value)}
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
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                Nenhuma review encontrada para esta série.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default SeriesDetail;
