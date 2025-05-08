
export interface Series {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genres: Genre[];
  vote_average: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface SeriesReview {
  id: string;
  userId: string;
  seriesId: number;
  rating: number; // 0-10
  comment: string;
  watchedOn?: string; // ISO date string
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  profilePic?: string;
  watchedSeries: SeriesReview[];
  watchlist: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  userId: string;
  seriesId: number;
  notes?: string;
  addedAt: string;
}

export interface FeedItem {
  id: string;
  type: 'review' | 'added-to-watchlist';
  userId: string;
  seriesId: number;
  reviewId?: string;
  watchlistItemId?: string;
  createdAt: string;
}
