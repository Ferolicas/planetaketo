import { ProfileForm } from "@/components/yo/ProfileForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Mi perfil" };

export default function YoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Mi perfil</h1>
        <p className="text-xs text-muted-foreground">
          Tus datos calculan tus calorías y macros objetivo.
        </p>
      </div>

      <ProfileForm />

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Apariencia</p>
        <ThemeToggle />
      </div>
    </div>
  );
}
