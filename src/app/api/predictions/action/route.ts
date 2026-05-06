// src/app/api/predictions/action/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request) {
  try {
    const { itemId, field, value, userId } = await req.json();

    if (!itemId || !field || value === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify User Role (Must be Owner)
    // Using supabaseAdmin to securely read user role without relying on client claims
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('warehouse_users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userRecord || userRecord.role.toLowerCase() !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    // 2. Perform the update
    const updatePayload: any = {};
    updatePayload[field] = value;

    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('items')
      .update(updatePayload)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error: any) {
    console.error('[Action API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
