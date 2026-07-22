import type { BackgroundToPopup, PopupToBackground } from '../../shared/reminders/types.ts';

export async function sendCommand(message: PopupToBackground): Promise<BackgroundToPopup> {
  return chrome.runtime.sendMessage(message);
}
