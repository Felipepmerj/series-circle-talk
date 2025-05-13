import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../services/api";
import { Series } from "../types/Series";
import Header from "../components/Header";
import RatingStars from "../components/RatingStars";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { List, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BottomNav from "../components/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, MessageCircle, Tv2, Star, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface SeriesComment {
  id: string;
  userId: string;
  username: string;
  profilePic: string;
  content: string;
  rating?: number;
  timestamp: string;
}


const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string | null>(null);
  const [addingWatch, setAddingWatch] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [watchlistNote, setWatchlistNote] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [currentWatchlistItem, setCurrentWatchlistItem] = useState<any>(null);
  const [userWatchlist, setUserWatchlist] = useState<boolean>(false);
  const [addingWatchlist, setAddingWatchlist] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [watchedComments, setWatchedComments] = useState<SeriesComment[]>([]);
  const [watchlistComments, setWatchlistComments] = useState<SeriesComment[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]); // State for watchlist items
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingComments, setLoadingComments] = useState(false);
  const [averageRating, setAverageRating] = useState<{ rating: number; count: number }>({ rating: 0, count: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSeries = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const seriesData = await api.getSeriesById(parseInt(id, 10));
        setSeries(seriesData);
      } catch (error) {
        console.error("Error fetching series:", error);
        toast.error("Failed to load series details");
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [id]);

  useEffect(() => {
    fetchUserWatchData();
    fetchAllUserProfiles();
    fetchSeriesComments();

    // Inscrever-se nas mudanças da tabela watchlist
    const watchlistSubscription = supabase
      .channel('watchlist_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watchlist'
        },
        (payload) => {
          console.log('Mudança na watchlist:', payload);
          fetchSeriesComments();
        }
      )
      .subscribe();

    // Inscrever-se nas mudanças da tabela watched_shows
    const watchedShowsSubscription = supabase
      .channel('watched_shows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watched_shows'
        },
        (payload) => {
          console.log('Mudança nos shows assistidos:', payload);
          fetchSeriesComments();
        }
      )
      .subscribe();

    // Cleanup das inscrições
    return () => {
      watchlistSubscription.unsubscribe();
      watchedShowsSubscription.unsubscribe();
    };
  }, [user, id]);

  const fetchSeriesComments = async () => {
    if (!id) return;
    
    setLoadingComments(true);
    try {
      // Buscar todos os shows assistidos
      const allWatchedShows = await supabaseService.getAllWatchedShows() || [];
      console.log('Todos os shows assistidos:', allWatchedShows);
      
      // Filtrar shows desta série
      const seriesWatchedShows = allWatchedShows.filter(show => {
        console.log('Comparando show:', show);
        console.log('tmdb_id do show:', show.tmdb_id, typeof show.tmdb_id);
        console.log('id da série atual:', id, typeof id);
        return show.tmdb_id.toString() === id.toString();
      });
      
      console.log('Shows assistidos desta série:', seriesWatchedShows);
      
      // Calcular média das avaliações
      const showsWithRating = seriesWatchedShows.filter(show => 
        show.rating !== null && show.rating !== undefined
      );
      
      const totalRating = showsWithRating.reduce((acc, show) => acc + (show.rating || 0), 0);
      const averageRatingValue = showsWithRating.length > 0 ? totalRating / showsWithRating.length : 0;
      
      setAverageRating({
        rating: averageRatingValue,
        count: showsWithRating.length
      });

      // Buscar dados dos usuários que assistiram
      const watchedShowComments = await Promise.all(seriesWatchedShows.map(async (show) => {
        const userProfile = await supabaseService.getUserProfile(show.user_id);
        console.log('Dados do usuário que assistiu:', userProfile);
        return {
          id: show.id,
          userId: show.user_id,
          username: userProfile?.name || "Usuário",
          profilePic: userProfile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || show.user_id}`,
          content: show.review || "",
          rating: show.rating,
          timestamp: show.watched_at || show.created_at
        };
      }));

      // Ordenar por data mais recente
      const sortedWatchedComments = watchedShowComments.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('Shows assistidos com dados dos usuários:', sortedWatchedComments);
      setWatchedComments(sortedWatchedComments);

      // Buscar todos os itens da watchlist
      const allWatchlistItems = await supabaseService.getAllWatchlistItems() || [];
      console.log('Todos os itens da watchlist:', allWatchlistItems);
      
      // Filtrar apenas os itens desta série
      const seriesWatchlistItems = allWatchlistItems.filter(item => {
        console.log('Comparando item:', item);
        console.log('tmdb_id do item:', item.tmdb_id, typeof item.tmdb_id);
        console.log('id da série atual:', id, typeof id);
        return item.tmdb_id.toString() === id.toString();
      });
      
      console.log('Itens da watchlist desta série:', seriesWatchlistItems);
      
      // Buscar dados dos usuários da watchlist
      const watchlistWithUserData = await Promise.all(seriesWatchlistItems.map(async (item) => {
        const userProfile = await supabaseService.getUserProfile(item.user_id);
        console.log('Dados do usuário da watchlist:', userProfile);
        return {
          id: item.id,
          userId: item.user_id,
          username: userProfile?.name || "Usuário",
          profilePic: userProfile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || item.user_id}`,
          content: item.note || "",
          timestamp: item.created_at
        };
      }));
      
      // Ordenar por data mais recente
      const sortedWatchlistItems = watchlistWithUserData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      console.log('Watchlist com dados dos usuários:', sortedWatchlistItems);
      setWatchlistComments(sortedWatchlistItems);

    } catch (error) {
      console.error("Error fetching series data:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchUserWatchData = async () => {
    if (!user || !id) return;

    try {
      // Fetch watched series for the user
      const watchedSeries = await supabaseService.getWatchedSeries(user.id);
      const watched = watchedSeries.find(item => item.seriesId === parseInt(id, 10));

      if (watched) {
        setUserRating(watched.rating || null);
        setUserComment(watched.comment || null);
      } else {
        setUserRating(null);
        setUserComment(null);
      }

      // Fetch watchlist for the user
      const watchlist = await supabaseService.getWatchlist(user.id);
      setUserWatchlist(watchlist.some(item => item.seriesId === parseInt(id, 10)));
    } catch (error) {
      console.error("Error fetching user watch data:", error);
    }
  };

  const fetchAllUserProfiles = async () => {
    try {
      const profiles = await supabaseService.getAllUserProfiles();
      setUserProfiles(profiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    }
  };

  const addSeriesAsWatched = async (rating: number, comment: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para adicionar uma série assistida");
      navigate("/auth");
      return;
    }

    try {
      setAddingWatch(true);
      if (userRating !== null) {
        const watchedItems = await supabaseService.getWatchedSeries(user.id);
        const watchedItem = watchedItems.find(item => item.seriesId === parseInt(id!, 10));

        if (watchedItem) {
          const success = await supabaseService.updateWatchedShow(watchedItem.id, rating, comment, true);
          if (success) {
            toast.success("Avaliação atualizada!");
          } else {
            toast.error("Erro ao atualizar avaliação");
          }
        }
      } else {
        const result = await supabaseService.addWatchedSeries({
          userId: user.id,
          seriesId: Number(id),
          rating: rating,
          comment: comment,
          public: true
        });
        if (result) {
          toast.success("Série adicionada como assistida!");
        } else {
          toast.error("Erro ao adicionar série como assistida");
        }
      }

      // Atualizar dados imediatamente
      await Promise.all([
        fetchUserWatchData(),
        fetchSeriesComments()
      ]);
      setShowRatingModal(false);
    } catch (error) {
      console.error("Error adding series as watched:", error);
      toast.error("Erro ao adicionar série como assistida");
    } finally {
      setAddingWatch(false);
    }
  };

  const addSeriesToWatchlist = async (note: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para adicionar uma série à watchlist");
      navigate("/auth");
      return;
    }

    if (!series) {
      toast.error("Série não encontrada");
      return;
    }

    try {
      setAddingWatchlist(true);
      await supabaseService.addToWatchlist({
        user_id: user.id,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        notes: note
      });
      setUserWatchlist(true);
      setWatchlistNote("");
      setShowWatchlistModal(false);
      toast.success("Série adicionada à sua lista!");
      
      // Atualizar dados imediatamente
      await Promise.all([
        fetchSeriesComments(),
        fetchUserWatchData()
      ]);
    } catch (error) {
      console.error("Error adding series to watchlist:", error);
      toast.error("Erro ao adicionar série à sua lista");
    } finally {
      setAddingWatchlist(false);
    }
  };

  const removeSeriesFromWatchlist = async () => {
    if (!user || !id) return;

    try {
      setAddingWatchlist(true);
      const watchlist = await supabaseService.getWatchlist(user.id);
      const watchlistItem = watchlist.find(item => item.seriesId === parseInt(id, 10));

      if (watchlistItem) {
        await supabaseService.removeFromWatchlist(watchlistItem.id);
        setUserWatchlist(false);
        toast.success("Série removida da sua lista!");
        
        // Atualizar dados imediatamente
        await Promise.all([
          fetchSeriesComments(),
          fetchUserWatchData()
        ]);
      } else {
        toast.error("Série não encontrada na sua lista");
      }
    } catch (error) {
      console.error("Error removing series from watchlist:", error);
      toast.error("Erro ao remover série da sua lista");
    } finally {
      setAddingWatchlist(false);
    }
  };

  const removeSeriesFromWatched = async () => {
    if (!user || !id) return;

    try {
 console.log('removeSeriesFromWatched called');
      console.log('User ID:', user.id);
      console.log('Series ID:', id);
      // Find the watched item for the current series and user
      const watchedItems = await supabaseService.getWatchedSeries(user.id);
      console.log('Watched items for user:', watchedItems);
      const watchedItem = watchedItems.find(item => item.seriesId === parseInt(id, 10));
      console.log('Found watched item:', watchedItem);
 if (watchedItem) {
 console.log('Attempting to remove watched item with ID:', watchedItem.id);
        try {
 // Remove the watched item by its ID
 await supabaseService.deleteWatchedShow(watchedItem.id);
 console.log('Supabase removal successful for ID:', watchedItem.id);
 toast.success("Série removida da sua lista de assistidos!");
        } catch (supabaseError) {
 console.error("Error during Supabase removal:", supabaseError);
 toast.error("Erro ao remover série da sua lista de assistidos");
        }
        setUserRating(null);
        setUserComment(null);
        fetchSeriesComments(); // Refresh comments to remove the user's comment
      } else {
        toast.error("Série não encontrada na sua lista de assistidos");
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error removing series from watched:", error);
    } finally {
      // No specific loading state for removal, but can add if needed
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const handleEditNote = async (item: any) => {
    setCurrentWatchlistItem(item);
    setEditingNote(item.content || "");
    setShowEditNoteModal(true);
  };

  const handleUpdateNote = async () => {
    if (!currentWatchlistItem || !user) return;

    try {
      const updated = await supabaseService.updateWatchlistNote(currentWatchlistItem.id, editingNote);
      if (updated) {
        toast.success("Nota atualizada com sucesso!");
        await fetchSeriesComments();
        setShowEditNoteModal(false);
      } else {
        toast.error("Erro ao atualizar nota");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Erro ao atualizar nota");
    }
  };

  if (loading || !series) {
    return (
      <div className="app-container">
        <Header title="Carregando..." />
        <div className="flex justify-center items-center h-full">
          <span className="loading loading-ring loading-lg"></span>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-container pb-20">
      <Header title={series.name} />

      <div className="relative">
        <img
          src={api.getImageUrl(series.backdrop_path || series.poster_path, "w780")}
          alt={series.name}
          className="w-full object-cover aspect-[16/9]"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h1 className="text-3xl font-bold text-white">{series.name}</h1>
        </div>
      </div>
      
      <div className="mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">
              <Tv2 className="w-4 h-4 mr-1" />
              Visão geral
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-1" />
              Quem assistiu
            </TabsTrigger>
            <TabsTrigger value="watchlist">
              <List className="w-4 h-4 mr-1" />
              Querem assistir
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="p-4">
              <div className="mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Visão geral</h2>
                  
                  <div className="space-y-3 mb-4">
                    {averageRating.count > 0 && (
                      <div className="flex items-center">
                        <div className="min-w-24 text-sm text-muted-foreground">Média geral:</div>
                        <div className="flex items-center">
                          <RatingStars rating={averageRating.rating} />
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({averageRating.count} {averageRating.count === 1 ? 'avaliação' : 'avaliações'})
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {userRating !== null && (
                      <div className="flex items-center">
                        <div className="min-w-24 text-sm text-muted-foreground">Sua nota:</div>
                        <div className="flex items-center">
                          <RatingStars rating={userRating} />
                          <span className="ml-2 text-sm text-muted-foreground">
                            
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{series.overview}</p>
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">Detalhes</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Título original:</span>{" "}
                    {series.original_name}
                  </div>
                  <div>
                    <span className="font-medium">Data de lançamento:</span>{" "}
                    {new Date(series.first_air_date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Gêneros:</span>{" "}
                    {series.genres.map((genre) => genre.name).join(", ")}
                  </div>
                  <div>
                    <span className="font-medium">Avaliação média:</span>{" "}
                    {series.vote_average.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">Quem assistiu</h2>
              
              {loadingComments ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : watchedComments.length > 0 ? (
                <div className="space-y-4">
                  {watchedComments.map((comment) => (
                    <div key={comment.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link to={`/profile/${comment.userId}`} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.profilePic} alt={comment.username} />
                            <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.username}</span>
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comment.timestamp)}
                        </div>
                      </div>
                      {comment.rating && (
                        <div className="flex items-center">
                          <RatingStars rating={comment.rating} size={16} /> {/* Ensure size is a number */}
                          <span className="ml-2 text-xs text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>
                            {comment.rating}/10
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground opacity-20" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhuma avaliação para esta série ainda
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="watchlist" className="mt-4">
            <div className="space-y-4 mt-4">
              {loadingComments ? (
                <div className="text-center py-8">
                  <span className="loading loading-ring loading-lg"></span>
                </div>
              ) : watchlistComments.length > 0 ? (
                watchlistComments.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar>
                          <AvatarImage src={item.profilePic} alt={item.username} />
                          <AvatarFallback>{item.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="font-medium">{item.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {user && user.id === item.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {item.content && (
                      <p className="mt-2 text-sm">{item.content}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ninguém adicionou esta série à lista ainda.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 flex flex-col sm:flex-row sm:justify-around gap-2">
        {user ? (
          <>
            <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={addingWatch}>
                  {userRating !== null ? "Editar avaliação" : "Adicionar como assistido"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Avaliar Série</DialogTitle>
                  <DialogDescription>
                    Adicione sua avaliação e um comentário sobre a série.
                  </DialogDescription>
                </DialogHeader>
                <RatingForm onSubmit={addSeriesAsWatched} initialRating={userRating} initialComment={userComment} loading={addingWatch} />
              </DialogContent>
            </Dialog>

            {userRating !== null && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Remover de Assistidos</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>Remover de Assistidos</AlertDialogHeader>
                  <AlertDialogDescription>Tem certeza que deseja remover esta série da sua lista de assistidos?</AlertDialogDescription>
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={removeSeriesFromWatched}>Remover</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {userWatchlist ? (
              <Button variant="destructive" onClick={removeSeriesFromWatchlist} disabled={addingWatchlist}>
                Remover da lista
              </Button>
            ) : (
              <Dialog open={showWatchlistModal} onOpenChange={setShowWatchlistModal}>
                <DialogTrigger asChild>
                  <Button variant="secondary" disabled={addingWatchlist}>
                    Adicionar à lista de interesse
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar à Lista de Interesse</DialogTitle>
                    <DialogDescription>
                      Adicione um comentário sobre por que você quer assistir esta série.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="note">Comentário:</label>
                      <Textarea
                        id="note"
                        placeholder="Por que você quer assistir esta série?"
                        value={watchlistNote}
                        onChange={(e) => setWatchlistNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => addSeriesToWatchlist(watchlistNote)} disabled={addingWatchlist}>
                      {addingWatchlist ? "Adicionando..." : "Adicionar à lista de interesse"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : (
          <Button variant="secondary" onClick={() => navigate("/auth")}>
            Faça login para interagir
          </Button>
        )}
      </div>

      <Dialog open={showEditNoteModal} onOpenChange={setShowEditNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
            <DialogDescription>
              Atualize sua nota sobre a série.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              placeholder="Escreva sua nota aqui..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditNoteModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateNote}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

interface RatingFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  initialRating: number | null;
  initialComment: string | null;
  loading: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({ onSubmit, initialRating, initialComment, loading }) => {
  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState(initialComment || "");

  const handleSubmit = async () => {
    await onSubmit(rating, comment);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="rating">Avaliação:</label>
        <Slider
          id="rating"
          defaultValue={[initialRating || 5]}
          max={10.0}
          min={0.0}
          step={0.1}
          onValueChange={(value) => setRating(value[0])}
        />
        <p className="text-sm text-muted-foreground">
          Sua avaliação: {rating} / 10
        </p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="comment">Comentário:</label>
        <Textarea
          id="comment"
          placeholder="Escreva um comentário sobre a série..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Salvar"}
      </Button>
    </div>
  );
};

export default SeriesDetail;
