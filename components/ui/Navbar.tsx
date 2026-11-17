"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Home, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
          <Home className="h-6 w-6" />
          <span>Receptek</span>
        </Link>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/addrecipe">
                    <Button variant="outline">Új recept</Button>
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 hover:opacity-80 transition"
                  >
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage
                        src={user.photoURL || undefined}
                        alt={user.displayName || "Profilkép"}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    {user.displayName && (
                      <span className="text-sm font-medium hidden sm:inline">
                        {user.displayName}
                      </span>
                    )}
                  </Link>

                  <Button variant="ghost" onClick={logout}>
                    Kijelentkezés
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button>Bejelentkezés</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
