
import { supabase } from "@/integrations/supabase/client";
import { User } from "../types/Series";

export interface WatchedSeries {
  id?: string;
  user_id: string;
  series_id: number;
  title: string;
  poster_path: string | null;
  rating: number | null;
  comment: string | null;
  watched_at?: string;
  created_at?: string;
}

export interface WatchlistItem {
  id?: string;
  user_id: string;
  series_id: number;
  title: string;
  poster_path: string | null;
  added_at?: string;
  notes: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  profile_pic: string | null;
}

export const supabaseService = {
  // Perfil de usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }
    
    return data;
  },
  
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', profile.id!)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      return null;
    }
    
    return data;
  },
  
  // Séries assistidas
  async getWatchedSeries(userId: string): Promise<WatchedSeries[]> {
    // Conforme os logs, precisamos usar watched_shows em vez de watched_series
    const { data, error } = await supabase
      .from('watched_shows')
      .select('*')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar séries assistidas:", error);
      return [];
    }
    
    // Adaptando os dados recebidos para o formato WatchedSeries
    const adaptedData = data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      series_id: parseInt(item.tmdb_id, 10), // Convertendo tmdb_id para número
      title: "",  // Estes campos serão preenchidos pelo componente que usa este serviço
      poster_path: null,
      rating: item.rating,
      comment: item.review,
      watched_at: item.watched_at,
      created_at: item.created_at
    })) as WatchedSeries[];
    
    return adaptedData;
  },
  
  async addWatchedSeries(series: WatchedSeries): Promise<WatchedSeries | null> {
    // Adaptação para o formato esperado pela tabela watched_shows
    const watchedShow = {
      user_id: series.user_id,
      tmdb_id: series.series_id.toString(),
      rating: series.rating,
      review: series.comment,
      watched_at: series.watched_at || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('watched_shows')
      .insert(watchedShow)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao adicionar série assistida:", error);
      return null;
    }
    
    // Convertendo de volta para o formato WatchedSeries
    return {
      id: data.id,
      user_id: data.user_id,
      series_id: parseInt(data.tmdb_id, 10),
      title: series.title, // Mantemos o título original
      poster_path: series.poster_path,
      rating: data.rating,
      comment: data.review,
      watched_at: data.watched_at,
      created_at: data.created_at
    };
  },
  
  async updateWatchedSeries(series: Partial<WatchedSeries>): Promise<WatchedSeries | null> {
    // Adaptação para o formato esperado pela tabela watched_shows
    const updateData: any = {};
    
    if (series.rating !== undefined) updateData.rating = series.rating;
    if (series.comment !== undefined) updateData.review = series.comment;
    if (series.watched_at !== undefined) updateData.watched_at = series.watched_at;
    
    const { data, error } = await supabase
      .from('watched_shows')
      .update(updateData)
      .eq('id', series.id!)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar série assistida:", error);
      return null;
    }
    
    // Convertendo de volta para o formato WatchedSeries
    return {
      id: data.id,
      user_id: data.user_id,
      series_id: parseInt(data.tmdb_id, 10),
      title: "", // Será preenchido pelo componente que usa este serviço
      poster_path: null,
      rating: data.rating,
      comment: data.review,
      watched_at: data.watched_at,
      created_at: data.created_at
    };
  },
  
  async deleteWatchedSeries(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('watched_shows')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Erro ao excluir série assistida:", error);
      return false;
    }
    
    return true;
  },
  
  // Lista de séries para assistir
  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    // Conforme os logs, precisamos usar watchlist em vez de user_watchlist
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar watchlist:", error);
      return [];
    }
    
    // Adaptando os dados recebidos para o formato WatchlistItem
    const adaptedData = data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      series_id: parseInt(item.tmdb_id, 10), // Convertendo tmdb_id para número
      title: "",  // Estes campos serão preenchidos pelo componente que usa este serviço
      poster_path: null,
      added_at: item.created_at,
      notes: item.note
    })) as WatchlistItem[];
    
    return adaptedData;
  },
  
  async addToWatchlist(item: WatchlistItem): Promise<WatchlistItem | null> {
    // Adaptação para o formato esperado pela tabela watchlist
    const watchlistItem = {
      user_id: item.user_id,
      tmdb_id: item.series_id.toString(),
      note: item.notes
    };
    
    const { data, error } = await supabase
      .from('watchlist')
      .insert(watchlistItem)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao adicionar à watchlist:", error);
      return null;
    }
    
    // Convertendo de volta para o formato WatchlistItem
    return {
      id: data.id,
      user_id: data.user_id,
      series_id: parseInt(data.tmdb_id, 10),
      title: item.title, // Mantemos o título original
      poster_path: item.poster_path,
      added_at: data.created_at,
      notes: data.note
    };
  },
  
  async updateWatchlistItem(item: Partial<WatchlistItem>): Promise<WatchlistItem | null> {
    // Adaptação para o formato esperado pela tabela watchlist
    const updateData: any = {};
    
    if (item.notes !== undefined) updateData.note = item.notes;
    
    const { data, error } = await supabase
      .from('watchlist')
      .update(updateData)
      .eq('id', item.id!)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar item da watchlist:", error);
      return null;
    }
    
    // Convertendo de volta para o formato WatchlistItem
    return {
      id: data.id,
      user_id: data.user_id,
      series_id: parseInt(data.tmdb_id, 10),
      title: "", // Será preenchido pelo componente que usa este serviço
      poster_path: null,
      added_at: data.created_at,
      notes: data.note
    };
  },
  
  async removeFromWatchlist(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Erro ao remover da watchlist:", error);
      return false;
    }
    
    return true;
  },
  
  // Upload de avatar
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  }
};
