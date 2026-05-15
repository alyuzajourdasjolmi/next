// API Route: Subscribe to Push Notifications
// POST /api/push/subscribe
// Stores the push subscription in Supabase linked to a user_id and role.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, user_id, role } = body;

    if (!subscription || !user_id) {
      return Response.json({ error: 'Missing subscription or user_id' }, { status: 400 });
    }

    // Upsert: if same user_id + endpoint exists, update it; otherwise insert
    const endpoint = subscription.endpoint;

    // First check if this exact subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          subscription: subscription,
          role: role || 'user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id,
          endpoint,
          subscription: subscription,
          role: role || 'user',
        });

      if (error) throw error;
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
