import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Series } from "../types/Series";
import { api } from "../services/api";
import RatingStars from "./RatingStars";
import { supabaseService } from '../services/supabaseService';
import { FaStar, FaUser } from 'react-icons/fa';

interface SeriesCardProps {
  series: Series;
  userRating?: number;
  comment?: string;
  showRating?: boolean;
  showUserInfo?: boolean;
}

const SeriesCard: React.FC<SeriesCardProps> = ({ 
  series, 
  userRating, 
  comment,
  showRating = true,
  showUserInfo = false
}) => {
  const [seriesDetails, setSeriesDetails] = useState<Series | null>(null);

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (series.tmdb_id) {
        const details = await supabaseService.getSeriesDetails(series.tmdb_id);
        if (details) {
          setSeriesDetails(details);
        }
      }
    };

    fetchSeriesDetails();
  }, [series.tmdb_id]);

  const displayTitle = seriesDetails?.title || series.title || 'Carregando...';
  const displayPoster = seriesDetails?.poster_path || series.poster_path;

  return (
    <Link 
      to={`/series/${series.id}`} 
      className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
    >
      <div className="relative">
        {displayPoster ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${displayPoster}`}
            alt={displayTitle}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">Sem imagem</span>
          </div>
        )}
        
        {showUserInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
            <div className="flex items-center gap-2 text-white">
              <img
                src={series.user_profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${series.user_id}`}
                alt={series.user_name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm">{series.user_name}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{displayTitle}</h3>
        
        {series.rating && (
          <div className="flex items-center gap-1 text-yellow-500">
            <FaStar />
            <span>{series.rating}</span>
          </div>
        )}
        
        {series.comment && (
          <p className="mt-2 text-sm text-gray-600">{series.comment}</p>
        )}
      </div>
    </Link>
  );
};

export default SeriesCard;
