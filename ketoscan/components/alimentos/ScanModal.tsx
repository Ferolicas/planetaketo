"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import type { ScanResult } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (result: ScanResult) => void;
}

// Reduce la imagen a maximo 1280px y la devuelve como data URL JPEG.
async function downscale(file: File): Promise<{ dataUrl: string; mediaType: string }> {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { dataUrl, mediaType: "image/jpeg" };
}

export function ScanModal({ open, onOpenChange, onScanned }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("");

  function reset() {
    setPreview(null);
    setError(null);
    setHint("");
    setLoading(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permitir re-seleccionar el mismo archivo
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const { dataUrl, mediaType } = await downscale(file);
      setPreview(dataUrl);
      const res = await api.post<{ result: ScanResult }>("/api/scan", {
        image: dataUrl,
        media_type: mediaType,
        hint: hint.trim() || undefined,
      });
      onScanned(res.result);
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo analizar la imagen"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Escanear alimento
          </DialogTitle>
          <DialogDescription>
            Toma una foto de la etiqueta nutricional o del plato. La IA estima
            los macros por 100 g.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="mx-auto max-h-48 rounded-md object-contain"
            />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="hint">Pista (opcional)</Label>
            <Input
              id="hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Ej. queso manchego curado"
              disabled={loading}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analizando con IA...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="h-20 flex-col"
              >
                <Camera className="h-6 w-6" />
                Cámara
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                className="h-20 flex-col"
              >
                <Upload className="h-6 w-6" />
                Galería
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
