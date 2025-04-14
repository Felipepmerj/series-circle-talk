
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Plus, Check, Star } from "lucide-react";
import Header from "../components/Header";
import SeriesDetailHeader from "../components/SeriesDetailHeader";
import RatingStars from "../components/RatingStars";
import { api } from "../services/api";
import { Series, SeriesReview, User } from "../types/Series";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<(SeriesReview & { user: User })[]>([]);
  
  // Demo user - In a real app, this would come from authentication
  const currentUserId = "user1";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Review dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [watchedDate, setWatchedDate] = useState("");
  
  // Watchlist dialog states
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);
  const [watchlistNote, setWatchlistNote] = useState("");
  
  // Check if the user has already reviewed or added to watchlist
  const [userReview, setUserReview] = useState<SeriesReview | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  
  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Fetch series details
        const seriesData = await api.getSeriesById(Number(id));
        if (seriesData) {
          setSeries(seriesData);
          
          // Fetch all users for reviews
          const usersData = await api.getUsers();
          const user = usersData.find(u => u.id === currentUserId);
          setCurrentUser(user || null);
          
          // Collect reviews from all users
          const allReviews: (SeriesReview & { user: User })[] = [];
          
          for (const user of usersData) {
            const userReviews = user.watchedSeries
              .filter(review => review.seriesId === Number(id))
              .map(review => ({
                ...review,
                user
              }));
              
            allReviews.push(...userReviews);
            
            // Check if current user has reviewed
            if (user.id === currentUserId) {
              const review = user.watchedSeries.find(r => r.seriesId === Number(id));
              if (review) {
                setUserReview(review);
                setRating(review.rating);
                setComment(review.comment);
                if (review.watchedOn) {
                  setWatchedDate(review.watchedOn);
                }
              }
              
              // Check if in watchlist
              const watchlistItem = user.watchlist.find(w => w.seriesId === Number(id));
              setInWatchlist(!!watchlistItem);
              if (watchlistItem?.note) {
                setWatchlistNote(watchlistItem.note);
              }
            }
          }
          
          // Sort by most recent
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
  }, [id, currentUserId]);
  
  // Check if action is specified in URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'watched') {
      setShowReviewDialog(true);
    } else if (action === 'watchlist') {
      setShowWatchlistDialog(true);
    }
  }, [searchParams]);
  
  const handleAddReview = async () => {
    if (!series) return;
    
    try {
      const newReview = await api.addReview(
        currentUserId,
        series.id,
        rating,
        comment,
        watchedDate
      );
      
      // In a real app, this would update the server and then refresh data
      // For now, we'll update the UI directly
      setUserReview(newReview);
      
      // Update the reviews list
      if (currentUser) {
        const updatedReviews = [...reviews];
        const existingReviewIndex = updatedReviews.findIndex(
          r => r.userId === currentUserId && r.seriesId === series.id
        );
        
        if (existingReviewIndex >= 0) {
          // Replace existing review
          updatedReviews[existingReviewIndex] = {
            ...newReview,
            user: currentUser
          };
        } else {
          // Add new review
          updatedReviews.unshift({
            ...newReview,
            user: currentUser
          });
        }
        
        setReviews(updatedReviews);
      }
      
      setShowReviewDialog(false);
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };
  
  const handleAddToWatchlist = async () => {
    if (!series) return;
    
    try {
      const newWatchlistItem = await api.addToWatchlist(
        currentUserId,
        series.id,
        watchlistNote
      );
      
      // In a real app, this would update the server
      setInWatchlist(true);
      setShowWatchlistDialog(false);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
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
      
      {/* Synopsis */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-medium mb-2">Sinopse</h2>
        <p className="text-sm">{series.overview}</p>
      </div>
      
      {/* Action buttons */}
      <div className="px-4 mt-6 flex gap-3">
        {userReview ? (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowReviewDialog(true)}
          >
            <Check size={16} className="mr-2" /> 
            Já Assisti ({userReview.rating}/10)
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowReviewDialog(true)}
          >
            <Check size={16} className="mr-2" /> 
            Marcar como assistido
          </Button>
        )}
        
        {inWatchlist ? (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowWatchlistDialog(true)}
          >
            <Check size={16} className="mr-2" /> 
            Na sua lista
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowWatchlistDialog(true)}
          >
            <Plus size={16} className="mr-2" /> 
            Quero assistir
          </Button>
        )}
      </div>
      
      {/* Friends reviews */}
      <div className="mt-8 px-4">
        <h2 className="text-lg font-medium mb-4">O que seus amigos acharam</h2>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div 
                key={review.id} 
                className={`p-4 rounded-lg border ${review.userId === currentUserId ? 'bg-accent' : 'bg-white'}`}
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
      
      {/* Review Dialog */}
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
      
      {/* Watchlist Dialog */}
      <Dialog open={showWatchlistDialog} onOpenChange={setShowWatchlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à sua lista</DialogTitle>
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
            
            <Button onClick={handleAddToWatchlist} className="w-full">
              {inWatchlist ? "Atualizar nota" : "Adicionar à lista"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeriesDetail;
