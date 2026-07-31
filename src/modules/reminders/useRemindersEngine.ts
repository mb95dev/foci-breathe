import { useCallback, useEffect, useState } from 'react';
import type { PopupToBackground } from '../../../shared/reminders/types.ts';
import { createDefaultSettings } from '../../../shared/reminders/defaults.ts';
import {
  getRemindersEngine,
  type RemindersSnapshot,
} from './webRemindersEngine.ts';

const INITIAL: RemindersSnapshot = {
  ready: false,
  error: null,
  ttsAvailable: true,
  settings: createDefaultSettings(),
  session: { status: 'stopped', remainingMs: undefined },
};

export function useRemindersEngine() {
  const [snapshot, setSnapshot] = useState<RemindersSnapshot>(INITIAL);

  useEffect(() => {
    const engine = getRemindersEngine();
    return engine.subscribe(setSnapshot);
  }, []);

  const run = useCallback(async (message: PopupToBackground) => {
    await getRemindersEngine().dispatch(message);
  }, []);

  return {
    ready: snapshot.ready,
    session: snapshot.session,
    settings: snapshot.settings,
    error: snapshot.error,
    ttsAvailable: snapshot.ttsAvailable,
    run,
  };
}
