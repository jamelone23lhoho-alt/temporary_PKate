import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get('type') || 'Month';
  const filterDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const target = new Date(filterDate);
  let startDate, endDate;

  if (filterType === 'Day') {
    startDate = filterDate;
    endDate = filterDate;
  } else if (filterType === 'Month') {
    startDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    endDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  } else {
    startDate = `${target.getFullYear()}-01-01`;
    endDate = `${target.getFullYear()}-12-31`;
  }

  const { data, error } = await supabaseAdmin
    .from('exports')
    .select('bill_thb, bill_mnt')
    .gte('export_date', startDate)
    .lte('export_date', endDate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalTHB = 0, totalMNT = 0;
  (data || []).forEach(row => {
    totalTHB += parseFloat(row.bill_thb) || 0;
    totalMNT += parseFloat(row.bill_mnt) || 0;
  });

  return NextResponse.json({ totalTHB, totalMNT });
}
