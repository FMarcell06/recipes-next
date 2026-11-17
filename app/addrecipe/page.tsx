"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Plus, X } from "lucide-react"; // A shadcn alapértelmezett ikonkönyvtára!
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddRecipe() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Védett útvonal ellenőrzése
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Kép kiválasztása és előnézet
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  // Fájl átalakítása base64-re a Cloudinary API-hoz
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Dinamikus hozzávalók kezelése
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

    if (!file) {
      toast.error("Kép feltöltése kötelező!");
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      // 1. Kép feltöltése a Next.js Cloudinary végpontra
      const base64Image = await convertToBase64(file);
      const res = await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const imgData = await res.json();
      if (!res.ok) throw new Error(imgData.serverMsg || "Képfeltöltési hiba");

      // 2. Mentés Firestore-ba pontosan a régi mezőneveiddel!
      const cleanIngredients = ingredients.filter((item) => item.trim() !== "");

      await addDoc(collection(db, "recipes"), {
        name,
        ingredients: cleanIngredients,
        steps,
        category,
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Névtelen",
        imageUrl: imgData.url,
        deleteUrl: imgData.public_id, // A régi sémád szerint public_id megy ide!
        createdAt: serverTimestamp(),
      });

      toast.success("Feltöltés sikeres!");
      router.push("/");
    } catch (error) {
      console.error("Hiba:", error);
      toast.error("Hiba történt a feltöltés során!");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Új recept feltöltése</CardTitle>
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
                      onChange={(e) => handleChangeIngredient(index, e.target.value)}
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
              <Label htmlFor="image">Fotó a receptről</Label>
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
              {loading ? "Mentés folyamatban..." : "Mentés"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
