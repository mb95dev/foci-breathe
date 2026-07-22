import type { BackgroundToContent } from '../shared/reminders/types.ts';
import {
  EXTENSION_BRIDGE_SOURCE,
  WEB_BRIDGE_SOURCE,
} from '../shared/reminders/types.ts';
import type { WebBridgeRequest, WebBridgeResponse } from '../shared/reminders/types.ts';
import { createVoiceEngine } from './voiceEngine.ts';

const voiceEngine = createVoiceEngine();
const ALLOWED_ORIGINS = [
  'https://mb95dev.github.io',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

chrome.runtime.onMessage.addListener((message: BackgroundToContent) => {
  if (message.type === 'SPEAK') {
    void voiceEngine.speak(message.text, message.volume).catch(() => undefined);
  }
});

window.addEventListener('message', event => {
  if (!isAllowedOrigin(event.origin)) return;

  const data = event.data as WebBridgeRequest | { source?: string };
  if (data?.source !== WEB_BRIDGE_SOURCE || !('requestId' in data) || !('payload' in data)) {
    return;
  }

  chrome.runtime.sendMessage(data.payload, response => {
    const bridgeResponse: WebBridgeResponse = {
      source: EXTENSION_BRIDGE_SOURCE,
      requestId: data.requestId,
      payload: (response ?? {
        type: 'ERROR',
        code: 'STORAGE_READ_ERROR',
        message: 'Extension did not respond.',
      }) as WebBridgeResponse['payload'],
    };
    window.postMessage(bridgeResponse, event.origin);
  });
});

window.postMessage(
  { source: EXTENSION_BRIDGE_SOURCE, type: 'EXTENSION_READY' },
  window.location.origin,
);

export {};
