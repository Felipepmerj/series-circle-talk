
import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Series } from "../types/Series";
import { api } from "../services/api";

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
            {new Date(series.first_air_date).getFullYear()}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {series.genres.slice(0, 2).map((genre) => (
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
          <button 
            onClick={onAddToWatchlist || onAddToWatched}
            className="p-2 rounded-full bg-primary text-white"
            aria-label={onAddToWatchlist ? "Adicionar à lista" : "Marcar como assistido"}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SeriesSearchResult;
