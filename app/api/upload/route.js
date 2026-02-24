import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
