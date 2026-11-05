import type {Item} from '@life-os/domain';import type {NotificationPreferences} from '@life-os/domain/notifications';
export const notificationsSupported=false;
export async function requestNotificationPermission():Promise<boolean>{return false;}
export async function syncNotifications(_items:Item[],_prefs:NotificationPreferences):Promise<void>{}
