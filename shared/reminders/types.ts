export interface Prompt {
  readonly id: string;
  readonly text: string;
}

export interface ReminderSettings {
  readonly intervalMs: number;
  readonly volume: number;
  readonly prompts: readonly Prompt[];
}

export interface SessionState {
  readonly status: 'stopped' | 'active' | 'paused';
  readonly remainingMs: number | undefined;
}

export type ErrorCode =
  | 'TTS_UNAVAILABLE'
  | 'STORAGE_READ_ERROR'
  | 'STORAGE_WRITE_ERROR'
  | 'EMPTY_LIBRARY';

export type PopupToBackground =
  | { type: 'START_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'GET_STATE' }
  | { type: 'UPDATE_INTERVAL'; intervalMs: number }
  | { type: 'UPDATE_VOLUME'; volume: number }
  | { type: 'ADD_PROMPT'; text: string }
  | { type: 'DELETE_PROMPT'; id: string }
  | { type: 'EDIT_PROMPT'; id: string; text: string };

export type BackgroundToPopup =
  | { type: 'STATE_UPDATE'; session: SessionState; settings: ReminderSettings }
  | { type: 'ERROR'; code: ErrorCode; message: string };

export type BackgroundToContent =
  | { type: 'SPEAK'; text: string; volume: number };

export const WEB_BRIDGE_SOURCE = 'foci-breathe-web' as const;
export const EXTENSION_BRIDGE_SOURCE = 'foci-reminders-extension' as const;

export type WebBridgeRequest = {
  source: typeof WEB_BRIDGE_SOURCE;
  requestId: string;
  payload: PopupToBackground;
};

export type WebBridgeResponse = {
  source: typeof EXTENSION_BRIDGE_SOURCE;
  requestId: string;
  payload: BackgroundToPopup;
};
