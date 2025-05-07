
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showSearchButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showSearchButton = false 
}) => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)} 
            className="mr-2 p-1 rounded-full hover:bg-muted"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      
      {showSearchButton && (
        <button 
          onClick={() => navigate('/search')} 
          className="p-2 rounded-full hover:bg-muted"
          aria-label="Pesquisar"
        >
          <Search size={20} />
        </button>
      )}
    </header>
  );
};

export default Header;
