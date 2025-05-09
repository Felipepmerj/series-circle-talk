import { Series, User, SeriesReview, WatchlistItem, FeedItem } from "../types/Series";

// Normally we would use fetch to call the real TMDB API
// For this demo, we're using mock data
import { mockSeries, mockUsers, mockFeed } from "../lib/mockData";

const API_KEY = "3fd2be6f0c70a2a598f084ddfb75487c"; // Demo API key for TMDB
const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_URL = "https://image.tmdb.org/t/p";

export const api = {
  // Search for series by title
  searchSeries: async (query: string): Promise<Series[]> => {
    try {
      const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Format the API response to match our Series type
      return data.results.map((item: any) => ({
        id: item.id,
        name: item.name,
        overview: item.overview,
        first_air_date: item.first_air_date || "",
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        genres: item.genre_ids ? item.genre_ids.map((id: number) => ({ 
          id, 
          name: getGenreName(id) 
        })) : [],
        number_of_episodes: item.number_of_episodes || 0,
        number_of_seasons: item.number_of_seasons || 0
      }));
    } catch (error) {
      console.error("Error searching series:", error);
      // Fallback to mock data if API fails
      return mockSeries.filter(series => 
        series.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  // Get series details by ID
  getSeriesById: async (id: number): Promise<Series | undefined> => {
    try {
      const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR`;
      const response = await fetch(url);
      const item = await response.json();
      
      if (item.success === false) {
        throw new Error("Series not found");
      }
      
      // Format the API response to match our Series type
      return {
        id: item.id,
        name: item.name,
        overview: item.overview,
        first_air_date: item.first_air_date || "",
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        genres: item.genres || [],
        number_of_episodes: item.number_of_episodes || 0,
        number_of_seasons: item.number_of_seasons || 0
      };
    } catch (error) {
      console.error("Error getting series details:", error);
      // Fallback to mock data if API fails
      return mockSeries.find(series => series.id === id);
    }
  },

  // Get feed items (activity from friends)
  getFeedItems: async (): Promise<FeedItem[]> => {
    // This is now just a fallback since we're getting data from Supabase
    return mockFeed;
  },

  // Get user details
  getUserById: async (userId: string): Promise<User | undefined> => {
    return mockUsers.find(user => user.id === userId);
  },

  // Get all users (for the friends list)
  getUsers: async (): Promise<User[]> => {
    return mockUsers;
  },

  // Image URL helper
  getImageUrl: (path: string | null, size: string = "w500"): string => {
    if (!path) return "/placeholder.svg";
    return `${TMDB_IMG_URL}/${size}${path}`;
  }
};

// Helper function to get genre name from ID
const getGenreName = (id: number): string => {
  const genreMap: {[key: number]: string} = {
    10759: "Action & Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    10762: "Kids",
    9648: "Mystery",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    37: "Western"
  };
  
  return genreMap[id] || "Unknown";
};
