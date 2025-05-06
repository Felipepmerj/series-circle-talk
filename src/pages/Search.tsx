
import React, { useState } from "react";
import { Home, Search as SearchIcon, ListVideo, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { api } from "../services/api";
import { Series } from "../types/Series";
import SeriesSearchResult from "../components/SeriesSearchResult";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="app-container">
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
                series={series} onClickWatched={() => {
 window.location.href = `/series/${series.id}?action=watched`;
                } }
                onClickWatchlist={() => {
 window.location.href = `/series/${series.id}?action=watchlist`;
                } }
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
      
      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <Link to="/" className="nav-tab inactive p-3">
            <Home size={22} />
            <span>Início</span>
          </Link>
          <Link to="/search" className="nav-tab active p-3">
            <SearchIcon size={22} />
            <span>Busca</span>
          </Link>
          <Link to="/watched" className="nav-tab inactive p-3">
            <ListVideo size={22} />
            <span>Minhas Séries</span>
          </Link>
          <Link to="/ranking" className="nav-tab inactive p-3">
            <TrendingUp size={22} />
            <span>Ranking</span>
          </Link>
          <Link to="/invite" className="nav-tab inactive p-3">
            <Users size={22} />
            <span>Amigos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Search;
