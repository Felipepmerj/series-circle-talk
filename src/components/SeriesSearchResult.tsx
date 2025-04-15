
import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Series } from "../types/Series";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";

interface SeriesSearchResultProps {
  series: Series;
  onAddToWatchlist?: () => void;
  onAddToWatched?: () => void;
}

const SeriesSearchResult: React.FC<SeriesSearchResultProps> = ({ 
  series, 
  onAddToWatchlist,
  onAddToWatched
}) => {
  // Get year from date string safely
  const getYear = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.getFullYear() : '';
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
      
      {(onAddToWatchlist || onAddToWatched) && (
        <div className="ml-2">
          <Button
            onClick={onAddToWatchlist || onAddToWatched}
            size="sm"
            variant="default"
            className="rounded-full w-8 h-8 p-0"
            aria-label={onAddToWatchlist ? "Adicionar à lista" : "Marcar como assistido"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SeriesSearchResult;
