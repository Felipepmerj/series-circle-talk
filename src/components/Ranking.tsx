import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import SeriesCard from './SeriesCard';
import { FaFire, FaStar } from 'react-icons/fa';

export const Ranking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mostWatched' | 'topRated'>('mostWatched');
  const [mostWatched, setMostWatched] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'mostWatched') {
        const data = await supabaseService.getMostWatchedSeries();
        setMostWatched(data);
      } else {
        const data = await supabaseService.getTopRatedSeries();
        setTopRated(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ranking</h1>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('mostWatched')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'mostWatched'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaFire />
              <span>Mais Vistas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('topRated')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'topRated'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaStar />
              <span>Melhores Avaliadas</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'mostWatched' && mostWatched.map((series) => (
                <SeriesCard
                  key={series.tmdb_id}
                  series={series}
                  showUserInfo={true}
                />
              ))}
              
              {activeTab === 'topRated' && topRated.map((series) => (
                <SeriesCard
                  key={series.tmdb_id}
                  series={series}
                  showUserInfo={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 