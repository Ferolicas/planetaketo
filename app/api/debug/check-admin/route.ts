import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth/session';

export async function GET() {
  try {
    // Check if admin user exists
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', 'admin@planetaketo.es')
      .single();

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
      });
    }

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: 'User not found',
      });
    }

    // Test password verification
    const testPassword = 'admin123';
    const isValid = await verifyPassword(testPassword, user.password);

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
      },
      passwordTest: {
        testPassword,
        isValid,
        storedHash: user.password,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    });
  }
}
