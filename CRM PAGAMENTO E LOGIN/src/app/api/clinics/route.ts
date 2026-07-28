import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: clinics, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar clínicas no Supabase:", error);
      return NextResponse.json({ success: false, data: [] });
    }
    
    return NextResponse.json({ success: true, data: clinics || [] });
  } catch (error) {
    console.error("Erro ao buscar clínicas:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
