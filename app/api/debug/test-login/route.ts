import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const logs: any[] = [];

  try {
    const body = await request.json();
    logs.push({ step: 'Body received', body });

    const { email, password } = body;

    if (!email || !password) {
      logs.push({ step: 'Validation failed', email, password });
      return NextResponse.json({ logs, error: 'Missing fields' });
    }

    logs.push({ step: 'Searching user', email: email.toLowerCase() });

    // Find user
    const { data: user, error: dbError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    logs.push({
      step: 'Database query result',
      userFound: !!user,
      error: dbError?.message,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      hasPassword: !!user?.password,
    });

    if (dbError || !user) {
      return NextResponse.json({
        logs,
        success: false,
        reason: 'User not found',
        dbError: dbError?.message
      });
    }

    // Verify password
    logs.push({
      step: 'Verifying password',
      providedPassword: password,
      storedHash: user.password,
    });

    const isValid = await verifyPassword(password, user.password);

    logs.push({
      step: 'Password verification result',
      isValid
    });

    if (!isValid) {
      return NextResponse.json({
        logs,
        success: false,
        reason: 'Invalid password'
      });
    }

    logs.push({ step: 'Login successful' });

    return NextResponse.json({
      logs,
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error: any) {
    logs.push({ step: 'Exception', error: error.message, stack: error.stack });
    return NextResponse.json({
      logs,
      success: false,
      exception: error.message
    });
  }
}
