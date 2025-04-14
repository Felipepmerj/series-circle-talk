
import React from "react";
import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  onChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  max = 10,
  size = 20,
  onChange
}) => {
  // Convert to 5 stars (if using 10-scale)
  const displayRating = max === 10 ? rating / 2 : rating;
  const displayMax = max === 10 ? 5 : max;
  
  // Create an array of stars
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= displayMax; i++) {
      const starValue = i;
      const isActive = displayRating >= i - 0.25;
      const isHalf = displayRating >= i - 0.75 && displayRating < i - 0.25;
      
      stars.push(
        <button
          key={i}
          type="button"
          className={`focus:outline-none ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => onChange && onChange(starValue * 2)}
          aria-label={`${starValue} stars`}
        >
          {isHalf ? (
            <StarHalf
              size={size}
              className="text-yellow-400 fill-yellow-400"
            />
          ) : (
            <Star
              size={size}
              className={isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
            />
          )}
        </button>
      );
    }
    
    return stars;
  };
  
  return (
    <div className="flex">
      {renderStars()}
      {max === 10 && <span className="ml-2 text-sm text-muted-foreground">{rating}/10</span>}
    </div>
  );
};

export default RatingStars;
