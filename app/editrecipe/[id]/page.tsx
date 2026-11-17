"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RecipeForm } from "@/components/RecipesForm";

function EditRecipeContent() {
  const params = useParams();
  const id = params.id as string;

  return <RecipeForm recipeId={id} />;
}

export default function EditRecipePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">Betöltés...</p>}>
      <EditRecipeContent />
    </Suspense>
  );
}
