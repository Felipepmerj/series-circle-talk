
import { supabase } from "@/integrations/supabase/client";

export type SeriesStatus = 'assistindo' | 'assistido' | 'watchlist';

export const seriesStatusService = {
  // Obter o status de uma série específica para o usuário atual
  async getSeriesStatus(seriesId: number): Promise<SeriesStatus | null> {
    const { data, error } = await supabase
      .from('series_status')
      .select('status')
      .eq('series_id', seriesId)
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao obter status da série:", error);
      return null;
    }
    
    return data?.status as SeriesStatus || null;
  },
  
  // Obter todas as séries com um status específico para o usuário atual
  async getSeriesByStatus(status: SeriesStatus): Promise<number[]> {
    const { data, error } = await supabase
      .from('series_status')
      .select('series_id')
      .eq('status', status);
    
    if (error) {
      console.error(`Erro ao obter séries com status ${status}:`, error);
      return [];
    }
    
    return data.map(item => item.series_id);
  },
  
  // Atualizar ou adicionar o status de uma série
  async updateSeriesStatus(seriesId: number, status: SeriesStatus): Promise<boolean> {
    const { error } = await supabase
      .from('series_status')
      .upsert(
        { 
          series_id: seriesId, 
          status: status,
          user_id: (await supabase.auth.getUser()).data.user?.id
        },
        { onConflict: 'user_id,series_id' }
      );
    
    if (error) {
      console.error("Erro ao atualizar status da série:", error);
      return false;
    }
    
    return true;
  },
  
  // Remover o status de uma série
  async removeSeriesStatus(seriesId: number): Promise<boolean> {
    const { error } = await supabase
      .from('series_status')
      .delete()
      .eq('series_id', seriesId);
    
    if (error) {
      console.error("Erro ao remover status da série:", error);
      return false;
    }
    
    return true;
  }
};
