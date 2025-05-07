
import React from "react";
import { Link } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { Series } from "../types/Series";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "../services/supabaseService";
import { useAuth } from "../hooks/useAuth";

interface SeriesSearchResultProps {
  series: Series;
  onAddToWatchlist?: () => void;
  onAddToWatched?: () => void;
  isInWatchlist?: boolean;
  isWatched?: boolean;
}

const SeriesSearchResult: React.FC<SeriesSearchResultProps> = ({ 
  series, 
  onAddToWatchlist,
  onAddToWatched,
  isInWatchlist = false,
  isWatched = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get year from date string safely
  const getYear = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.getFullYear() : '';
  };
  
  const handleAddToWatchlist = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar à sua lista",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (onAddToWatchlist) {
        onAddToWatchlist();
      } else {
        // Fallback behavior
        window.location.href = `/series/${series.id}?action=watchlist`;
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar à sua lista",
        variant: "destructive"
      });
    }
  };
  
  const handleAddToWatched = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para marcar como assistido",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (onAddToWatched) {
        onAddToWatched();
      } else {
        // Fallback behavior
        window.location.href = `/series/${series.id}?action=watched`;
      }
    } catch (error) {
      console.error("Error adding to watched:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao marcar como assistido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center p-3 border-b last:border-b-0">
      <Link to={`/series/${series.id}`} className="flex flex-1 items-center">
        <img 
          src={api.getImageUrl(series.poster_path, "w92")} 
          alt={series.name}
          className="w-16 h-24 object-cover rounded-md"
        />
        <div className="ml-3 flex-1">
          <h3 className="font-medium line-clamp-1">{series.name}</h3>
          <p className="text-xs text-muted-foreground">
            {getYear(series.first_air_date)}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {series.genres && series.genres.slice(0, 2).map((genre) => (
              <span 
                key={genre.id}
                className="text-xs bg-muted px-2 py-0.5 rounded-full"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </Link>
      
      <div className="ml-2 flex gap-2">
        <Button
          onClick={handleAddToWatched}
          size="sm"
          variant={isWatched ? "outline" : "default"}
          className="rounded-full w-8 h-8 p-0"
          aria-label="Marcar como assistido"
          title="Marcar como assistido"
          type="button"
        >
          <Check className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={handleAddToWatchlist}
          size="sm"
          variant={isInWatchlist ? "outline" : "secondary"}
          className="rounded-full w-8 h-8 p-0"
          aria-label="Adicionar à lista"
          title="Adicionar à lista"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SeriesSearchResult;
