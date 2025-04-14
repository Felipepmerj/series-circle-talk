
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import Header from "../components/Header";
import { FiMail } from "react-icons/fi";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Check if user is already logged in
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
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          setAuthError("O provedor Google não está habilitado. Por favor, use email e senha ou habilite o provedor no painel do Supabase.");
          toast.error("Provedor Google não habilitado", {
            description: "Use email e senha para login ou habilite o Google Auth no painel do Supabase",
          });
        } else {
          setAuthError(error.message);
          toast.error("Erro ao fazer login com Google", {
            description: error.message,
          });
        }
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Ocorreu um erro durante o login");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Campos obrigatórios", {
        description: "Email e senha são obrigatórios",
      });
      return;
    }
    
    setLoading(true);
    setAuthError(null);
    
    try {
      let result;
      
      if (isSignUp) {
        // Sign up flow
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        // Sign in flow
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }
      
      const { error } = result;
      
      if (error) {
        setAuthError(error.message);
        toast.error(isSignUp ? "Erro ao criar conta" : "Erro ao fazer login", {
          description: error.message,
        });
      } else if (isSignUp && result.data?.user && !result.data.session) {
        // If user signed up but no session (email confirmation required)
        toast.success("Conta criada com sucesso", {
          description: "Verifique seu email para confirmar sua conta",
        });
      } else if (result.data?.session) {
        // Successful login
        navigate("/");
      }
    } catch (error) {
      console.error("Erro de autenticação:", error);
      toast.error("Ocorreu um erro durante a autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={isSignUp ? "Criar Conta" : "Entrar"} showBackButton />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Bem-vindo ao TVTracker</h1>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? "Crie sua conta para começar" : "Faça login para acompanhar suas séries favoritas"}
            </p>
          </div>
          
          {authError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="********"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-3"
              disabled={loading}
            >
              <FiMail size={20} />
              {loading ? "Processando..." : isSignUp ? "Criar Conta" : "Entrar com Email"}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">ou</span>
            </div>
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
            
            <div className="text-center text-sm">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-primary hover:underline"
              >
                {isSignUp ? "Já tem uma conta? Faça login" : "Não tem uma conta? Cadastre-se"}
              </button>
            </div>
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
