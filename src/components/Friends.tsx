import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export const Friends: React.FC = () => {
  const handleInvite = () => {
    const message = encodeURIComponent('Venha assistir séries comigo! Baixe o app Series: https://series-app.vercel.app');
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Convide seus amigos</h1>
          
          <div className="space-y-4">
            <button
              onClick={handleInvite}
              className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <FaWhatsapp className="text-2xl" />
              <span>Convidar via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 