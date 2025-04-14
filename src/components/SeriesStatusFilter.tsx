
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { seriesStatusService } from "../services/seriesStatusService";
import { Loader2 } from "lucide-react";

interface SeriesStatusFilterProps {
  onFilterChange: (seriesIds: number[]) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

const SeriesStatusFilter: React.FC<SeriesStatusFilterProps> = ({ 
  onFilterChange, 
  activeFilter,
  setActiveFilter 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Aplicar filtro quando o usuário clicar em um botão
  const handleFilterClick = async (filter: string | null) => {
    if (!user) {
      return;
    }

    // Se já está selecionado, desativa o filtro
    if (activeFilter === filter) {
      setActiveFilter(null);
      onFilterChange([]);
      return;
    }

    setLoading(true);
    setActiveFilter(filter);

    try {
      if (filter) {
        const seriesIds = await seriesStatusService.getSeriesByStatus(filter as any);
        onFilterChange(seriesIds);
      } else {
        onFilterChange([]);
      }
    } catch (error) {
      console.error("Erro ao aplicar filtro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 overflow-x-auto">
      <Button
        variant={activeFilter === "assistindo" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("assistindo")}
        disabled={loading}
      >
        {loading && activeFilter === "assistindo" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Assistindo
      </Button>
      <Button
        variant={activeFilter === "assistido" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("assistido")}
        disabled={loading}
      >
        {loading && activeFilter === "assistido" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Assistidos
      </Button>
      <Button
        variant={activeFilter === "watchlist" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("watchlist")}
        disabled={loading}
      >
        {loading && activeFilter === "watchlist" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Quero Assistir
      </Button>
    </div>
  );
};

export default SeriesStatusFilter;
