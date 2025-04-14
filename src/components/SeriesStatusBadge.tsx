
import React, { useEffect, useState } from "react";
import { Play, Check, ListPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SeriesStatus, seriesStatusService } from "../services/seriesStatusService";
import { useAuth } from "../contexts/AuthContext";

interface SeriesStatusBadgeProps {
  seriesId: number;
  onStatusChange?: (newStatus: SeriesStatus | null) => void;
}

const SeriesStatusBadge: React.FC<SeriesStatusBadgeProps> = ({ seriesId, onStatusChange }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SeriesStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar o status atual da série para o usuário
    const fetchStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const currentStatus = await seriesStatusService.getSeriesStatus(seriesId);
        setStatus(currentStatus);
      } catch (error) {
        console.error("Erro ao buscar status da série:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [seriesId, user]);

  // Se não houver usuário ou estiver carregando, não mostrar nada
  if (!user || loading) {
    return null;
  }

  // Se não houver status, não mostrar nada
  if (!status) {
    return null;
  }

  const statusConfig = {
    assistindo: {
      icon: <Play size={14} />,
      text: "Assistindo",
      variant: "default" as const
    },
    assistido: {
      icon: <Check size={14} />,
      text: "Assistido",
      variant: "success" as const
    },
    watchlist: {
      icon: <ListPlus size={14} />,
      text: "Quero Assistir",
      variant: "secondary" as const
    }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.text}
    </Badge>
  );
};

export default SeriesStatusBadge;
