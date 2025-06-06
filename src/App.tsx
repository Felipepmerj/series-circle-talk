import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Search from "./pages/Search";
import SeriesDetail from "./pages/SeriesDetail";
import Profile from "./pages/Profile";
import WatchList from "./pages/WatchList";
import Ranking from "./pages/Ranking";
import Invite from "./pages/Invite";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/series/:id" element={<SeriesDetail />} />
          <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/user-profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/watched" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><WatchList /></ProtectedRoute>} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
