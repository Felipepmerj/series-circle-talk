
import React, { useState } from "react";
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
  const [searched, setSearched] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const searchResults = await api.searchSeries(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching series:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
        ) : searched ? (
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
              <p className="text-muted-foreground">Nenhuma série encontrada.</p>
            </div>
          )
        ) : (
          <div className="p-8 text-center">
            <SearchIcon size={40} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Busque por sua série favorita
            </p>
          </div>
        )}
      </div>
      
      {/* Use the reusable BottomNav component */}
      <BottomNav />
    </div>
  );
};

export default Search;
