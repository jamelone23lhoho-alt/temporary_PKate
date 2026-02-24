import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('status', 'Active')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found', debug: { hasUrl, hasKey, dbError: error?.message || null } }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, data.password);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong password', debug: { passwordStart: data.password?.substring(0, 7) } }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        user_id: data.user_id,
        username: data.username,
        role: data.role,
        status: data.status,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error', debug: err.message }, { status: 500 });
  }
}
