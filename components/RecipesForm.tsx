"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadImage, deleteImage } from "@/lib/cloudinaryUtils";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipeFormProps {
  recipeId?: string;
}

export function RecipeForm({ recipeId }: RecipeFormProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [existingDeleteUrl, setExistingDeleteUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingRecipe, setFetchingRecipe] = useState(!!recipeId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!recipeId) return;

    const loadRecipe = async () => {
      try {
        const docRef = doc(db, "recipes", recipeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setIngredients(
            Array.isArray(data.ingredients) && data.ingredients.length > 0
              ? data.ingredients
              : [""]
          );
          setSteps(data.steps || "");
          setCategory(data.category || "");
          setPreview(data.imageUrl || null);
          setExistingImageUrl(data.imageUrl || "");
          setExistingDeleteUrl(data.deleteUrl || "");
        } else {
          toast.error("A recept nem található!");
          router.push("/");
        }
      } catch (error) {
        console.error("Hiba betöltéskor:", error);
        toast.error("Nem sikerült betölteni a receptet.");
      } finally {
        setFetchingRecipe(false);
      }
    };

    loadRecipe();
  }, [recipeId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleChangeIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, ""]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeId && !file) {
      toast.error("Kép feltöltése kötelező!");
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = existingImageUrl;
      let deleteUrl = existingDeleteUrl;

      if (file) {
        const imgData = await uploadImage(file);
        if (!imgData) throw new Error("Képfeltöltési hiba");

        imageUrl = imgData.url;
        deleteUrl = imgData.public_id;

        if (existingDeleteUrl && !existingDeleteUrl.startsWith("http")) {
          await deleteImage(existingDeleteUrl);
        }
      }

      const cleanIngredients = ingredients.filter((item) => item.trim() !== "");
      const payload = {
        name,
        ingredients: cleanIngredients,
        steps,
        category,
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Névtelen",
        imageUrl,
        deleteUrl,
      };

      if (recipeId) {
        await updateDoc(doc(db, "recipes", recipeId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast.success("Recept sikeresen frissítve!");
      } else {
        await addDoc(collection(db, "recipes"), {
          ...payload,
          timestamp: serverTimestamp(),
        });
        toast.success("Feltöltés sikeres!");
      }

      router.push("/");
    } catch (error) {
      console.error("Hiba:", error);
      toast.error("Hiba történt a mentés során!");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchingRecipe) {
    return <p className="p-8 text-center text-muted-foreground">Betöltés...</p>;
  }

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {recipeId ? "Recept szerkesztése" : "Új recept feltöltése"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            title="Vissza"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Recept neve</Label>
              <Input
                id="name"
                placeholder="Pl. Palacsinta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Hozzávalók</Label>
              <div className="space-y-2">
                {ingredients.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        handleChangeIngredient(index, e.target.value)
                      }
                      placeholder={`${index + 1}. hozzávaló`}
                      required={index === 0}
                    />

                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {index === ingredients.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAddIngredient}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Elkészítés lépései</Label>
              <Textarea
                id="steps"
                rows={5}
                placeholder="Írd le a recept elkészítését..."
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategória</Label>
              <Input
                id="category"
                placeholder="Pl. Desszert, Főétel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">
                {recipeId ? "Új fotó (opcionális)" : "Fotó a receptről"}
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Előnézet"
                  className="mt-2 h-48 w-full rounded-md object-cover border"
                />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Mentés folyamatban..."
                : recipeId
                ? "Módosítások mentése"
                : "Mentés"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
