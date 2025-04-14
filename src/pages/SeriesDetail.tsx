import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Plus, Check, Star, Play } from "lucide-react";
import Header from "../components/Header";
import SeriesDetailHeader from "../components/SeriesDetailHeader";
import RatingStars from "../components/RatingStars";
import { api } from "../services/api";
import { Series, SeriesReview, User } from "../types/Series";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { useSeriesStatus } from "../hooks/useSeriesStatus";
import SeriesStatusBadge from "../components/SeriesStatusBadge";
import { toast } from "sonner";
import { SeriesStatus, seriesStatusService } from "../services/seriesStatusService";

const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<(SeriesReview & { user: User })[]>([]);
  
  const { status, updateStatus, loading: statusLoading } = useSeriesStatus(Number(id));
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [watchedDate, setWatchedDate] = useState("");
  
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);
  const [watchlistNote, setWatchlistNote] = useState("");
  
  const [userReview, setUserReview] = useState<SeriesReview | null>(null);
  
  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        const seriesData = await api.getSeriesById(Number(id));
        if (seriesData) {
          setSeries(seriesData);
          
          const usersData = await api.getUsers();
          const currentUser = usersData.find(u => u.id === (user?.id || 'user1'));
          
          const allReviews: (SeriesReview & { user: User })[] = [];
          
          for (const user of usersData) {
            const userReviews = user.watchedSeries
              .filter(review => review.seriesId === Number(id))
              .map(review => ({
                ...review,
                user
              }));
              
            allReviews.push(...userReviews);
            
            if (currentUser && user.id === currentUser.id) {
              const review = user.watchedSeries.find(r => r.seriesId === Number(id));
              if (review) {
                setUserReview(review);
                setRating(review.rating);
                setComment(review.comment);
                if (review.watchedOn) {
                  setWatchedDate(review.watchedOn);
                }
              }
              
              const watchlistItem = user.watchlist.find(w => w.seriesId === Number(id));
              if (watchlistItem?.note) {
                setWatchlistNote(watchlistItem.note);
              }
            }
          }
          
          allReviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setReviews(allReviews);
        }
      } catch (error) {
        console.error("Error fetching series details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeriesDetails();
  }, [id, user?.id]);
  
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'watched') {
      setShowReviewDialog(true);
    } else if (action === 'watchlist') {
      setShowWatchlistDialog(true);
    }
  }, [searchParams]);
  
  const handleAddReview = async () => {
    if (!series || !user) {
      toast.error("Você precisa estar logado para avaliar");
      return;
    }
    
    try {
      await updateStatus("assistido");
      
      const newReview = await api.addReview(
        user.id || 'user1',
        series.id,
        rating,
        comment,
        watchedDate
      );
      
      setUserReview(newReview);
      
      const currentUser = await api.getUserById(user.id || 'user1');
      if (currentUser) {
        const updatedReviews = [...reviews];
        const existingReviewIndex = updatedReviews.findIndex(
          r => r.userId === user.id && r.seriesId === series.id
        );
        
        if (existingReviewIndex >= 0) {
          updatedReviews[existingReviewIndex] = {
            ...newReview,
            user: currentUser
          };
        } else {
          updatedReviews.unshift({
            ...newReview,
            user: currentUser
          });
        }
        
        setReviews(updatedReviews);
      }
      
      setShowReviewDialog(false);
      toast.success("Avaliação adicionada com sucesso");
    } catch (error) {
      console.error("Error adding review:", error);
      toast.error("Erro ao adicionar avaliação");
    }
  };
  
  const handleAddToWatchlist = async () => {
    if (!series || !user) {
      toast.error("Você precisa estar logado para adicionar à lista");
      return;
    }
    
    try {
      await updateStatus("watchlist");
      
      const newWatchlistItem = await api.addToWatchlist(
        user.id || 'user1',
        series.id,
        watchlistNote
      );
      
      setShowWatchlistDialog(false);
      toast.success("Adicionado à sua lista com sucesso");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Erro ao adicionar à lista");
    }
  };
  
  const handleSetWatching = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para realizar esta ação");
      return;
    }
    
    try {
      await updateStatus("assistindo");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };
  
  if (loading || !series) {
    return (
      <div className="app-container">
        <Header title="Carregando..." showBackButton />
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-40 bg-muted rounded-lg"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-24">
      <Header title={series.name} showBackButton />
      
      <SeriesDetailHeader series={series} />
      
      {status && (
        <div className="px-4 mt-2">
          <SeriesStatusBadge seriesId={series.id} />
        </div>
      )}
      
      <div className="px-4 mt-4">
        <h2 className="text-lg font-medium mb-2">Sinopse</h2>
        <p className="text-sm">{series.overview}</p>
      </div>
      
      <div className="px-4 mt-6 flex gap-3">
        {status === "assistido" ? (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowReviewDialog(true)}
          >
            <Check size={16} className="mr-2" /> 
            Já Assisti{userReview ? ` (${userReview.rating}/10)` : ""}
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowReviewDialog(true)}
            disabled={statusLoading}
          >
            <Check size={16} className="mr-2" /> 
            Marcar como assistido
          </Button>
        )}
        
        {status === "watchlist" ? (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowWatchlistDialog(true)}
          >
            <Check size={16} className="mr-2" /> 
            Na sua lista
          </Button>
        ) : status === "assistindo" ? (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowWatchlistDialog(true)}
          >
            <Play size={16} className="mr-2" /> 
            Assistindo
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowWatchlistDialog(true)}
            disabled={statusLoading}
          >
            <Plus size={16} className="mr-2" /> 
            Quero assistir
          </Button>
        )}
        
        {status !== "assistindo" && (
          <Button
            variant={status === "assistindo" ? "outline" : "secondary"}
            className="flex items-center justify-center"
            onClick={handleSetWatching}
            disabled={statusLoading || status === "assistindo"}
          >
            <Play size={16} /> 
          </Button>
        )}
      </div>
      
      <div className="mt-8 px-4">
        <h2 className="text-lg font-medium mb-4">O que seus amigos acharam</h2>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div 
                key={review.id} 
                className={`p-4 rounded-lg border ${review.userId === (user?.id || 'user1') ? 'bg-accent' : 'bg-white'}`}
              >
                <div className="flex items-center">
                  <img 
                    src={review.user.profilePic || "/placeholder.svg"} 
                    alt={review.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <h4 className="font-medium">{review.user.name}</h4>
                    <RatingStars rating={review.rating} size={16} />
                  </div>
                </div>
                <p className="mt-3 text-sm">{review.comment}</p>
                {review.watchedOn && (
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <Calendar size={12} className="mr-1" />
                    Assistido em {new Date(review.watchedOn).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Star size={30} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Ninguém avaliou esta série ainda. Seja o primeiro!
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliação de {series.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sua nota:</label>
              <div className="flex justify-center py-2">
                <RatingStars 
                  rating={rating} 
                  onChange={setRating} 
                  size={32}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Comentário:</label>
              <Textarea 
                placeholder="O que você achou da série..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data que assistiu:</label>
              <Input 
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
              />
            </div>
            
            <Button onClick={handleAddReview} className="w-full">
              {userReview ? "Atualizar avaliação" : "Adicionar avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showWatchlistDialog} onOpenChange={setShowWatchlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {status === "watchlist" 
                ? "Atualizar nota" 
                : status === "assistindo"
                ? "Atualizar status de 'Assistindo'"
                : "Adicionar à sua lista"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Por que você quer assistir:</label>
              <Textarea 
                placeholder="Recomendação de um amigo, continuação de outra série..."
                value={watchlistNote}
                onChange={(e) => setWatchlistNote(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleAddToWatchlist} 
                className="flex-1"
                variant={status === "watchlist" ? "outline" : "default"}
              >
                {status === "watchlist" ? "Atualizar nota" : "Quero assistir"}
              </Button>
              
              <Button 
                onClick={handleSetWatching} 
                className="flex-1"
                variant={status === "assistindo" ? "outline" : "secondary"}
              >
                <Play size={16} className="mr-2" /> 
                {status === "assistindo" ? "Já estou assistindo" : "Estou assistindo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeriesDetail;
