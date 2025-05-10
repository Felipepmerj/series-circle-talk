
import React from "react";

const EmptyState: React.FC<{
  itemsExist: boolean;
}> = ({ itemsExist }) => {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <p className="text-muted-foreground">Nenhuma atividade recente.</p>
      <p className="text-sm text-muted-foreground mt-2">
        {itemsExist ? 
          "Erro ao processar atividades. Por favor, recarregue a página." :
          "Comece adicionando séries à sua lista!"}
      </p>
    </div>
  );
};

export default EmptyState;
