

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
    // A tabela se chama watched_series no Supabase
    const { data, error } = await supabase
      .from('watched_series')
      .select('*')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar séries assistidas:", error);
      return [];
    }
    
    return data || [];
  },
  
  async addWatchedSeries(series: WatchedSeries): Promise<WatchedSeries | null> {
    const { data, error } = await supabase
      .from('watched_series')
      .insert(series)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao adicionar série assistida:", error);
      return null;
    }
    
    return data;
  },
  
  async updateWatchedSeries(series: Partial<WatchedSeries>): Promise<WatchedSeries | null> {
    const { data, error } = await supabase
      .from('watched_series')
      .update(series)
      .eq('id', series.id!)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar série assistida:", error);
      return null;
    }
    
    return data;
  },
  
  async deleteWatchedSeries(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('watched_series')
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
    // A tabela se chama user_watchlist no Supabase
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar watchlist:", error);
      return [];
    }
    
    return data || [];
  },
  
  async addToWatchlist(item: WatchlistItem): Promise<WatchlistItem | null> {
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert(item)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao adicionar à watchlist:", error);
      return null;
    }
    
    return data;
  },
  
  async updateWatchlistItem(item: Partial<WatchlistItem>): Promise<WatchlistItem | null> {
    const { data, error } = await supabase
      .from('user_watchlist')
      .update(item)
      .eq('id', item.id!)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao atualizar item da watchlist:", error);
      return null;
    }
    
    return data;
  },
  
  async removeFromWatchlist(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_watchlist')
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

