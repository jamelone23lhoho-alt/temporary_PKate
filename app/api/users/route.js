import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();

  const { count } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
  const nextNum = (count || 0) + 1;
  const userId = 'ST' + String(nextNum).padStart(3, '0');

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const { data, error } = await supabaseAdmin.from('users').insert({
    user_id: userId,
    username: body.username,
    password: hashedPassword,
    role: body.role,
    status: body.status || 'Active',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (updates.password && !updates.password.startsWith('$2a$')) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  const { data, error } = await supabaseAdmin.from('users').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
