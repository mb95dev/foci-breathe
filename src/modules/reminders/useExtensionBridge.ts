import { useCallback, useEffect, useState } from 'react';
import type { BackgroundToPopup, PopupToBackground, ReminderSettings, SessionState } from '../../../shared/reminders/types.ts';
import {
  EXTENSION_BRIDGE_SOURCE,
  WEB_BRIDGE_SOURCE,
} from '../../../shared/reminders/types.ts';
import type { WebBridgeRequest, WebBridgeResponse } from '../../../shared/reminders/types.ts';
import { createDefaultSettings } from '../../../shared/reminders/defaults.ts';

function createRequestId(): string {
  return crypto.randomUUID();
}

export function useExtensionBridge() {
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<SessionState>({ status: 'stopped', remainingMs: undefined });
  const [settings, setSettings] = useState<ReminderSettings>(createDefaultSettings());
  const [error, setError] = useState<string | null>(null);

  const sendCommand = useCallback((payload: PopupToBackground) => {
    return new Promise<BackgroundToPopup>((resolve, reject) => {
      const requestId = createRequestId();

      const onMessage = (event: MessageEvent) => {
        const data = event.data as WebBridgeResponse | { source?: string; type?: string };
        if (data?.source === EXTENSION_BRIDGE_SOURCE && 'type' in data && data.type === 'EXTENSION_READY') {
          setConnected(true);
          return;
        }
        if (
          data?.source !== EXTENSION_BRIDGE_SOURCE
          || !('requestId' in data)
          || data.requestId !== requestId
        ) {
          return;
        }

        window.removeEventListener('message', onMessage);
        resolve(data.payload);
      };

      window.addEventListener('message', onMessage);

      const request: WebBridgeRequest = {
        source: WEB_BRIDGE_SOURCE,
        requestId,
        payload,
      };
      window.postMessage(request, window.location.origin);

      window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        reject(new Error('Extension not connected'));
      }, 3000);
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await sendCommand({ type: 'GET_STATE' });
      if (response.type === 'STATE_UPDATE') {
        setSession(response.session);
        setSettings(response.settings);
        setError(null);
        setConnected(true);
      } else {
        setError(response.message);
      }
    } catch {
      setConnected(false);
    }
  }, [sendCommand]);

  useEffect(() => {
    const onReady = (event: MessageEvent) => {
      if (event.data?.source === EXTENSION_BRIDGE_SOURCE && event.data.type === 'EXTENSION_READY') {
        setConnected(true);
        void refresh();
      }
    };
    window.addEventListener('message', onReady);
    void refresh();
    const timer = window.setInterval(() => {
      if (session.status === 'active') {
        void refresh();
      }
    }, 1000);
    return () => {
      window.removeEventListener('message', onReady);
      window.clearInterval(timer);
    };
  }, [refresh, session.status]);

  const run = useCallback(async (message: PopupToBackground) => {
    const response = await sendCommand(message);
    if (response.type === 'STATE_UPDATE') {
      setSession(response.session);
      setSettings(response.settings);
      setError(null);
      return;
    }
    setError(response.message);
  }, [sendCommand]);

  return { connected, session, settings, error, refresh, run };
}
