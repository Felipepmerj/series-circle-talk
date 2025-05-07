export interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_name: string;
  original_language: string;
  origin_country: string[];
  userRating?: number;
  comment?: string;
  tmdb_id?: string;
  title?: string;
  user_id?: string;
  user_name?: string;
  user_profile_pic?: string;
  rating?: number;
  watched_at?: string;
  created_at?: string;
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
  id?: number;
  user_id: string;
  series_id: number;
  tmdb_id: string;
  title: string;
  poster_path: string;
  notes?: string;
  created_at?: string;
  user_name?: string;
  user_profile_pic?: string;
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
