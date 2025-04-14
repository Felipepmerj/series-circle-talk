
import React from "react";
import { Link } from "react-router-dom";
import { Series } from "../types/Series";
import { api } from "../services/api";
import RatingStars from "./RatingStars";

interface SeriesCardProps {
  series: Series;
  userRating?: number;
  comment?: string;
  showRating?: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ 
  series, 
  userRating, 
  comment,
  showRating = true
}) => {
  return (
    <Link 
      to={`/series/${series.id}`} 
      className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
    >
      <div className="relative">
        <img 
          src={api.getImageUrl(series.poster_path)} 
          alt={series.name}
          className="w-full object-cover aspect-[2/3]"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h3 className="text-white font-bold line-clamp-1">
            {series.name}
          </h3>
          <p className="text-white/80 text-sm">
            {new Date(series.first_air_date).getFullYear()}
          </p>
        </div>
      </div>
      
      {showRating && userRating && (
        <div className="p-3">
          <RatingStars rating={userRating} />
          {comment && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
              {comment}
            </p>
          )}
        </div>
      )}
    </Link>
  );
};

export default SeriesCard;
