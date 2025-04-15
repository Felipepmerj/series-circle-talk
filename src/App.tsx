
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Search from "./pages/Search";
import SeriesDetail from "./pages/SeriesDetail";
import Profile from "./pages/Profile";
import WatchList from "./pages/WatchList";
import Ranking from "./pages/Ranking";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/profile/:userId?" element={<Profile />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/watched" element={<Profile />} />
        <Route path="/watchlist" element={<WatchList />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
