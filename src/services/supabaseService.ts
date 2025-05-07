import { supabase } from "@/integrations/supabase/client";
import { User } from "../types/Series";

export interface WatchedSeries {
  id?: string;
  user_id: string;
  series_id: number;
  tmdb_id: string;
  title: string;
  poster_path: string | null;
  rating: number | null;
  comment: string | null;
  watched_at?: string;
  created_at?: string;
  user_name?: string;
  user_profile_pic?: string;
}

export interface WatchlistItem {
  id?: string;
  user_id: string;
  series_id: number;
  tmdb_id: string;
  title: string;
  poster_path: string | null;
  added_at?: string;
  notes: string | null;
  user_name?: string;
  user_profile_pic?: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  profile_pic: string | null;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  genre_ids: number[];
  original_name: string;
  original_language: string;
  origin_country: string[];
  tmdb_id: string;
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
      
      // Verificar se o usuário existe na tabela profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (checkError || !existingUser) {
        this.log("Perfil não encontrado, criando perfil");
        
        // Criar perfil para o usuário
        const name = email ? email.split('@')[0] : `user-${userId.substring(0, 8)}`;
        
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: name
          });
          
        if (createError) {
          this.log("Erro ao criar perfil:", createError);
          return false;
        }
        
        this.log("Perfil criado com sucesso");
        return true;
      }
      
      this.log("Perfil já existe:", existingUser);
      return true;
    } catch (e) {
      this.log("Exceção ao verificar/criar perfil:", e);
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
        .maybeSingle();
        
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
        tmdb_id: item.tmdb_id,
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
  
  // Método para buscar detalhes de uma série assistida específica pelo ID
  async getWatchedShowDetails(showId: string): Promise<{ rating: number | null; comment: string | null } | null> {
    try {
      this.log(`Buscando detalhes da série assistida ${showId}`);
      
      const { data, error } = await supabase
        .from('watched_shows')
        .select('rating, review')
        .eq('id', showId)
        .single();
        
      if (error) {
        this.log("Erro ao buscar detalhes da série assistida:", error);
        return null;
      }
      
      this.log("Detalhes da série assistida encontrados:", data);
      
      return {
        rating: data.rating,
        comment: data.review
      };
    } catch (e) {
      this.log("Exceção ao buscar detalhes da série assistida:", e);
      return null;
    }
  },
  
  async addWatchedSeries(series: WatchedSeries): Promise<WatchedSeries | null> {
    try {
      this.log(`Adicionando série assistida:`, series);
      
      // Garantir que o perfil do usuário existe antes de adicionar
      const userExists = await this.ensureUserExists(series.user_id);
      
      if (!userExists) {
        this.log("Não foi possível adicionar a série assistida, perfil não existe e não pôde ser criado");
        return null;
      }
      
      // Verificar se o usuário já existe na tabela que tem a chave estrangeira
      const { data: existingRecord, error: existingError } = await supabase
        .from('watched_shows')
        .select('id')
        .eq('user_id', series.user_id)
        .eq('tmdb_id', series.series_id.toString())
        .maybeSingle();
      
      if (existingRecord) {
        this.log("A série já foi marcada como assistida por este usuário. Atualizando.");
        
        const updateData = {
          rating: series.rating,
          review: series.comment,
          watched_at: series.watched_at
        };
        
        const { data: updatedData, error: updateError } = await supabase
          .from('watched_shows')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
          .single();
          
        if (updateError) {
          this.log("Erro ao atualizar série assistida:", updateError);
          return null;
        }
        
        this.log("Série assistida atualizada com sucesso:", updatedData);
        
        return {
          id: updatedData.id,
          user_id: updatedData.user_id,
          series_id: parseInt(updatedData.tmdb_id, 10),
          tmdb_id: updatedData.tmdb_id,
          title: series.title,
          poster_path: series.poster_path,
          rating: updatedData.rating,
          comment: updatedData.review,
          watched_at: updatedData.watched_at,
          created_at: updatedData.created_at
        };
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
        tmdb_id: data.tmdb_id,
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
        tmdb_id: data.tmdb_id,
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
        tmdb_id: item.tmdb_id,
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
      
      // Garantir que o perfil do usuário existe antes de adicionar
      const userExists = await this.ensureUserExists(item.user_id);
      
      if (!userExists) {
        this.log("Não foi possível adicionar à watchlist, perfil não existe e não pôde ser criado");
        return null;
      }
      
      // Verificar se a série já está na watchlist deste usuário
      const { data: existingItem, error: existingError } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', item.user_id)
        .eq('tmdb_id', item.tmdb_id)
        .maybeSingle();
      
      if (existingItem) {
        this.log("A série já está na watchlist deste usuário. Atualizando.");
        
        const updateData = {
          note: item.notes
        };
        
        const { data: updatedData, error: updateError } = await supabase
          .from('watchlist')
          .update(updateData)
          .eq('id', existingItem.id)
          .select()
          .single();
          
        if (updateError) {
          this.log("Erro ao atualizar item da watchlist:", updateError);
          return null;
        }
        
        this.log("Item da watchlist atualizado com sucesso:", updatedData);
        
        return {
          id: updatedData.id,
          user_id: updatedData.user_id,
          series_id: parseInt(updatedData.tmdb_id, 10),
          tmdb_id: updatedData.tmdb_id,
          title: item.title,
          poster_path: item.poster_path,
          added_at: updatedData.created_at,
          notes: updatedData.note
        };
      }
      
      // Adaptação para o formato esperado pela tabela watchlist
      const watchlistItem = {
        user_id: item.user_id,
        tmdb_id: item.tmdb_id,
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
        tmdb_id: data.tmdb_id,
        title: item.title,
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
        tmdb_id: data.tmdb_id,
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
  
  // Buscar todos os perfis de usuário
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      this.log("Buscando todos os perfis de usuários");
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        this.log("Erro ao buscar perfis:", error);
        return [];
      }
      
      this.log(`Encontrados ${data.length} perfis`);
      return data;
    } catch (e) {
      this.log("Exceção ao buscar perfis:", e);
      return [];
    }
  },
  
  // Buscar todas as séries assistidas (para o feed)
  async getAllWatchedShows(): Promise<any[]> {
    try {
      this.log("Buscando todas as séries assistidas para o feed");
      
      const { data, error } = await supabase
        .from('watched_shows')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        this.log("Erro ao buscar séries assistidas:", error);
        return [];
      }
      
      this.log(`Encontradas ${data.length} séries assistidas`);
      return data;
    } catch (e) {
      this.log("Exceção ao buscar séries assistidas:", e);
      return [];
    }
  },
  
  // Buscar todos os itens de watchlist (para o feed)
  async getAllWatchlistItems(): Promise<any[]> {
    try {
      this.log("Buscando todos os itens de watchlist para o feed");
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        this.log("Erro ao buscar itens de watchlist:", error);
        return [];
      }
      
      this.log(`Encontrados ${data.length} itens de watchlist`);
      return data;
    } catch (e) {
      this.log("Exceção ao buscar itens de watchlist:", e);
      return [];
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
  },

  // Buscar todas as séries assistidas com informações dos usuários
  async getAllWatchedShowsWithUsers(): Promise<WatchedSeries[]> {
    try {
      this.log("Buscando todas as séries assistidas com informações dos usuários");
      
      // Primeiro, buscar todas as séries assistidas
      const { data: watchedShows, error: watchedError } = await supabase
        .from('watched_shows')
        .select('*')
        .order('watched_at', { ascending: false })
        .limit(20);
        
      if (watchedError) {
        this.log("Erro ao buscar séries assistidas:", watchedError);
        return [];
      }

      // Depois, buscar todos os perfis necessários
      const userIds = [...new Set(watchedShows.map(show => show.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        this.log("Erro ao buscar perfis:", profilesError);
        return [];
      }

      // Criar um mapa de perfis para acesso rápido
      const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      this.log(`Encontradas ${watchedShows.length} séries assistidas`);
      
      return watchedShows.map(item => {
        const profile = profilesMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          series_id: parseInt(item.tmdb_id, 10),
          tmdb_id: item.tmdb_id,
          title: "", // Será preenchido pelo componente
          poster_path: null,
          rating: item.rating,
          comment: item.review,
          watched_at: item.watched_at,
          created_at: item.created_at,
          user_name: profile?.name || 'Usuário',
          user_profile_pic: profile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_id}`
        };
      });
    } catch (e) {
      this.log("Exceção ao buscar séries assistidas:", e);
      return [];
    }
  },

  // Buscar séries assistidas de um usuário específico
  async getUserWatchedSeries(userId: string): Promise<WatchedSeries[]> {
    try {
      this.log(`Buscando séries assistidas do usuário ${userId}`);
      
      // Buscar séries assistidas do usuário
      const { data: watchedShows, error: watchedError } = await supabase
        .from('watched_shows')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });
        
      if (watchedError) {
        this.log("Erro ao buscar séries assistidas do usuário:", watchedError);
        return [];
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        this.log("Erro ao buscar perfil do usuário:", profileError);
        return [];
      }
      
      return watchedShows.map(item => ({
        id: item.id,
        user_id: item.user_id,
        series_id: parseInt(item.tmdb_id, 10),
        tmdb_id: item.tmdb_id,
        title: "", // Será preenchido pelo componente
        poster_path: null,
        rating: item.rating,
        comment: item.review,
        watched_at: item.watched_at,
        created_at: item.created_at,
        user_name: profile?.name || 'Usuário',
        user_profile_pic: profile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_id}`
      }));
    } catch (e) {
      this.log("Exceção ao buscar séries assistidas do usuário:", e);
      return [];
    }
  },

  // Buscar watchlist de um usuário específico
  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      this.log(`Buscando watchlist do usuário ${userId}`);
      
      // Buscar itens da watchlist do usuário
      const { data: watchlistItems, error: watchlistError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (watchlistError) {
        this.log("Erro ao buscar watchlist do usuário:", watchlistError);
        return [];
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        this.log("Erro ao buscar perfil do usuário:", profileError);
        return [];
      }
      
      return watchlistItems.map(item => ({
        id: item.id,
        user_id: item.user_id,
        series_id: parseInt(item.tmdb_id, 10),
        tmdb_id: item.tmdb_id,
        title: "", // Será preenchido pelo componente
        poster_path: null,
        added_at: item.created_at,
        notes: item.note,
        user_name: profile?.name || 'Usuário',
        user_profile_pic: profile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_id}`
      }));
    } catch (e) {
      this.log("Exceção ao buscar watchlist do usuário:", e);
      return [];
    }
  },

  async getMostWatchedSeries(): Promise<WatchedSeries[]> {
    try {
      this.log("Buscando séries mais assistidas");
      
      // Primeiro, buscar todas as séries assistidas
      const { data: watchedShows, error: watchedError } = await supabase
        .from('watched_shows')
        .select('*')
        .order('watched_at', { ascending: false })
        .limit(20);
        
      if (watchedError) {
        this.log("Erro ao buscar séries assistidas:", watchedError);
        return [];
      }

      // Depois, buscar todos os perfis necessários
      const userIds = [...new Set(watchedShows.map(show => show.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        this.log("Erro ao buscar perfis:", profilesError);
        return [];
      }

      // Criar um mapa de perfis para acesso rápido
      const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      this.log(`Encontradas ${watchedShows.length} séries assistidas`);
      
      return watchedShows.map(item => {
        const profile = profilesMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          series_id: parseInt(item.tmdb_id, 10),
          tmdb_id: item.tmdb_id,
          title: "", // Será preenchido pelo componente
          poster_path: null,
          rating: item.rating,
          comment: item.review,
          watched_at: item.watched_at,
          created_at: item.created_at,
          user_name: profile?.name || 'Usuário',
          user_profile_pic: profile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_id}`
        };
      });
    } catch (e) {
      this.log("Exceção ao buscar séries assistidas:", e);
      return [];
    }
  },

  async getTopRatedSeries(): Promise<WatchedSeries[]> {
    try {
      this.log("Buscando séries melhor avaliadas");
      
      // Primeiro, buscar todas as séries assistidas
      const { data: watchedShows, error: watchedError } = await supabase
        .from('watched_shows')
        .select('*')
        .order('rating', { ascending: false })
        .limit(20);
        
      if (watchedError) {
        this.log("Erro ao buscar séries assistidas:", watchedError);
        return [];
      }

      // Depois, buscar todos os perfis necessários
      const userIds = [...new Set(watchedShows.map(show => show.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        this.log("Erro ao buscar perfis:", profilesError);
        return [];
      }

      // Criar um mapa de perfis para acesso rápido
      const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      this.log(`Encontradas ${watchedShows.length} séries melhor avaliadas`);
      
      return watchedShows.map(item => {
        const profile = profilesMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          series_id: parseInt(item.tmdb_id, 10),
          tmdb_id: item.tmdb_id,
          title: "", // Será preenchido pelo componente
          poster_path: null,
          rating: item.rating,
          comment: item.review,
          watched_at: item.watched_at,
          created_at: item.created_at,
          user_name: profile?.name || 'Usuário',
          user_profile_pic: profile?.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_id}`
        };
      });
    } catch (e) {
      this.log("Exceção ao buscar séries melhor avaliadas:", e);
      return [];
    }
  },

  async getTopUsers(): Promise<any[]> {
    try {
      this.log("Buscando usuários mais ativos");
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          profile_pic,
          watched_shows (
            id
          )
        `)
        .order('watched_shows.count', { ascending: false })
        .limit(20);
        
      if (error) {
        this.log("Erro ao buscar usuários mais ativos:", error);
        return [];
      }
      
      this.log(`Encontrados ${data.length} usuários mais ativos`);
      
      return data.map(user => ({
        id: user.id,
        name: user.name,
        profile_pic: user.profile_pic,
        watched_count: user.watched_shows?.length || 0
      }));
    } catch (e) {
      this.log("Exceção ao buscar usuários mais ativos:", e);
      return [];
    }
  },

  async getSeriesDetails(tmdbId: string): Promise<Series | null> {
    try {
      this.log(`Buscando detalhes da série ${tmdbId}`);
      
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .single();
        
      if (error) {
        this.log("Erro ao buscar detalhes da série:", error);
        return null;
      }
      
      return {
        id: parseInt(data.tmdb_id, 10),
        name: data.title,
        overview: data.overview || '',
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        first_air_date: data.first_air_date,
        vote_average: data.vote_average,
        vote_count: data.vote_count,
        popularity: data.popularity,
        genre_ids: data.genre_ids || [],
        original_name: data.original_name,
        original_language: data.original_language,
        origin_country: data.origin_country || [],
        tmdb_id: data.tmdb_id
      };
    } catch (e) {
      this.log("Exceção ao buscar detalhes da série:", e);
      return null;
    }
  },
};
