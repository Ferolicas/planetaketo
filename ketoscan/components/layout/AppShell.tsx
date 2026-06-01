import { BottomNav } from "./BottomNav";

// Contenedor movil tipo "app": ancho maximo, header fijo y nav inferior.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="text-xl" aria-hidden>
            🥑
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">Planeta Keto Scan</p>
            <p className="text-[11px] text-muted-foreground">
              Tu nutricion keto con IA
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
