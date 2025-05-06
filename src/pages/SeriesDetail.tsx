
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Plus, Check, Star, Bug } from "lucide-react";
import Header from "../components/Header";
import SeriesDetailHeader from "../components/SeriesDetailHeader";
import RatingStars from "../components/RatingStars";
import { api } from "../services/api";
import { Series, SeriesReview, User } from "../types/Series";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { supabaseService, WatchedSeries, WatchlistItem } from "../services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<(SeriesReview & { user: User })[]>([]);
  
  // Demo user - In a real app, this would come from authentication
  const currentUserId = user?.id || "user1";
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
  const [watchedId, setWatchedId] = useState<string | null>(null);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  
  // Debug dialog
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [isDebugEnabled, setIsDebugEnabled] = useState(supabaseService.debug);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Capturar logs para o painel de debug
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (args[0] === '[Supabase Service]') {
        setDebugLogs(prev => [...prev, args.slice(1).map(a => 
          typeof a === 'object' ? JSON.stringify(a, null, 2) : a
        ).join(' ')]);
      }
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  useEffect(() => {
    supabaseService.debug = isDebugEnabled;
  }, [isDebugEnabled]);
  
  const clearDebugLogs = () => {
    setDebugLogs([]);
  };
  
  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Fetch series details
        const seriesData = await api.getSeriesById(Number(id));
        if (seriesData) {
          setSeries(seriesData);
          
          if (user) {
            supabaseService.log("Usuário autenticado:", user.id);
            
            // Check if current user has already watched this series
            const watchedItems = await supabaseService.getWatchedSeries(user.id);
            supabaseService.log("Séries assistidas:", watchedItems);
            
            const watchedItem = watchedItems.find(item => item.series_id === Number(id));
            
            if (watchedItem) {
              supabaseService.log("Série já assistida:", watchedItem);
              
              setUserReview({
                id: watchedItem.id || "",
                userId: watchedItem.user_id,
                seriesId: watchedItem.series_id,
                rating: watchedItem.rating || 0,
                comment: watchedItem.comment || "",
                watchedOn: watchedItem.watched_at,
                createdAt: watchedItem.created_at || new Date().toISOString()
              });
              setWatchedId(watchedItem.id || null);
              setRating(watchedItem.rating || 5);
              setComment(watchedItem.comment || "");
              if (watchedItem.watched_at) {
                setWatchedDate(watchedItem.watched_at.split('T')[0]);
              }
            }
            
            // Check if in watchlist
            const watchlistItems = await supabaseService.getWatchlist(user.id);
            supabaseService.log("Itens na watchlist:", watchlistItems);
            
            const watchlistItem = watchlistItems.find(w => w.series_id === Number(id));
            
            setInWatchlist(!!watchlistItem);
            setWatchlistId(watchlistItem?.id || null);
            if (watchlistItem?.notes) {
              setWatchlistNote(watchlistItem.notes);
            }
            
            // Fetch other users' reviews
            const allReviews: (SeriesReview & { user: User })[] = [];
            const usersData = await api.getUsers();
            
            for (const userData of usersData) {
              // Skip current user's review as we already have it
              if (userData.id === user.id) continue;
              
              const userReviews = userData.watchedSeries
                .filter(review => review.seriesId === Number(id))
                .map(review => ({
                  ...review,
                  user: userData
                }));
                
              allReviews.push(...userReviews);
            }
            
            // Add current user review to the list if exists
            if (watchedItem && currentUser) {
              const currentUserForReview = usersData.find(u => u.id === user.id);
              if (currentUserForReview) {
                allReviews.unshift({
                  id: watchedItem.id || "",
                  userId: watchedItem.user_id,
                  seriesId: watchedItem.series_id,
                  rating: watchedItem.rating || 0,
                  comment: watchedItem.comment || "",
                  watchedOn: watchedItem.watched_at,
                  createdAt: watchedItem.created_at || new Date().toISOString(),
                  user: currentUserForReview
                });
              }
            }
            
            // Sort by most recent
            allReviews.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            setReviews(allReviews);
          }
        }
      } catch (error) {
        console.error("Error fetching series details:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da série",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSeriesDetails();
  }, [id, user]);
  
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
    if (!series || !user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar uma avaliação",
        variant: "destructive"
      });
      return;
    }
    
    try {
      supabaseService.log(`Iniciando processo de ${watchedId ? 'atualização' : 'adição'} de avaliação`);
      
      // Prepare data for watched series
      const watchedData: WatchedSeries = {
        user_id: user.id,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        rating: rating,
        comment: comment,
        watched_at: watchedDate || new Date().toISOString()
      };
      
      supabaseService.log("Dados a serem salvos:", watchedData);
      
      let newReview;
      
      if (watchedId) {
        // Update existing review
        watchedData.id = watchedId;
        newReview = await supabaseService.updateWatchedSeries(watchedData);
        toast({
          title: "Avaliação atualizada",
          description: "Sua avaliação foi atualizada com sucesso!",
        });
      } else {
        // Add new review
        newReview = await supabaseService.addWatchedSeries(watchedData);
        setWatchedId(newReview?.id || null);
        toast({
          title: "Série marcada como assistida",
          description: "Sua avaliação foi salva com sucesso!",
        });
      }
      
      if (newReview) {
        supabaseService.log("Avaliação salva com sucesso:", newReview);
        
        setUserReview({
          id: newReview.id || "",
          userId: newReview.user_id,
          seriesId: newReview.series_id,
          rating: newReview.rating || 0,
          comment: newReview.comment || "",
          watchedOn: newReview.watched_at,
          createdAt: newReview.created_at || new Date().toISOString()
        });
      } else {
        supabaseService.log("Erro: Não foi possível salvar a avaliação");
        toast({
          title: "Erro",
          description: "Não foi possível salvar sua avaliação",
          variant: "destructive"
        });
      }
      
      // If it was in watchlist, remove from watchlist
      if (inWatchlist && watchlistId) {
        supabaseService.log("Removendo da watchlist após marcar como assistido");
        await supabaseService.removeFromWatchlist(watchlistId);
        setInWatchlist(false);
        setWatchlistId(null);
      }
      
      setShowReviewDialog(false);
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      supabaseService.log("Erro ao adicionar avaliação:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar sua avaliação",
        variant: "destructive"
      });
    }
  };
  
  const handleAddToWatchlist = async () => {
    if (!series || !user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar à sua lista",
        variant: "destructive"
      });
      return;
    }
    
    try {
      supabaseService.log(`Iniciando processo de ${watchlistId ? 'atualização' : 'adição'} à watchlist`);
      
      // Prepare data for watchlist
      const watchlistData: WatchlistItem = {
        user_id: user.id,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        notes: watchlistNote
      };
      
      supabaseService.log("Dados a serem salvos:", watchlistData);
      
      let result;
      
      if (watchlistId) {
        // Update existing watchlist item
        watchlistData.id = watchlistId;
        result = await supabaseService.updateWatchlistItem(watchlistData);
        toast({
          title: "Lista atualizada",
          description: "Suas anotações foram atualizadas com sucesso!",
        });
      } else {
        // Add new watchlist item
        result = await supabaseService.addToWatchlist(watchlistData);
        setWatchlistId(result?.id || null);
        toast({
          title: "Adicionado à lista",
          description: "A série foi adicionada à sua lista com sucesso!",
        });
      }
      
      if (result) {
        supabaseService.log("Item salvo na watchlist com sucesso:", result);
      } else {
        supabaseService.log("Erro: Não foi possível salvar na watchlist");
        toast({
          title: "Erro",
          description: "Não foi possível adicionar à sua lista",
          variant: "destructive"
        });
      }
      
      setInWatchlist(true);
      setShowWatchlistDialog(false);
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      supabaseService.log("Erro ao adicionar à watchlist:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar à sua lista",
        variant: "destructive"
      });
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
            Já Assisti ({userReview.rating.toFixed(1)}/10)
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
      
      {/* Debug button */}
      <div className="px-4 mt-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDebugDialog(true)}
          className="text-muted-foreground"
        >
          <Bug size={14} className="mr-1" />
          Debug
        </Button>
      </div>
      
      {/* Friends reviews */}
      <div className="mt-6 px-4">
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
            <DialogDescription>
              Compartilhe sua opinião sobre esta série
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sua nota:</label>
              <div className="flex justify-center py-2">
                <RatingStars 
                  rating={rating} 
                  onChange={setRating} 
                  size={32}
                  showPreciseSlider={true}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Comentário:</label>
              <Textarea 
                placeholder="O que você achou da série..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data que assistiu:</label>
              <Input 
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                autoComplete="off"
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
            <DialogDescription>
              Por que você quer assistir esta série?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Por que você quer assistir:</label>
              <Textarea 
                placeholder="Recomendação de um amigo, continuação de outra série..."
                value={watchlistNote}
                onChange={(e) => setWatchlistNote(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <Button onClick={handleAddToWatchlist} className="w-full">
              {inWatchlist ? "Atualizar nota" : "Adicionar à lista"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Debug Dialog */}
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Painel de Depuração (Debug)</DialogTitle>
            <DialogDescription>
              Ferramentas para depurar a integração com o Supabase
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-hidden flex flex-col h-full">
            <div className="flex items-center space-x-2">
              <Switch 
                id="debug-mode" 
                checked={isDebugEnabled}
                onCheckedChange={setIsDebugEnabled}
              />
              <Label htmlFor="debug-mode">Habilitar modo de depuração</Label>
              
              <div className="flex-1"></div>
              
              <Button 
                onClick={clearDebugLogs} 
                variant="outline" 
                size="sm"
              >
                Limpar logs
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Status da Autenticação:</h3>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto mt-1">
                  {user ? JSON.stringify({ id: user.id, email: user.email }, null, 2) : "Usuário não autenticado"}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Detalhes do Watchlist:</h3>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto mt-1">
                  {JSON.stringify({ inWatchlist, watchlistId, watchlistNote }, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Detalhes da Avaliação:</h3>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto mt-1">
                  {JSON.stringify({ 
                    hasReview: !!userReview, 
                    watchedId, 
                    rating, 
                    comment,
                    watchedDate
                  }, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Logs:</h3>
              <div className="bg-black text-green-400 p-3 rounded-md h-full text-xs font-mono overflow-y-auto">
                {debugLogs.length > 0 ? (
                  debugLogs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="opacity-50">[{new Date().toISOString()}]</span> {log}
                    </div>
                  ))
                ) : (
                  <p className="opacity-50">Nenhum log registrado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeriesDetail;
