import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
        .eq(idField, itemId)
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
};
