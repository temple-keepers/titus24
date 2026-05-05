/**
 * Web Push subscription helpers. The public VAPID key is safe to bake
 * into the client; the matching private key lives only as a Supabase
 * Edge Function secret (VAPID_PRIVATE_KEY) and is used by the
 * dispatch-push function to sign push payloads.
 */
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY =
  'BCHjn6q647ClWVQh7dD7mR_Y7_KMtLEqbsxUXEKMvOCFADpfqTz-mdzGyRjz6WEOVdLhsBOPoGLOp17idxSONpk';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const standard = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(standard);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}

export async function enablePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) {
    return { ok: false, reason: 'Your browser does not support push notifications.' };
  }
  let permission = Notification.permission;
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'Permission was denied. You can re-enable in your browser settings.' };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? null,
      auth: json.keys?.auth ?? null,
      user_agent: navigator.userAgent.slice(0, 500),
    },
    { onConflict: 'endpoint' }
  );
  if (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  // Drop the row first so the server stops trying.
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
