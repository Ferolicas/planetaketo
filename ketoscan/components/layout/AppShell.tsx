"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { apiUrl } from "@/lib/api-client";

// Rutas sin "chrome" (sin header/nav): login y cambio de contraseña.
const BARE = ["/login", "/cambiar-clave"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const bare = BARE.some((p) => pathname === p || pathname.startsWith(p));
  const [email, setEmail] = useState<string | null>(null);

  // Guard de cliente: valida sesión y fuerza cambio de contraseña.
  useEffect(() => {
    if (bare) return;
    let active = true;
    fetch(apiUrl("/api/auth/me"))
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (!active || !data) return;
        // Tema desde la BD (multidispositivo): aplica y cachea
        if (data.theme) {
          document.documentElement.classList.toggle("dark", data.theme === "dark");
          try {
            localStorage.setItem("ks-theme", data.theme);
          } catch {
            /* sin almacenamiento */
          }
        }
        if (data.mustChangePassword) {
          router.replace("/cambiar-clave");
          return;
        }
        setEmail(data.email);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [bare, pathname, router]);

  async function logout() {
    try {
      await fetch(apiUrl("/api/auth/logout"), { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
  }

  if (bare) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="text-xl" aria-hidden>
            🥑
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight">Planeta Keto Scan</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {email || "Tu nutrición keto con IA"}
            </p>
          </div>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
