
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
import { Calendar } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
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
    if (userWatchedShow && userProfiles.length > 0 && user) {
      const currentUserProfile = userProfiles.find(p => p.id === user.id);
      
      if (currentUserProfile) {
        setCurrentUserReview({
          id: userWatchedShow.id,
          rating: userWatchedShow.rating || 0,
          comment: userWatchedShow.comment || "",
          createdAt: userWatchedShow.created_at,
          user: {
            id: currentUserProfile.id,
            name: currentUserProfile.name || "Você",
            profilePic: currentUserProfile.profile_pic,
            watchedSeries: [],
            watchlist: []
          }
        });
      }
    }
  }, [userWatchedShow, userProfiles, user]);
  
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
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.review || "",
        createdAt: review.created_at,
        user: {
          id: profile.id,
          name: profile.name || "Usuário",
          profilePic: profile.profile_pic, // Using profile_pic from the UserProfile
          watchedSeries: [], // We don't need these for the display
          watchlist: []
        }
      };
    });
  
  return (
    <div className="app-container pb-20">
      <Header title={series.name} />
      
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
              <Button variant="outline">
                {currentUserReview ? "Editar sua Review" : "Adicionar Review"}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Adicionar sua Review</SheetTitle>
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
                    <RatingStars rating={userRating} onChange={handleRatingChange} />
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
                <Button disabled={isSubmitting} onClick={handleSubmitReview}>
                  {isSubmitting ? "Enviando..." : "Salvar"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {user && (
        <div className="mt-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {isOnWatchlist ? "Editar notas da Watchlist" : "Adicionar à Watchlist"}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>{isOnWatchlist ? "Editar Watchlist" : "Adicionar à Watchlist"}</SheetTitle>
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
                      Remover da Watchlist
                    </Button>
                    <Button 
                      disabled={isAddingToWatchlist} 
                      onClick={handleAddToWatchlist}
                    >
                      {isAddingToWatchlist ? "Atualizando..." : "Atualizar Watchlist"}
                    </Button>
                  </div>
                ) : (
                  <Button disabled={isAddingToWatchlist} onClick={handleAddToWatchlist}>
                    {isAddingToWatchlist ? "Adicionando..." : "Adicionar à Watchlist"}
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
