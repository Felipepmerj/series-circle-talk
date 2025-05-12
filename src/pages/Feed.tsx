import React from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useFeedData } from "../hooks/useFeedData";
import LoadingSkeleton from "../components/feed/LoadingSkeleton";
import ActivityList from "../components/feed/ActivityList";
import EmptyState from "../components/feed/EmptyState";
import { Loader } from "lucide-react";

const Feed: React.FC = () => {
  const {
    activities,
    loading,
    initialLoadComplete,
    allActivitiesProcessed,
    loadingMore,
    combinedItems,
    loadMoreItems
  } = useFeedData();

  const handleCommentAdded = () => {
    // Recarregar o feed do início
    window.location.reload();
  };

  return (
    <div className="app-container pb-20">
      <Header title="Feed de Atividades" />

      <div className="mt-4">
        {loading ? (
          <LoadingSkeleton />
        ) : activities.length > 0 ? (
          <ActivityList 
            activities={activities}
            allActivitiesProcessed={allActivitiesProcessed}
            loadingMore={loadingMore}
            onLoadMore={loadMoreItems}
            onCommentAdded={handleCommentAdded}
          />
        ) : initialLoadComplete ? (
          <EmptyState itemsExist={combinedItems.length > 0} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Feed;
