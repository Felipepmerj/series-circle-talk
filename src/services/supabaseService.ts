import { supabase } from "@/integrations/supabase/client";
import { mapWatchedShow, mapWatchlistItem, MappedWatchedShow, MappedWatchlistItem } from "../utils/dataMappers";

// Define proper types to avoid excessive instantiation
type WatchedShow = {
  id: string;
  userId: string;
  seriesId: number;
  rating: number | null;
  comment: string | null;
  timestamp: string;
  public: boolean;
};

type WatchlistItem = {
  id: string;
  userId: string;
  seriesId: number;
  notes: string | null;
  timestamp: string;
  public: boolean;
};

export const supabaseService = {
  async getAllWatchedShows() {
    try {
      const { data, error } = await supabase
        .from('watched_shows')
        .select('*')
        .order('watched_at', { ascending: false });

      if (error) {
        console.error('Error fetching watched shows:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllWatchedShows:', error);
      return null;
    }
  },

  async getWatchedShowDetails(watchedShowId: string) {
    try {
      const { data, error } = await supabase
        .from('watched_shows')
        .select('*')
        .eq('id', watchedShowId)
        .single();

      if (error) {
        console.error('Error fetching watched show:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWatchedShowDetails:', error);
      return null;
    }
  },

  async getAllWatchlistItems() {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching watchlist items:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllWatchlistItems:', error);
      return null;
    }
  },

  async addWatchedShow(userId: string, tmdb_id: string, rating: number, review: string, publicReview: boolean) {
    try {
      const { data, error } = await supabase
        .from('watched_shows')
        .insert([{ user_id: userId, tmdb_id: tmdb_id, rating: rating, review: review, public: publicReview }])
        .select();

      if (error) {
        console.error('Error adding watched show:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addWatchedShow:', error);
      return null;
    }
  },

  async addWatchlistItem(userId: string, tmdb_id: string, note: string, publicItem: boolean) {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert([{ user_id: userId, tmdb_id: tmdb_id, note: note, public: publicItem }])
        .select();

      if (error) {
        console.error('Error adding watch list item:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addWatchlistItem:', error);
      return null;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  },
  
  async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllProfiles:', error);
      return [];
    }
  },

  async updateWatchedShow(watchedShowId: string, rating: number, review: string, publicReview: boolean) {
    try {
      const { data, error } = await supabase
        .from('watched_shows')
        .update({ rating: rating, review: review, public: publicReview })
        .eq('id', watchedShowId)
        .select();

      if (error) {
        console.error('Error updating watched show:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateWatchedShow:', error);
      return null;
    }
  },

  async deleteWatchedShow(watchedShowId: string) {
    try {
      const { error } = await supabase
        .from('watched_shows')
        .delete()
        .eq('id', watchedShowId);

      if (error) {
        console.error('Error deleting watched show:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteWatchedShow:', error);
      return false;
    }
  },

  async deleteWatchlistItem(watchlistItemId: string) {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', watchlistItemId);

      if (error) {
        console.error('Error deleting watchlist item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteWatchlistItem:', error);
      return false;
    }
  },
  
  // Get comments for a watched show or watchlist item
  async getComments(
    itemId: string, 
    idField: 'watched_show_id' | 'watchlist_item_id' = 'watched_show_id'
  ) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .filter(idField, 'eq', itemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  },

  // Add a comment to a watched show or watchlist item
  async addComment(commentData: {
    content: string;
    watched_show_id?: string;
    watchlist_item_id?: string;
    user_id: string;
    public: boolean;
  }) {
    try {
      if (!commentData.content || (!commentData.watched_show_id && !commentData.watchlist_item_id)) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select();

      if (error) {
        console.error('Error adding comment:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in addComment:', error);
      return null;
    }
  },
  
  // Get watchlist item details
  async getWatchlistItemDetails(watchlistItemId: string) {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('id', watchlistItemId)
        .single();

      if (error) {
        console.error('Error fetching watchlist item:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        tmdb_id: data.tmdb_id,
        created_at: data.created_at,
        note: data.note,
        comment: data.note // For compatibility with watched shows
      };
    } catch (error) {
      console.error('Error in getWatchlistItemDetails:', error);
      return null;
    }
  },

  // Adding the missing methods that are causing TypeScript errors
  
  // Update comment
  async updateComment(commentId: string, content: string) {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .select();

      if (error) {
        console.error('Error updating comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateComment:', error);
      return false;
    }
  },

  // Delete comment
  async deleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  },

  // Method for Series Search Result
  async addToWatchlist(data: {
    user_id: string;
    series_id: number;
    title: string;
    poster_path: string | null;
    notes: string;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('watchlist')
        .insert([{ 
          user_id: data.user_id, 
          tmdb_id: data.series_id.toString(),
          note: data.notes,
          public: true
        }])
        .select();

      if (error) {
        console.error('Error adding to watchlist:', error);
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error in addToWatchlist:', error);
      return null;
    }
  },

  // Methods for SeriesDetail.tsx
  async getAllUserProfiles() {
    return this.getAllProfiles();
  },

  // Get watched series for a user
  async getWatchedSeries(userId: string): Promise<MappedWatchedShow[]> {
    try {
      const { data, error } = await supabase
        .from('watched_shows')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (error) {
        console.error('Error fetching watched series:', error);
        return [];
      }

      // Map the database fields to fields that matches the rest of app
      return (data || []).map(show => mapWatchedShow(show));
    } catch (error) {
      console.error('Error in getWatchedSeries:', error);
      return [];
    }
  },

  // Get watchlist for a user
  async getWatchlist(userId: string): Promise<MappedWatchlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching watchlist:', error);
        return [];
      }

      // Map the database fields to fields that match the rest of app
      return (data || []).map(item => mapWatchlistItem(item));
    } catch (error) {
      console.error('Error in getWatchlist:', error);
      return [];
    }
  },

  async addWatchedSeries(data: {
    userId: string;
    seriesId: number;
    rating: number | null;
    comment: string;
    public: boolean;
  }): Promise<WatchedShow | null> {
    try {
      const { data: result, error } = await supabase
        .from('watched_shows')
        .insert([{ 
          user_id: data.userId, 
          tmdb_id: data.seriesId.toString(),
          rating: data.rating,
          review: data.comment,
          public: data.public 
        }])
        .select();

      if (error) {
        console.error('Error adding watched show:', error);
        return null;
      }

      return result?.[0] ? mapWatchedShow(result[0]) : null;
    } catch (error) {
      console.error('Error in addWatchedSeries:', error);
      return null;
    }
  },

  async removeFromWatchlist(itemId: string) {
    return this.deleteWatchlistItem(itemId);
  },

  // UserProfile methods
  async updateUserProfile(data: {
    id: string;
    name?: string;
    profile_pic?: string | null;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          profile_pic: data.profile_pic
        })
        .eq('id', data.id)
        .select();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return result?.[0] || null;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return null;
    }
  },

  async uploadAvatar(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  },

  // Update watchlist note
  async updateWatchlistNote(itemId: string, note: string) {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .update({ note: note })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Error updating watchlist note:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in updateWatchlistNote:', error);
      return null;
    }
  }
};
