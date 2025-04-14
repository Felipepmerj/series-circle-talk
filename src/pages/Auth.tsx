
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import Header from "../components/Header";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Verificar se o usuário já está logado
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast.error("Erro ao fazer login com Google", {
          description: error.message,
        });
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Ocorreu um erro durante o login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Entrar" showBackButton />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Bem-vindo ao TVTracker</h1>
            <p className="mt-2 text-muted-foreground">
              Faça login para acompanhar suas séries favoritas
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-3"
              onClick={handleLoginWithGoogle}
              disabled={loading}
            >
              <FcGoogle size={20} />
              {loading ? "Conectando..." : "Continuar com Google"}
            </Button>
          </div>
          
          <p className="text-sm text-center text-muted-foreground mt-8">
            Ao fazer login, você concorda com os nossos Termos de Serviço
            e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
