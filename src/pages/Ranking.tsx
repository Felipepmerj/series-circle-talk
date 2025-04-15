
import React, { useState, useEffect } from "react";
import { Star, Eye, UserPlus, List, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import SeriesCard from "../components/SeriesCard";
import { api } from "../services/api";
import { Series } from "../types/Series";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "../components/BottomNav";

const Ranking: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("most-watched");

  const loadSeries = async (filter: string) => {
    setLoading(true);
    setActiveFilter(filter);
    
    try {
      // Na implementação real, cada filtro teria sua própria API call
      // Aqui estamos usando mock data para demonstração
      const mockData = await api.searchSeries("");
      
      // Ordenando de diferentes formas baseadas no filtro
      let filteredData: Series[] = [...mockData];
      
      switch(filter) {
        case "most-watched":
          // Ordenar por popularidade (simulação)
          filteredData.sort((a, b) => b.vote_average - a.vote_average);
          break;
        case "best-rated":
          // Ordenar por nota
          filteredData.sort((a, b) => b.vote_average - a.vote_average);
          break;
        case "friends":
          // Filtrar pelos amigos (simulação)
          filteredData = filteredData.slice(0, 4);
          break;
        case "lists":
          // Filtrar por listas de interesse (simulação)
          filteredData = filteredData.slice(2, 6);
          break;
        case "all":
          // Todos (sem filtro adicional)
          break;
      }
      
      setSeries(filteredData);
    } catch (error) {
      console.error(`Error fetching data with filter ${filter}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o componente for montado
  useEffect(() => {
    loadSeries(activeFilter);
  }, []);

  return (
    <div className="app-container pb-16">
      <Header title="Ranking" showSearchButton />
      
      <Tabs defaultValue="most-watched" className="w-full" onValueChange={loadSeries}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="most-watched" className="flex flex-col items-center text-xs py-2">
            <Eye size={18} className="mb-1" />
            <span>Mais Vistas</span>
          </TabsTrigger>
          <TabsTrigger value="best-rated" className="flex flex-col items-center text-xs py-2">
            <Star size={18} className="mb-1" />
            <span>Melhores</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex flex-col items-center text-xs py-2">
            <UserPlus size={18} className="mb-1" />
            <span>Amigos</span>
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex flex-col items-center text-xs py-2">
            <List size={18} className="mb-1" />
            <span>Listas</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex flex-col items-center text-xs py-2">
            <TrendingUp size={18} className="mb-1" />
            <span>Todos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="most-watched" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="best-rated" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="friends" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="lists" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
        <TabsContent value="all" className="mt-0">
          {renderSeriesList()}
        </TabsContent>
      </Tabs>
      
      <BottomNav />
    </div>
  );
  
  function renderSeriesList() {
    if (loading) {
      return (
        <div className="animate-pulse grid grid-cols-2 gap-4 mt-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-muted rounded-lg h-64"></div>
          ))}
        </div>
      );
    }
    
    if (series.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma série encontrada para este filtro.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-2">
        {series.map(item => (
          <SeriesCard 
            key={item.id} 
            series={item}
            showRating={activeFilter === "best-rated"}
          />
        ))}
      </div>
    );
  }
};

export default Ranking;
