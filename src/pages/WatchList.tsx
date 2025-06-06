
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import SeriesCard from "../components/SeriesCard";
import { api } from "../services/api";
import { Series } from "../types/Series";
import { useAuth } from "../hooks/useAuth";
import { supabaseService } from "../services/supabaseService";
import BottomNav from "../components/BottomNav";

const WatchList: React.FC = () => {
  const { user } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      
      try {
        // Buscar watchlist do usuário do Supabase
        const watchlist = await supabaseService.getWatchlist(user.id);
        
        // Buscar detalhes das séries da API
        const seriesWithDetails = await Promise.all(
          watchlist.map(async item => {
            try {
              // Use seriesId property that is added by the getWatchlist helper
              return await api.getSeriesById(item.seriesId);
            } catch (error) {
              console.error(`Erro ao buscar detalhes da série ${item.seriesId}:`, error);
              return null;
            }
          })
        );
        
        setSeries(seriesWithDetails.filter(Boolean) as Series[]);
      } catch (error) {
        console.error("Erro ao buscar watchlist:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchlist();
  }, [user]);
  
  return (
    <div className="app-container pb-20">
      <Header title="Quero Assistir" showSearchButton />
      
      {loading ? (
        <div className="animate-pulse grid grid-cols-2 gap-4 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-muted rounded-lg h-64"></div>
          ))}
        </div>
      ) : series.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {series.map(item => (
            <SeriesCard 
              key={item.id} 
              series={item}
              showRating={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Você ainda não adicionou séries à sua lista.</p>
          <Link to="/search" className="text-primary mt-2 inline-block">
            Buscar séries para assistir
          </Link>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default WatchList;
