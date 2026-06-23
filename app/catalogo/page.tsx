import { redirect } from 'next/navigation';

// El catálogo ahora ES la home. /catalogo redirige para no duplicar contenido.
export default function CatalogoRedirect() {
  redirect('/');
}
