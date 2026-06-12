# Requirements Document

## Introduction

FOCI Breathe is a web-based breathing trainer (React + TypeScript + Vite). The main session (Training) screen lets the user pick a breathing technique, choose a duration (1–20 minutes), and run a guided breathing session with an animated ball, phase indicator, cycle/BPM counters, and optional sound.

This increment improves three aspects of the session screen:

1. **Background/unfocused timer accuracy** — The session must keep accurate wall-clock time when the browser tab or window is backgrounded or unfocused, despite browser throttling of `setInterval`/`setTimeout`/`requestAnimationFrame`. Elapsed time, phase progression, and session completion must be derived from wall-clock timestamps, and the UI must resynchronize when focus returns.
2. **Sound lifecycle at session end** — All session audio must stop cleanly when the session completes, is stopped manually, or the session screen unmounts.
3. **Custom ticker sound upload** — The user can upload a custom audio file to use as the ticker (phase-transition) sound, preview it, persist it locally across reloads, and revert to the default built-in sound, with validation of file type and size.

## Requirements

### Requirement 1: Wall-clock based session timing

**User Story:** As a user running a breathing session, I want the session timer to be driven by real elapsed (wall-clock) time, so that the displayed time and progress are always accurate regardless of tab focus or rendering throttling.

#### Acceptance Criteria

1. WHEN a session is started THEN the system SHALL record a wall-clock start timestamp (e.g. `performance.now()` or `Date.now()`) as the authoritative time reference for the session.
2. WHEN the system computes elapsed session time THEN the system SHALL derive it from the difference between the current wall-clock timestamp and the session start timestamp (adjusted for any paused intervals), and SHALL NOT derive it by accumulating fixed tick increments.
3. WHEN the system determines the current breathing phase and phase progress THEN the system SHALL compute them deterministically from wall-clock elapsed time and the selected pattern's phase durations.
4. IF the session supports pausing THEN the system SHALL exclude paused intervals from the elapsed session time by tracking pause/resume timestamps.
5. WHEN elapsed time is computed at any point THEN the displayed timer, cycle counter, and phase state SHALL be consistent with one another (all derived from the same wall-clock elapsed value).

### Requirement 2: Accurate behavior while backgrounded and on focus return

**User Story:** As a user, I want my session to keep correct time when I switch tabs, minimize the window, or otherwise unfocus the app, so that the session ends at the right moment and the UI shows correct values when I come back.

#### Acceptance Criteria

1. WHILE the tab or window is backgrounded or unfocused THEN the system SHALL continue tracking session time accurately using wall-clock timestamps, even if timer callbacks are throttled or suspended by the browser.
2. WHEN the tab regains focus or visibility (e.g. via the `visibilitychange` or `focus` events) THEN the system SHALL immediately resynchronize the displayed elapsed time, breathing phase, phase progress, and cycle count to the correct wall-clock-derived values without jumps backward or frozen state.
3. WHEN the configured session duration elapses WHILE the tab is backgrounded THEN the system SHALL complete the session at (or as close as the browser allows to) the correct wall-clock time, and SHALL NOT extend the session beyond the configured duration.
4. IF browser throttling prevents the completion logic from running at the exact completion moment THEN the system SHALL detect the overdue completion on the next available callback or on focus return and SHALL finalize the session with the elapsed time clamped to the configured duration.
5. WHEN a session completes while the tab is backgrounded and the user later returns to the tab THEN the system SHALL display the completed session state (not a running or frozen session).

### Requirement 3: Session audio lifecycle

**User Story:** As a user, I want all session sounds to stop when the session ends, so that no audio keeps playing after the session is over.

#### Acceptance Criteria

1. WHEN the session reaches the configured duration and completes THEN the system SHALL stop all session audio, including phase/ticker sounds and any ongoing or scheduled tones.
2. WHEN the user manually stops or ends a session THEN the system SHALL stop all session audio immediately.
3. WHEN the session screen/component unmounts (e.g. navigation away) THEN the system SHALL stop all session audio and release or close any audio resources (e.g. `AudioContext`, audio element playback) so no sound continues afterwards.
4. IF audio events have been scheduled in advance (e.g. via Web Audio scheduling) WHEN the session ends THEN the system SHALL cancel all not-yet-played scheduled audio events.
5. WHEN the sound toggle is set to OFF during a running session THEN the system SHALL stop any currently playing session audio and SHALL NOT start new sounds while the toggle remains OFF.
6. WHEN a session completes while the tab is backgrounded THEN the system SHALL stop session audio at completion time (or as soon as the browser allows), consistent with Requirement 2.

### Requirement 4: Custom ticker sound upload and validation

**User Story:** As a user, I want to upload my own audio file to use as the ticker sound, so that I can personalize the session's phase-transition sound.

#### Acceptance Criteria

1. WHERE the session screen's sound settings are displayed THE system SHALL provide a control allowing the user to upload a custom ticker sound file.
2. WHEN the user selects a file for upload THEN the system SHALL accept common audio formats (at minimum MP3, WAV, and OGG) and SHALL reject files of other types with a clear, user-visible error message.
3. WHEN the user selects a file exceeding the size limit (a sensible limit, e.g. 1–5 MB) THEN the system SHALL reject the file and display a clear, user-visible error message stating the limit.
4. WHEN a selected file passes type and size validation but cannot be decoded as playable audio THEN the system SHALL reject the file with a clear, user-visible error message and SHALL keep the previously active ticker sound unchanged.
5. WHEN a custom ticker sound has been successfully uploaded THEN the system SHALL use it as the ticker sound for phase transitions in subsequent and currently running sessions (respecting the sound ON/OFF toggle).

### Requirement 5: Custom ticker sound preview, persistence, and revert

**User Story:** As a user, I want to preview my custom ticker sound, have my choice remembered across reloads, and be able to go back to the default sound, so that I stay in control of my sound configuration.

#### Acceptance Criteria

1. WHEN a custom ticker sound is uploaded or already configured THEN the system SHALL provide a preview control that plays the custom sound once on demand.
2. WHEN the user previews a sound WHILE a session is not running THEN the preview SHALL play without starting a session.
3. WHEN a custom ticker sound is successfully uploaded THEN the system SHALL persist the audio data and the user's ticker-sound choice locally (e.g. IndexedDB for the audio data, with the selection flag in IndexedDB or localStorage).
4. WHEN the application is reloaded and a persisted custom ticker sound exists THEN the system SHALL restore and use the custom ticker sound without requiring re-upload.
5. IF the persisted custom sound cannot be loaded or decoded on restore (e.g. corrupted or evicted storage) THEN the system SHALL fall back to the default built-in ticker sound and SHALL surface a non-blocking notice to the user.
6. WHERE a custom ticker sound is active THE system SHALL provide a control to revert to the default built-in ticker sound.
7. WHEN the user reverts to the default sound THEN the system SHALL use the default built-in ticker sound immediately, SHALL update the persisted selection, and SHOULD remove the stored custom audio data from local storage.
8. WHEN the user uploads a new custom sound while one already exists THEN the system SHALL replace the previous custom sound with the new one in both the active session configuration and persistent storage.

### Requirement 6: Non-functional requirements

**User Story:** As a user, I want these improvements to be reliable and unobtrusive, so that the session experience remains smooth.

#### Acceptance Criteria

1. WHEN the tab is focused and the session is running THEN the displayed timer SHALL be accurate within typical UI update granularity (no visible drift relative to wall-clock time over a 20-minute session).
2. WHEN focus returns after backgrounding THEN the UI resynchronization SHALL complete without requiring any user interaction.
3. WHEN custom sound upload, preview, persistence, or revert operations are performed THEN they SHALL NOT block or disrupt a running session's timing.
4. WHEN persisting the custom ticker sound THEN the system SHALL store all data locally on the device only and SHALL NOT transmit the audio file to any server.
5. WHEN storage quota is unavailable or a persistence write fails THEN the system SHALL still allow the custom sound to be used for the current session and SHALL inform the user that it could not be saved.
