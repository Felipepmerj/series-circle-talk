
import React, { useState, useEffect } from "react";
import { SearchIcon } from "lucide-react";
import Header from "../components/Header";
import { api } from "../services/api";
import { Series } from "../types/Series";
import SeriesSearchResult from "../components/SeriesSearchResult";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "../components/BottomNav";

const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [latestSeries, setLatestSeries] = useState<Series[]>([]);
  const [latestSeriesPage, setLatestSeriesPage] = useState(1);
  const [loadingLatest, setLoadingLatest] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      const searchResults = await api.searchSeries(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching series:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreLatestSeries = async () => {
    if (loadingLatest) return; // Prevent multiple calls

    setLoadingLatest(true);
    const nextPage = latestSeriesPage + 1;
    try {
      const newLatest = await api.getLatestSeries(nextPage);
      if (newLatest && newLatest.length > 0) {
        setLatestSeries(prevSeries => [...prevSeries, ...newLatest]);
        setLatestSeriesPage(nextPage);
      }
    } catch (error) {
      console.error("Error fetching more latest series:", error);
    } finally {
      setLoadingLatest(false);
    }
  };

  useEffect(() => {
    const fetchLatestSeries = async () => {
      setLoadingLatest(true);
      try {
        // Assuming api.getLatestSeries exists and fetches series by page
        const latest = await api.getLatestSeries(1);
        setLatestSeries(latest || []);
        setLatestSeriesPage(2); // Prepare for loading the next page
      } catch (error) {
        console.error("Error fetching latest series:", error);
        // Handle error, maybe show a message
      } finally {
        setLoadingLatest(false);
      }
    };
  });

  // Effect to fetch initial latest series
  useEffect(() => {
    const fetchLatestSeries = async () => {
      setLoadingLatest(true);
      try {
        // Assuming api.getLatestSeries exists and fetches series by page
        const latest = await api.getLatestSeries(1);
        setLatestSeries(latest || []);
        setLatestSeriesPage(1); // Keep page at 1 after initial fetch
      } catch (error) {
        console.error("Error fetching latest series:", error);
        // Handle error, maybe show a message
      } finally {
        setLoadingLatest(false);
      }
    };
    fetchLatestSeries(); // Call the function to fetch initial series
  }, []); // Empty dependency array means this effect runs only once on mount

  // Effect for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled near the bottom of the page
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

      if (nearBottom && !loadingLatest && !searchPerformed) {
        fetchMoreLatestSeries();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadingLatest, searchPerformed]); // Re-run effect if loading or search status changes

  // Effect for infinite scrolling
  
  return (
    <div className="app-container pb-20">
      <Header title="Buscar Séries" showBackButton />
      
      {/* Search form */}
      <form onSubmit={handleSearch} className="mt-4 mb-6">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Digite o nome da série..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            <SearchIcon size={18} className="mr-2" />
            Buscar
          </Button>
        </div>
      </form>
      
      {/* Search results */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Buscando séries...</div>
        ) : searchPerformed ? (
          results.length > 0 ? (
            results.map((series) => (
              <SeriesSearchResult
                key={series.id}
                series={series}
                onAddToWatched={() => {
                  window.location.href = `/series/${series.id}?action=watched`;
                }}
                onAddToWatchlist={() => {
                  window.location.href = `/series/${series.id}?action=watchlist`;
                }}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma série encontrada para "{query}".</p>
            </div>
          )
        ) : ( // Render initial state message only if no search has been performed
          <div className="p-8 text-center">
            <SearchIcon size={40} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Busque por sua série favorita
            </p>
          </div>
        )}
      </div>
      
      {/* Latest Series */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 px-4">Lançamentos</h2> {/* Added px-4 for padding */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {latestSeries.length > 0 ? (
            latestSeries.map((series) => (
              <SeriesSearchResult
                key={series.id}
                series={series}
                onAddToWatched={() => { window.location.href = `/series/${series.id}?action=watched`; }}
                onAddToWatchlist={() => { window.location.href = `/series/${series.id}?action=watchlist`; }}
              />
            ))
          ) : (
            !loadingLatest && <div className="p-4 text-center text-muted-foreground">Nenhum lançamento encontrado.</div>
          )}
          {/* Latest series list will be rendered here */}
        </div>
      </div>

      {/* Loading indicator for latest series */}
      {loadingLatest && <div className="p-4 text-center">Carregando lançamentos...</div>}
      {/* Use the reusable BottomNav component */}
      <BottomNav />
    </div>
  );
};

export default Search;
