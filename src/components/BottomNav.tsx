
import React from "react";
import { NavLink } from "react-router-dom";
import { Activity, Search, UserRound, Users, Award } from "lucide-react";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-20">
      <div className="flex items-center justify-around">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-4 ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Activity size={20} />
          <span className="text-xs mt-1">Feed</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-4 ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Search size={20} />
          <span className="text-xs mt-1">Busca</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-4 ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <UserRound size={20} />
          <span className="text-xs mt-1">Perfil</span>
        </NavLink>

        <NavLink
          to="/invite"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-4 ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Users size={20} />
          <span className="text-xs mt-1">Amigos</span>
        </NavLink>

        <NavLink
          to="/ranking"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-4 ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Award size={20} />
          <span className="text-xs mt-1">Ranking</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
