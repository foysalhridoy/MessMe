/**
 * Web Notifications Helper for MessMe
 * Handles background notifications when user is in another tab, minimized, or screen locked.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (err) {
    console.warn('Notification permission request error:', err);
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function showSystemNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body || 'New message received',
      icon: options?.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: options?.tag || 'messme-chat',
      silent: false, // Let system play notification sound/vibrate
    });

    notification.onclick = () => {
      try {
        window.focus();
        if (options?.onClick) {
          options.onClick();
        }
        notification.close();
      } catch {
        // Ignore focus error
      }
    };
  } catch (err) {
    console.warn('Failed to display system notification:', err);
  }
}
