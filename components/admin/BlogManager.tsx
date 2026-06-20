'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface AdminPost {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  keywords: string[];
  source_name: string | null;
  source_url: string | null;
  status: string;
  published_at: string | null;
}

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none';

export default function BlogManager() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminPost | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/blog', { cache: 'no-store' });
      if (r.ok) setPosts((await r.json()).posts ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function act(id: number, action: string) {
    if (action === 'delete' && !confirm('¿Borrar este artículo?')) return;
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    load();
  }

  const drafts = posts.filter((p) => p.status === 'draft').length;

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-gray-900">
        Blog <span className="text-base font-normal text-gray-500">({drafts} borradores / {posts.length})</span>
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Revisa los borradores que deja n8n, edítalos y publícalos. Nada se publica sin tu aprobación.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">Aún no hay artículos. El flujo de n8n irá dejando borradores aquí.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {p.category ?? '—'}
                  {p.source_name ? ` · ${p.source_name}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {p.status === 'published' ? 'Publicado' : 'Borrador'}
              </span>
              <button
                onClick={() => setEditing(p)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Revisar
              </button>
              {p.status === 'draft' ? (
                <button
                  onClick={() => act(p.id, 'publish')}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white"
                >
                  Publicar
                </button>
              ) : (
                <button
                  onClick={() => act(p.id, 'unpublish')}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Ocultar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onDelete={() => {
            act(editing.id, 'delete');
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  post,
  onClose,
  onSaved,
  onDelete,
}: {
  post: AdminPost;
  onClose: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [summary, setSummary] = useState(post.summary ?? '');
  const [category, setCategory] = useState(post.category ?? '');
  const [content, setContent] = useState(post.content);
  const [keywords, setKeywords] = useState(post.keywords.join(', '));
  const [sourceName, setSourceName] = useState(post.source_name ?? '');
  const [sourceUrl, setSourceUrl] = useState(post.source_url ?? '');
  const [saving, setSaving] = useState(false);

  async function save(publish: boolean) {
    setSaving(true);
    const r = await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        title: title.trim(),
        summary: summary.trim() || null,
        content,
        category: category.trim() || null,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        sourceName: sourceName.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
        status: publish ? 'published' : 'draft',
      }),
    });
    setSaving(false);
    if (r.ok) onSaved();
    else alert('Error al guardar');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900">Revisar artículo</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Resumen / meta description">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Keywords (coma)">
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Nombre de la fuente">
              <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} className={INPUT} />
            </Field>
            <Field label="URL de la fuente">
              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Contenido (Markdown)">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className={`${INPUT} font-mono text-xs`}
            />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button onClick={onDelete} className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            Borrar
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Cancelar
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Guardar borrador
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? '…' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
