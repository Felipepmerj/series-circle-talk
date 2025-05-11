import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import BottomNav from "../components/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, MessageCircle, Tv2 } from "lucide-react";

const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string | null>(null);
  const [addingWatch, setAddingWatch] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userWatchlist, setUserWatchlist] = useState<boolean>(false);
  const [addingWatchlist, setAddingWatchlist] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
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
  }, [user, id]);

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

      // Update to use the correct parameter structure expected by the service
      const result = await supabaseService.addWatchedSeries({
        userId: user.id,
        seriesId: Number(id),
        rating: rating,
        comment: comment,
        public: true
      });

      if (result) {
        toast.success("Série adicionada como assistida!");
        fetchUserWatchData();
      } else {
        toast.error("Erro ao adicionar série como assistida");
      }
    } catch (error) {
      console.error("Error adding series as watched:", error);
      toast.error("Erro ao adicionar série como assistida");
    } finally {
      setAddingWatch(false);
      setShowRatingModal(false);
    }
  };

  const addSeriesToWatchlist = async () => {
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
        notes: ""
      });
      setUserWatchlist(true);
      toast.success("Série adicionada à sua lista!");
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
      // Fetch watchlist to get the item ID
      const watchlist = await supabaseService.getWatchlist(user.id);
      const watchlistItem = watchlist.find(item => item.seriesId === parseInt(id, 10));

      if (watchlistItem) {
        // Remove from watchlist using the item ID
        await supabaseService.removeFromWatchlist(watchlistItem.id);
        setUserWatchlist(false);
        toast.success("Série removida da sua lista!");
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

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Visão geral</h2>
          </div>
          <div>
            {userRating !== null && (
              <div className="flex items-center">
                <RatingStars rating={userRating} />
                <span className="ml-2 text-sm text-muted-foreground">
                  Sua avaliação
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{series.overview}</p>
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

      <div className="p-4 flex justify-around">
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

            {userWatchlist ? (
              <Button variant="destructive" onClick={removeSeriesFromWatchlist} disabled={addingWatchlist}>
                Remover da lista
              </Button>
            ) : (
              <Button variant="secondary" onClick={addSeriesToWatchlist} disabled={addingWatchlist}>
                Adicionar à lista
              </Button>
            )}
          </>
        ) : (
          <Button variant="secondary" onClick={() => navigate("/auth")}>
            Faça login para interagir
          </Button>
        )}
      </div>

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
          max={10}
          min={1}
          step={1}
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
