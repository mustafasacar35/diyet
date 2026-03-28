import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

// Initialize Supabase Admin Client (Lazy loaded via lib/supabase-admin)
// const supabaseAdmin = ... (Removed manual init)

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
        return NextResponse.json({ error: 'reportId required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('patient_ai_reports')
        .select('*')
        .eq('id', reportId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data });
}
