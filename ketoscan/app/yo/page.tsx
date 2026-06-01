import { ProfileForm } from "@/components/yo/ProfileForm";

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
    </div>
  );
}
