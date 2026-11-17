"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Receptek
        </Link>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/addrecipe">
                    <Button variant="outline">Új recept</Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button variant="ghost" onClick={logout}>
                    Kilépés
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button>Belépés</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
