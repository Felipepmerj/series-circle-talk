
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Search, ListChecks, ListPlus, Users, Mail, Share2, Copy, Check } from "lucide-react";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "../services/api";

const Invite: React.FC = () => {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send an email invitation
    // For now, just simulate success
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
    setEmail("");
  };
  
  const handleCopyLink = () => {
    // Generate an invitation link
    const inviteLink = `https://seriestalk.app/join?invitedBy=user1`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteLink);
    
    // Show success message
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  
  // Get friends for the friends list
  const [friends, setFriends] = React.useState<{ id: string; name: string; profilePic?: string; }[]>([]);
  
  React.useEffect(() => {
    const fetchFriends = async () => {
      const users = await api.getUsers();
      // Exclude current user
      setFriends(users.filter(user => user.id !== "user1").map(user => ({
        id: user.id,
        name: user.name,
        profilePic: user.profilePic
      })));
    };
    
    fetchFriends();
  }, []);
  
  return (
    <div className="app-container">
      <Header title="Amigos" showBackButton />
      
      {/* Invite section */}
      <div className="bg-white rounded-lg shadow p-4 mt-4">
        <h2 className="text-lg font-medium mb-4">Convidar amigos</h2>
        
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-2">
            <Input 
              type="email"
              placeholder="Email do seu amigo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow"
              required
            />
            <Button type="submit" disabled={inviteSent}>
              <Mail size={16} className="mr-2" />
              Enviar
            </Button>
          </div>
          
          {inviteSent && (
            <p className="text-sm text-green-600 flex items-center">
              <Check size={14} className="mr-1" />
              Convite enviado!
            </p>
          )}
        </form>
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Ou compartilhe o link de convite</p>
          <Button 
            variant="outline" 
            className="flex w-full"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Link copiado!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" />
                Copiar link
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex w-full mt-2"
            onClick={() => {
              // In a real app, this would open the device's share dialog
              if (navigator.share) {
                navigator.share({
                  title: 'SeriesTalk',
                  text: 'Junte-se a mim no SeriesTalk para compartilharmos nossas experiências sobre séries!',
                  url: 'https://seriestalk.app/join?invitedBy=user1',
                });
              } else {
                // Fallback if Web Share API is not available
                handleCopyLink();
              }
            }}
          >
            <Share2 size={16} className="mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
      
      {/* Friends list */}
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-3">Seus amigos ({friends.length})</h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {friends.map((friend) => (
            <Link 
              key={friend.id}
              to={`/profile/${friend.id}`}
              className="flex items-center p-4 border-b last:border-b-0 hover:bg-muted/10"
            >
              <img 
                src={friend.profilePic || "/placeholder.svg"} 
                alt={friend.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <p className="ml-3 font-medium">{friend.name}</p>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <Link to="/" className="nav-tab inactive p-3">
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
          <Link to="/invite" className="nav-tab active p-3">
            <Users size={22} />
            <span>Amigos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Invite;
