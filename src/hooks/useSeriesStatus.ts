
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SeriesStatus, seriesStatusService } from "../services/seriesStatusService";
import { toast } from "sonner";

export const useSeriesStatus = (seriesId: number) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SeriesStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar o status inicial
  useEffect(() => {
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

  // Atualizar o status da série
  const updateStatus = async (newStatus: SeriesStatus | null) => {
    if (!user) {
      toast.error("Você precisa estar logado para realizar esta ação");
      return false;
    }

    setLoading(true);

    try {
      if (newStatus === null) {
        // Remover o status
        const success = await seriesStatusService.removeSeriesStatus(seriesId);
        if (success) {
          setStatus(null);
          toast.success("Status removido com sucesso");
        }
        return success;
      } else {
        // Atualizar o status
        const success = await seriesStatusService.updateSeriesStatus(seriesId, newStatus);
        if (success) {
          setStatus(newStatus);
          const statusMessages = {
            assistindo: "Série marcada como Assistindo",
            assistido: "Série marcada como Assistido",
            watchlist: "Série adicionada à sua lista"
          };
          toast.success(statusMessages[newStatus]);
        }
        return success;
      }
    } catch (error) {
      console.error("Erro ao atualizar status da série:", error);
      toast.error("Erro ao atualizar status da série");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    updateStatus
  };
};
