import type { Metadata } from 'next';
import AdminConsole from '@/components/admin/AdminConsole';

// Panel privado del propietario. Nunca indexar.
export const metadata: Metadata = {
  title: 'Panel | Planeta Keto',
  robots: { index: false, follow: false },
};

export default function FerneyPage() {
  return <AdminConsole />;
}
