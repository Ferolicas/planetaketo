"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ email: string; mustChangePassword: boolean }>(
        "/api/auth/login",
        { email, password }
      );
      router.replace(res.mustChangePassword ? "/cambiar-clave" : "/alimentos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-5xl" aria-hidden>
          🥑
        </div>
        <h1 className="mt-2 text-xl font-bold">Planeta Keto Scan</h1>
        <p className="text-sm text-muted-foreground">Entra con tu email de compra</p>
      </div>

      <Card className="w-full max-w-sm p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="h-11 w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            Entrar
          </Button>
        </form>
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        Tu cuenta se crea automáticamente al comprar. Si es tu primera vez, usa la
        contraseña que recibiste y te pediremos cambiarla.
      </p>
    </div>
  );
}
