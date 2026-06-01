"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-client";

// Alterna modo claro/oscuro (clase .dark en <html>). Persiste en la BD
// (multidispositivo) y cachea en localStorage para evitar parpadeo.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    const value = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ks-theme", value);
    } catch {
      /* almacenamiento no disponible */
    }
    setDark(next);
    // Persistir en la cuenta (BD) — multidispositivo
    fetch(apiUrl("/api/auth/theme"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: value }),
    }).catch(() => {});
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      className="w-full justify-start gap-2"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    </Button>
  );
}
