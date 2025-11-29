import { NextRequest, NextResponse } from 'next/server';
import { validateAndIncrementDownload } from '@/lib/downloads/magic-link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate and increment download count
    const result = await validateAndIncrementDownload(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('producto')
      .download('El Metodo keto Definitivo - Planeta Keto.pdf');

    if (error) {
      console.error('Download error:', error);
      return NextResponse.json(
        { error: 'Error al descargar el archivo' },
        { status: 500 }
      );
    }

    // Return the file
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="El Metodo keto Definitivo - Planeta Keto.pdf"',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la descarga' },
      { status: 500 }
    );
  }
}
