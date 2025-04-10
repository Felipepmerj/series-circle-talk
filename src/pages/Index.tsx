import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, Search, ListChecks, ListPlus, Users, Filter } from "lucide-react";
import Header from "../components/Header";
import FeedItem from "../components/FeedItem";
import { api } from "../services/api";
import { FeedItem as FeedItemType, Genre } from "../types/Series";

const Index: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const feed = await api.getFeedItems();
        setFeedItems(feed);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeed();
  }, []);
  
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await api.getUsers();
      setUsers(allUsers.map(user => ({ id: user.id, name: user.name })));
    };
    
    const fetchGenres = async () => {
      const genresMap = new Map<number, string>();
      
      for (const series of await Promise.all(feedItems.map(item => api.getSeriesById(item.seriesId)))) {
        if (series) {
          for (const genre of series.genres) {
            genresMap.set(genre.id, genre.name);
          }
        }
      }
      
      setAllGenres(Array.from(genresMap).map(([id, name]) => ({ id, name })));
    };
    
    if (feedItems.length > 0) {
      fetchUsers();
      fetchGenres();
    }
  }, [feedItems]);
  
  const filteredFeed = feedItems.filter(item => {
    let include = true;
    
    if (filterUser) {
      include = include && item.userId === filterUser;
    }
    
    if (filterGenre) {
      // This would need to check if the series has this genre
      // For now, we'll just keep all items if a genre filter is set
      // as we'd need to fetch all series data to check genres
    }
    
    return include;
  });
  
  return (
    <div className="app-container">
      <Header title="SeriesTalk" showSearchButton />
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Feed de Atividades</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-primary"
        >
          <Filter size={16} className="mr-1" />
          Filtros
        </button>
      </div>
      
      {showFilters && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Filtrar por amigo:</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filterUser || ""}
              onChange={(e) => setFilterUser(e.target.value || null)}
            >
              <option value="">Todos os amigos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por gênero:</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filterGenre || ""}
              onChange={(e) => setFilterGenre(Number(e.target.value) || null)}
            >
              <option value="">Todos os gêneros</option>
              {allGenres.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted h-40 rounded-lg"></div>
          ))}
        </div>
      ) : filteredFeed.length > 0 ? (
        filteredFeed.map(item => (
          <FeedItem 
            key={item.id}
            userId={item.userId}
            seriesId={item.seriesId}
            type={item.type}
            timestamp={item.createdAt}
            reviewId={item.reviewId}
            watchlistItemId={item.watchlistItemId}
          />
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma atividade encontrada.</p>
          {filterUser || filterGenre ? (
            <button 
              onClick={() => {
                setFilterUser(null);
                setFilterGenre(null);
              }}
              className="text-primary mt-2"
            >
              Limpar filtros
            </button>
          ) : (
            <Link to="/search" className="text-primary mt-2 inline-block">
              Comece a adicionar séries!
            </Link>
          )}
        </div>
      )}
      
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <Link to="/" className="nav-tab active p-3">
            <Home size={22} />
            <span>Início</span>
          </Link>
          <Link to="/search" className="nav-tab inactive p-3">
            <Search size={22} />
            <span>Busca</span>
          </Link>
          <Link to="/watched" className="nav-tab inactive p-3">
            <ListChecks size={22} />
            <span>Assistidos</span>
          </Link>
          <Link to="/watchlist" className="nav-tab inactive p-3">
            <ListPlus size={22} />
            <span>Quero ver</span>
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

export default Index;
