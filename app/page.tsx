"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string;
  category: string;
  uid: string;
  displayName?: string;
  imageUrl: string;
  deleteUrl?: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const q = query(collection(db, "recipes"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Recipe[];
        setRecipes(list);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore hiba:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (recipe: Recipe) => {
    if (!confirm(`Biztosan törlöd ezt a receptet: ${recipe.name}?`)) return;

    try {
      // Csak akkor hívjuk a Cloudinary API-t, ha van deleteUrl és az NEM egy régi ImgBB http link
      if (recipe.deleteUrl && !recipe.deleteUrl.startsWith("http")) {
        const res = await fetch("/api/deleteImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: recipe.deleteUrl }),
        });

        if (!res.ok) {
          console.warn("A képet nem sikerült törölni Cloudinary-ból, de a recept törlődik.");
        }
      }

      // Dokumentum törlése Firestore-ból (régi és új receptnél is lefut)
      await deleteDoc(doc(db, "recipes", recipe.id));
      toast.success("Recept sikeresen törölve!");
    } catch (error) {
      console.error("Törlési hiba:", error);
      toast.error("Nem sikerült törölni a receptet.");
    }
  };


  const filteredRecipes = recipes.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Receptek</h1>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Keresés név vagy kategória..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Receptek betöltése...</p>
      ) : filteredRecipes.length === 0 ? (
        <p className="text-muted-foreground">Nincs megjeleníthető recept.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden flex flex-col">
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="h-48 w-full object-cover"
                />
              )}

              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">{recipe.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Feltöltötte: {recipe.displayName || "Ismeretlen"}
                  </p>
                </div>
                {recipe.category && <Badge>{recipe.category}</Badge>}
              </CardHeader>

              <CardContent className="flex-1 space-y-3 text-sm">
                <div>
                  <span className="font-semibold">Hozzávalók: </span>
                  <span className="text-muted-foreground">
                    {Array.isArray(recipe.ingredients)
                      ? recipe.ingredients.join(", ")
                      : recipe.ingredients}
                  </span>
                </div>
                <p className="line-clamp-3 text-muted-foreground">
                  {recipe.steps}
                </p>
              </CardContent>

              {user?.uid === recipe.uid && (
                <CardFooter className="border-t pt-4 justify-end gap-2">
                  <Link href={`/editrecipe/${recipe.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Szerkesztés
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(recipe)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Törlés
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
