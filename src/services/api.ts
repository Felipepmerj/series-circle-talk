
import { Series, User, SeriesReview, WatchlistItem, FeedItem } from "../types/Series";

// Normally we would use fetch to call the real TMDB API
// For this demo, we're using mock data
import { mockSeries, mockUsers, mockFeed } from "../lib/mockData";

const API_KEY = "YOUR_TMDB_API_KEY"; // Replace with actual API key when ready
const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_URL = "https://image.tmdb.org/t/p";

// For a production app, we would implement these functions with real API calls
export const api = {
  // Search for series by title
  searchSeries: async (query: string): Promise<Series[]> => {
    // For demo, return filtered mock data
    return mockSeries.filter(series => 
      series.name.toLowerCase().includes(query.toLowerCase())
    );
    
    // Real implementation would be:
    /*
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
    */
  },

  // Get series details by ID
  getSeriesById: async (id: number): Promise<Series | undefined> => {
    return mockSeries.find(series => series.id === id);
    
    // Real implementation:
    /*
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR`;
    const response = await fetch(url);
    return await response.json();
    */
  },

  // Get feed items (activity from friends)
  getFeedItems: async (): Promise<FeedItem[]> => {
    return mockFeed;
    
    // In a real app, this would fetch from your backend
  },

  // Get user details
  getUserById: async (userId: string): Promise<User | undefined> => {
    return mockUsers.find(user => user.id === userId);
    
    // In a real app, this would fetch from your backend
  },

  // Get all users (for the friends list)
  getUsers: async (): Promise<User[]> => {
    return mockUsers;
    
    // In a real app, this would fetch from your backend
  },

  // Add a review for a series
  addReview: async (userId: string, seriesId: number, rating: number, comment: string, watchedOn?: string): Promise<SeriesReview> => {
    const newReview = {
      id: Date.now().toString(),
      userId,
      seriesId,
      rating,
      comment,
      watchedOn,
      createdAt: new Date().toISOString()
    };
    
    // In a real app, this would be posted to your backend
    // For now, we'll just return the new review
    return newReview;
  },

  // Add a series to watchlist
  addToWatchlist: async (userId: string, seriesId: number, note?: string): Promise<WatchlistItem> => {
    const newItem = {
      id: Date.now().toString(),
      userId,
      seriesId,
      note,
      addedAt: new Date().toISOString()
    };
    
    // In a real app, this would be posted to your backend
    return newItem;
  },

  // Image URL helper
  getImageUrl: (path: string | null, size: string = "w500"): string => {
    if (!path) return "/placeholder.svg";
    return `${TMDB_IMG_URL}/${size}${path}`;
  }
};
