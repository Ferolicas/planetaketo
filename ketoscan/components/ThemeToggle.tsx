"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Alterna modo claro/oscuro (clase .dark en <html>) y lo persiste en localStorage.
// El layout aplica el tema guardado antes de pintar para evitar parpadeo.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ks-theme", next ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible */
    }
    setDark(next);
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
