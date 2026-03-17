import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data, error } = await supabaseAdmin.rpc('get_table_columns_by_name', { table_name_input: 'app_settings' });

        // If RPC fails, try just selecting from it
        if (error) {
            const { data: selectData, error: selectError } = await supabaseAdmin.from('app_settings').select('*').limit(1);
            return NextResponse.json({ error: error.message, selectData, selectError });
        }

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
