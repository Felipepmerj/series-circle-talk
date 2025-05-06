
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
  // Habilitar debug
  debug: true,
  
  // Função de log para debug
  log(...args: any[]) {
    if (this.debug) {
      console.log('[Supabase Service]', ...args);
    }
  },
  
  // Verificar e criar usuário se necessário
  async ensureUserExists(userId: string, email?: string): Promise<boolean> {
    try {
      this.log(`Verificando se o usuário existe: ${userId}`);
      
      // Verificar se o usuário existe na tabela users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (checkError) {
        this.log("Usuário não encontrado, criando novo");
        
        // Criar usuário na tabela users
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email || `user-${userId}@example.com`, // Valor padrão se email não fornecido
            username: `user-${userId.substring(0, 8)}` // Nome de usuário baseado no ID
          })
          .select();
          
        if (createError) {
          this.log("Erro ao criar usuário:", createError);
          return false;
        }
        
        this.log("Usuário criado com sucesso:", newUser);
        return true;
      }
      
      this.log("Usuário já existe:", existingUser);
      return true;
    } catch (e) {
      this.log("Exceção ao verificar/criar usuário:", e);
      return false;
    }
  },
  
  // Perfil de usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        this.log("Erro ao buscar perfil:", error);
        return null;
      }
      
      return data;
    } catch (e) {
      this.log("Exceção ao buscar perfil:", e);
      return null;
    }
  },
  
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id!)
        .select()
        .single();
        
      if (error) {
        this.log("Erro ao atualizar perfil:", error);
        return null;
      }
      
      return data;
    } catch (e) {
      this.log("Exceção ao atualizar perfil:", e);
      return null;
    }
  },
  
  // Séries assistidas
  async getWatchedSeries(userId: string): Promise<WatchedSeries[]> {
    try {
      this.log(`Buscando séries assistidas para o usuário ${userId}`);
      
      const { data, error } = await supabase
        .from('watched_shows')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });
        
      if (error) {
        this.log("Erro ao buscar séries assistidas:", error);
        return [];
      }
      
      this.log(`Encontradas ${data.length} séries assistidas`);
      
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
    } catch (e) {
      this.log("Exceção ao buscar séries assistidas:", e);
      return [];
    }
  },
  
  async addWatchedSeries(series: WatchedSeries): Promise<WatchedSeries | null> {
    try {
      this.log(`Adicionando série assistida:`, series);
      
      // Garantir que o usuário existe antes de adicionar
      const userExists = await this.ensureUserExists(series.user_id);
      
      if (!userExists) {
        this.log("Não foi possível adicionar a série assistida, usuário não existe e não pôde ser criado");
        return null;
      }
      
      // Adaptação para o formato esperado pela tabela watched_shows
      const watchedShow = {
        user_id: series.user_id,
        tmdb_id: series.series_id.toString(),
        rating: series.rating,
        review: series.comment,
        watched_at: series.watched_at || new Date().toISOString()
      };
      
      this.log("Dados formatados para inserção:", watchedShow);
      
      const { data, error } = await supabase
        .from('watched_shows')
        .insert(watchedShow)
        .select()
        .single();
        
      if (error) {
        this.log("Erro ao adicionar série assistida:", error);
        return null;
      }
      
      this.log("Série assistida adicionada com sucesso:", data);
      
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
    } catch (e) {
      this.log("Exceção ao adicionar série assistida:", e);
      return null;
    }
  },
  
  async updateWatchedSeries(series: Partial<WatchedSeries>): Promise<WatchedSeries | null> {
    try {
      this.log(`Atualizando série assistida:`, series);
      
      // Adaptação para o formato esperado pela tabela watched_shows
      const updateData: any = {};
      
      if (series.rating !== undefined) updateData.rating = series.rating;
      if (series.comment !== undefined) updateData.review = series.comment;
      if (series.watched_at !== undefined) updateData.watched_at = series.watched_at;
      
      this.log("Dados formatados para atualização:", updateData);
      
      const { data, error } = await supabase
        .from('watched_shows')
        .update(updateData)
        .eq('id', series.id!)
        .select()
        .single();
        
      if (error) {
        this.log("Erro ao atualizar série assistida:", error);
        return null;
      }
      
      this.log("Série assistida atualizada com sucesso:", data);
      
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
    } catch (e) {
      this.log("Exceção ao atualizar série assistida:", e);
      return null;
    }
  },
  
  async deleteWatchedSeries(id: string): Promise<boolean> {
    try {
      this.log(`Excluindo série assistida com ID ${id}`);
      
      const { error } = await supabase
        .from('watched_shows')
        .delete()
        .eq('id', id);
        
      if (error) {
        this.log("Erro ao excluir série assistida:", error);
        return false;
      }
      
      this.log("Série assistida excluída com sucesso");
      return true;
    } catch (e) {
      this.log("Exceção ao excluir série assistida:", e);
      return false;
    }
  },
  
  // Lista de séries para assistir
  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      this.log(`Buscando watchlist para o usuário ${userId}`);
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        this.log("Erro ao buscar watchlist:", error);
        return [];
      }
      
      this.log(`Encontrados ${data.length} itens na watchlist`);
      
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
    } catch (e) {
      this.log("Exceção ao buscar watchlist:", e);
      return [];
    }
  },
  
  async addToWatchlist(item: WatchlistItem): Promise<WatchlistItem | null> {
    try {
      this.log(`Adicionando à watchlist:`, item);
      
      // Garantir que o usuário existe antes de adicionar
      const userExists = await this.ensureUserExists(item.user_id);
      
      if (!userExists) {
        this.log("Não foi possível adicionar à watchlist, usuário não existe e não pôde ser criado");
        return null;
      }
      
      // Adaptação para o formato esperado pela tabela watchlist
      const watchlistItem = {
        user_id: item.user_id,
        tmdb_id: item.series_id.toString(),
        note: item.notes
      };
      
      this.log("Dados formatados para inserção:", watchlistItem);
      
      const { data, error } = await supabase
        .from('watchlist')
        .insert(watchlistItem)
        .select()
        .single();
        
      if (error) {
        this.log("Erro ao adicionar à watchlist:", error);
        return null;
      }
      
      this.log("Item adicionado à watchlist com sucesso:", data);
      
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
    } catch (e) {
      this.log("Exceção ao adicionar à watchlist:", e);
      return null;
    }
  },
  
  async updateWatchlistItem(item: Partial<WatchlistItem>): Promise<WatchlistItem | null> {
    try {
      this.log(`Atualizando item da watchlist:`, item);
      
      // Adaptação para o formato esperado pela tabela watchlist
      const updateData: any = {};
      
      if (item.notes !== undefined) updateData.note = item.notes;
      
      this.log("Dados formatados para atualização:", updateData);
      
      const { data, error } = await supabase
        .from('watchlist')
        .update(updateData)
        .eq('id', item.id!)
        .select()
        .single();
        
      if (error) {
        this.log("Erro ao atualizar item da watchlist:", error);
        return null;
      }
      
      this.log("Item da watchlist atualizado com sucesso:", data);
      
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
    } catch (e) {
      this.log("Exceção ao atualizar item da watchlist:", e);
      return null;
    }
  },
  
  async removeFromWatchlist(id: string): Promise<boolean> {
    try {
      this.log(`Removendo item da watchlist com ID ${id}`);
      
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id);
        
      if (error) {
        this.log("Erro ao remover da watchlist:", error);
        return false;
      }
      
      this.log("Item removido da watchlist com sucesso");
      return true;
    } catch (e) {
      this.log("Exceção ao remover da watchlist:", e);
      return false;
    }
  },
  
  // Upload de avatar
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      this.log(`Fazendo upload de avatar para o usuário ${userId}`);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (error) {
        this.log("Erro ao fazer upload do avatar:", error);
        return null;
      }
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      this.log("Avatar enviado com sucesso:", data.publicUrl);
      return data.publicUrl;
    } catch (e) {
      this.log("Exceção ao fazer upload do avatar:", e);
      return null;
    }
  }
};
