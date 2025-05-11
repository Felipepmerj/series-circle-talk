
/**
 * Utility functions to map between database field names and application field names
 */

// Map watched_shows database fields to application fields
export const mapWatchedShow = (item: any) => ({
  id: item.id,
  userId: item.user_id,
  seriesId: parseInt(item.tmdb_id, 10),
  rating: item.rating,
  comment: item.review, // Mapping review to comment for consistency
  timestamp: item.watched_at || item.created_at || new Date().toISOString(),
  public: item.public !== undefined ? item.public : false
});

// Map watchlist database fields to application fields
export const mapWatchlistItem = (item: any) => ({
  id: item.id,
  userId: item.user_id,
  seriesId: parseInt(item.tmdb_id, 10),
  notes: item.note, // Mapping note to notes for consistency
  timestamp: item.created_at || new Date().toISOString(),
  public: item.public !== undefined ? item.public : false
});
