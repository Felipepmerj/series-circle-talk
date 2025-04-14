
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Se o usuário já estiver autenticado, redirecione para a página inicial
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setAuthError(error.message || "Falha ao realizar login. Verifique suas credenciais.");
        toast({
          title: "Erro de autenticação",
          description: error.message || "Falha ao realizar login. Verifique suas credenciais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setAuthError("Um erro ocorreu durante a autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) {
        setAuthError(error.message || "Falha ao criar conta.");
        toast({
          title: "Erro no cadastro",
          description: error.message || "Falha ao criar conta.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso",
          description: "Verifique seu e-mail para confirmar seu cadastro.",
        });
      }
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setAuthError("Um erro ocorreu durante o cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Erro ao autenticar com Google:", error);
      setAuthError(error.message || "Falha ao autenticar com Google.");
      toast({
        title: "Erro de autenticação",
        description: "Falha ao autenticar com Google. Verifique se o provedor Google está habilitado no Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>
            Faça login ou crie uma conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              <span>Continuar com Google</span>
            </Button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-500 uppercase">Ou continue com e-mail</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignInWithEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUpWithEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          {authError && (
            <p className="text-sm text-red-500 mb-2">{authError}</p>
          )}
          <p className="text-xs text-center text-gray-500 mt-2">
            Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
