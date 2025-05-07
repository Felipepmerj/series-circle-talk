
import React, { useState, useEffect } from "react";
import { Star, StarHalf } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  onChange?: (rating: number) => void;
  showPreciseSlider?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  max = 10,
  size = 20,
  onChange,
  showPreciseSlider = false
}) => {
  const [sliderValue, setSliderValue] = useState(rating);
  
  // Update slider value when rating prop changes
  useEffect(() => {
    setSliderValue(rating);
  }, [rating]);
  
  // Convert to 5 stars (if using 10-scale)
  const displayRating = max === 10 ? rating / 2 : rating;
  const displayMax = max === 10 ? 5 : max;
  
  const handleSliderChange = (value: number[]) => {
    const newValue = Number(value[0].toFixed(1)); // Ensure value is rounded to 1 decimal place
    setSliderValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  
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
    <div className="space-y-2">
      <div className="flex">
        {renderStars()}
        {max === 10 && <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}/10</span>}
      </div>
      
      {showPreciseSlider && onChange && (
        <div className="pt-2">
          <Slider
            value={[sliderValue]}
            min={0}
            max={10}
            step={0.1} // Step is 0.1 for precise rating
            onValueChange={handleSliderChange}
          />
          <div className="text-xs text-center mt-1 text-muted-foreground">
            Ajuste preciso: {sliderValue.toFixed(1)}/10
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingStars;
