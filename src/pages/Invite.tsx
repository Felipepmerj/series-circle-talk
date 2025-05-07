
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Share2, Copy, Check, Mail, Users } from "lucide-react";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { supabaseService } from "../services/supabaseService";
import { useAuth } from "../hooks/useAuth";

interface FriendProfile {
  id: string;
  name: string;
  profile_pic: string | null;
}

const Invite: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const profiles = await supabaseService.getAllProfiles();
        
        // Filtrar o usuário atual da lista
        const filteredProfiles = profiles.filter(profile => 
          user ? profile.id !== user.id : true
        );
        
        setFriends(filteredProfiles);
      } catch (error) {
        console.error("Erro ao buscar perfis:", error);
        toast.error("Não foi possível carregar a lista de amigos");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [user]);
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Em um app real, isso enviaria um email de convite
    // Por enquanto, apenas simular sucesso
    setInviteSent(true);
    toast.success("Convite enviado com sucesso!");
    setTimeout(() => setInviteSent(false), 3000);
    setEmail("");
  };
  
  const appUrl = window.location.origin;
  const inviteLink = `${appUrl}/register?invitedBy=${user?.id || 'user'}`;
  
  const handleCopyLink = () => {
    // Copiar para a área de transferência
    navigator.clipboard.writeText(inviteLink);
    
    // Mostrar mensagem de sucesso
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 3000);
  };
  
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Junte-se a mim no SeriesTalk para compartilharmos nossas experiências sobre séries! ${inviteLink}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <div className="app-container pb-20">
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
              // Use Web Share API if available
              if (navigator.share) {
                navigator.share({
                  title: 'SeriesTalk',
                  text: 'Junte-se a mim no SeriesTalk para compartilharmos nossas experiências sobre séries!',
                  url: inviteLink,
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
          
          <Button 
            variant="default" 
            className="flex w-full mt-2 bg-green-600 hover:bg-green-700"
            onClick={handleShareWhatsApp}
          >
            <MessageSquare size={16} className="mr-2" />
            Compartilhar via WhatsApp
          </Button>
        </div>
      </div>
      
      {/* Friends list */}
      <div className="mt-6 mb-20">
        <h2 className="text-lg font-medium mb-3">
          {loading ? "Carregando..." : `Usuários (${friends.length})`}
        </h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">Carregando usuários...</div>
          ) : friends.length > 0 ? (
            friends.map((friend) => (
              <Link 
                key={friend.id}
                to={`/profile/${friend.id}`}
                className="flex items-center p-4 border-b last:border-b-0 hover:bg-muted/10"
              >
                <img 
                  src={friend.profile_pic || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name || friend.id}`} 
                  alt={friend.name || "Usuário"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="ml-3 font-medium">{friend.name || "Usuário"}</p>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <Users size={40} className="mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Nenhum usuário encontrado
              </p>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Invite;
