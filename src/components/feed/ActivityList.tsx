
import React from "react";
import FeedItem from "../FeedItem";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface FeedActivity {
  id: string;
  userId: string;
  seriesId: number;
  type: 'review' | 'added-to-watchlist';
  timestamp: string;
  reviewId?: string;
  watchlistItemId?: string;
  seriesName?: string;
  username?: string;
}

interface ActivityListProps {
  activities: FeedActivity[];
  allActivitiesProcessed: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  allActivitiesProcessed,
  loadingMore,
  onLoadMore
}) => {
  return (
    <>
      <div className="space-y-4">
        {activities.map((activity) => (
          <FeedItem
            key={activity.id}
            userId={activity.userId}
            seriesId={activity.seriesId}
            type={activity.type}
            timestamp={activity.timestamp}
            reviewId={activity.reviewId}
            watchlistItemId={activity.watchlistItemId}
            username={activity.username}
            seriesName={activity.seriesName}
          />
        ))}
      </div>
      
      {!allActivitiesProcessed && (
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={onLoadMore} 
            disabled={loadingMore}
            variant="outline"
            className="w-full max-w-xs"
          >
            {loadingMore ? (
              <span className="flex items-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </span>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </>
  );
};

export default ActivityList;
