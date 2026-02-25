import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const client = searchParams.get('client');

  let query = supabaseAdmin.from('exports').select('bill_thb,bill_mnt');
  if (from) query = query.gte('export_date', from);
  if (to) query = query.lte('export_date', to);
  if (client) query = query.eq('client', client);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalTHB = 0, totalMNT = 0;
  (data || []).forEach(r => {
    totalTHB += parseFloat(r.bill_thb) || 0;
    totalMNT += parseFloat(r.bill_mnt) || 0;
  });

  return NextResponse.json({ totalTHB, totalMNT });
}
