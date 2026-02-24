import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,client_code.ilike.%${search}%,contact_phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();

  const { count } = await supabaseAdmin.from('clients').select('*', { count: 'exact', head: true });
  const nextNum = (count || 0) + 1;
  const clientCode = 'CTL-' + String(nextNum).padStart(4, '0');

  const { data, error } = await supabaseAdmin.from('clients').insert({
    client_code: clientCode,
    name: body.name,
    nationality: body.nationality,
    gender: body.gender,
    contact_channel: body.contact_channel,
    contact_phone: body.contact_phone,
    supporter: body.supporter,
    remark: body.remark,
    id_card_image: body.id_card_image,
    profile_image: body.profile_image,
    sender_address: body.sender_address,
    sender_phone: body.sender_phone,
    sender_image: body.sender_image,
    recipient_address: body.recipient_address,
    recipient_phone: body.recipient_phone,
    recipient_image: body.recipient_image,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabaseAdmin.from('clients').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabaseAdmin.from('clients').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
