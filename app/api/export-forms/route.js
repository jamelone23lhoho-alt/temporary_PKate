import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const export_id = searchParams.get('export_id');

  let query = supabaseAdmin.from('export_forms').select('*').order('created_at', { ascending: false });
  if (export_id) query = query.eq('export_id', export_id);
  if (search) query = query.or(`order_code.ilike.%${search}%,client.ilike.%${search}%`);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('export_forms').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const body = await request.json();
  const { id, ...rest } = body;
  const { data, error } = await supabaseAdmin.from('export_forms').update(rest).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await supabaseAdmin.from('export_forms').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
