import type { Metadata } from 'next';
import AdminConsole from '@/components/admin/AdminConsole';

// Alias histórico del panel; el panel canónico es /ferney. Nunca indexar.
export const metadata: Metadata = {
  title: 'Panel | Planeta Keto',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
