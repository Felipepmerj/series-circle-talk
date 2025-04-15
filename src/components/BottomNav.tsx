
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ListChecks, TrendingUp, Users } from "lucide-react";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isActive = (path: string): boolean => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="bottom-nav">
      <div className="bottom-nav-content">
        <Link to="/" className={`nav-tab ${isActive("/") ? "active" : "inactive"} p-3`}>
          <Home size={22} />
          <span>Início</span>
        </Link>
        <Link to="/search" className={`nav-tab ${isActive("/search") ? "active" : "inactive"} p-3`}>
          <Search size={22} />
          <span>Busca</span>
        </Link>
        <Link to="/watched" className={`nav-tab ${isActive("/watched") ? "active" : "inactive"} p-3`}>
          <ListChecks size={22} />
          <span>Minhas Séries</span>
        </Link>
        <Link to="/ranking" className={`nav-tab ${isActive("/ranking") ? "active" : "inactive"} p-3`}>
          <TrendingUp size={22} />
          <span>Ranking</span>
        </Link>
        <Link to="/invite" className={`nav-tab ${isActive("/invite") ? "active" : "inactive"} p-3`}>
          <Users size={22} />
          <span>Amigos</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
