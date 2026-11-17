"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { uploadToImgBB } from "@/lib/cloudinaryUtils";
import { Trash2, Upload, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user?.photoURL) {
      setAvatarUrl(user.photoURL);
    }
  }, [user, authLoading, router]);

  const handleUploadAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setLoading(true);
    try {
      const url = await uploadToImgBB(file);
      if (!url) throw new Error("Feltöltési hiba");

      await updateProfile(user, { photoURL: url });
      setAvatarUrl(url);
      setFile(null);
      toast.success("Profilkép sikeresen frissítve!");
    } catch (error) {
      console.error("Hiba az avatár módosításakor:", error);
      toast.error("Nem sikerült frissíteni a profilképet.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateProfile(user, { photoURL: "" });
      setAvatarUrl("");
      toast.success("Profilkép törölve!");
    } catch (error) {
      console.error("Avatár törlési hiba:", error);
      toast.error("Nem sikerült törölni a profilképet.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Profilom</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-28 w-28 border">
              <AvatarImage
                src={avatarUrl || undefined}
                alt="Profilkép"
                className="object-cover"
              />
              <AvatarFallback>
                <UserIcon className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            {avatarUrl && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAvatar}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Profilkép törlése
              </Button>
            )}
          </div>

          <form onSubmit={handleUploadAvatar} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="avatar">Új profilkép feltöltése</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !file}>
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Feltöltés..." : "Profilkép mentése"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
