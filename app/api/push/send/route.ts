// API Route: Send Push Notification
// POST /api/push/send
// Sends push notifications to specific users or roles.

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

webpush.setVapidDetails(
  'mailto:admin.hijrahtoko@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target_user_id, target_role, title, message, url, tag } = body;

    if (!title || !message) {
      return Response.json({ error: 'Missing title or message' }, { status: 400 });
    }

    // Build query to find subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (target_user_id) {
      query = query.eq('user_id', target_user_id);
    } else if (target_role) {
      query = query.eq('role', target_role);
    } else {
      return Response.json({ error: 'Must specify target_user_id or target_role' }, { status: 400 });
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/assets/images/logo-hijrah-toko.png',
      url: url || '/',
      tag: tag || 'hijrah-toko-notification',
    });

    let sent = 0;
    const failedIds: number[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (pushError: any) {
        console.error(`Failed to send to subscription ${sub.id}:`, pushError.statusCode);
        // If subscription expired (410 Gone or 404), remove it
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          failedIds.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (failedIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', failedIds);
    }

    return Response.json({ success: true, sent, total: subscriptions.length, cleaned: failedIds.length });
  } catch (error: any) {
    console.error('Push send error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
