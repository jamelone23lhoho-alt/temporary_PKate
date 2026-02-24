import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin.from('exports').select('*').order('export_date', { ascending: false });

  if (search) {
    query = query.or(`order_code.ilike.%${search}%,client.ilike.%${search}%,remark.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();

  const { count } = await supabaseAdmin.from('exports').select('*', { count: 'exact', head: true });
  const nextNum = (count || 0) + 1;
  const orderCode = 'TL-' + String(nextNum).padStart(4, '0');

  const { data, error } = await supabaseAdmin.from('exports').insert({
    order_code: orderCode,
    client: body.client,
    export_date: body.export_date,
    mawb_no: body.mawb_no,
    item: body.item,
    sender: body.sender,
    sender_phone: body.sender_phone,
    recipient: body.recipient,
    recipient_phone: body.recipient_phone,
    remark: body.remark,
    total_boxs: body.total_boxs || 0,
    total_gw: body.total_gw || 0,
    bill_thb: body.bill_thb || 0,
    bill_mnt: body.bill_mnt || 0,
    payment: body.payment || 'No',
    box_type: body.box_type,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabaseAdmin.from('exports').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabaseAdmin.from('exports').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
