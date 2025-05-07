
import React from "react";
import { Series } from "../types/Series";
import { api } from "../services/api";

interface SeriesDetailHeaderProps {
  series: Series;
}

const SeriesDetailHeader: React.FC<SeriesDetailHeaderProps> = ({ series }) => {
  return (
    <div className="relative">
      {/* Backdrop image */}
      <div className="h-48 overflow-hidden relative">
        {series.backdrop_path ? (
          <img
            src={api.getImageUrl(series.backdrop_path, "w780")}
            alt={`${series.name} backdrop`}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-background" />
      </div>
      
      {/* Content overlay */}
      <div className="relative px-4 pb-4 -mt-24">
        <div className="flex">
          {/* Poster */}
          <div className="flex-shrink-0 w-28">
            <img
              src={api.getImageUrl(series.poster_path)}
              alt={series.name}
              className="rounded-lg shadow-lg border-2 border-white"
            />
          </div>
          
          {/* Title and info */}
          <div className="ml-4 flex-1 pt-24">
            <h1 className="text-xl font-bold">{series.name}</h1>
            {series.original_name !== series.name && (
              <p className="text-sm text-muted-foreground">{series.original_name}</p>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {series.genres.map((genre) => (
                <span 
                  key={genre.id}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {genre.name}
                </span>
              ))}
            </div>
            
            <p className="text-sm mt-2">
              {new Date(series.first_air_date).getFullYear()} • {Math.round(series.vote_average * 10) / 10}/10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailHeader;
