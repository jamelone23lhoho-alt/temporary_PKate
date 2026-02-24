import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const { username, password } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('status', 'Active')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, data.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
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
}
