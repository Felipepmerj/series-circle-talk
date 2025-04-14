
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bem-vindo ao aplicativo!</h1>
        <Button variant="outline" onClick={signOut}>
          Sair
        </Button>
      </div>

      {user && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações do usuário:</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Provedor:</strong> {user.app_metadata?.provider || "email"}</p>
        </div>
      )}
    </div>
  );
};

export default Index;
