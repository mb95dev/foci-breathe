# Requirements Document

## Introduction

The Mindfulness Reminders feature adds a background reminder system to the FOCI application that periodically prompts the user to pause and notice their present-moment experience. At each configured interval, the application plays an audio voice prompt chosen from a user-defined library of mindfulness questions (e.g., "What do you see?", "What are you hearing?", "What are you feeling?"). The user can configure the reminder interval and fully customize the set of prompts. To maximize device coverage, the feature is delivered as a Chrome extension so it runs across any website the user is visiting.

---

## Glossary

- **Reminder**: A scheduled audio event that plays a voice prompt at a configured interval.
- **Prompt**: A short mindfulness question spoken aloud by the audio engine (e.g., "What do you see?").
- **Prompt Library**: The user-managed collection of prompts available for playback.
- **Interval**: The time between successive Reminders, configurable by the user.
- **Reminder Session**: A period during which the Reminder system is active and delivering Reminders at the configured Interval.
- **Voice Engine**: The component responsible for converting a Prompt text into speech and playing the audio output.
- **Extension**: The Chrome browser extension that hosts the Mindfulness Reminders feature.
- **Popup**: The Extension's browser-action popup UI used to configure and control a Reminder Session.
- **Background Service**: The Extension's persistent background script that manages Reminder scheduling.
- **Scheduler**: The component within the Background Service that tracks time and fires Reminder events.
- **Settings Store**: The persistent storage component (Chrome storage API) that saves and loads user configuration.

---

## Requirements

### Requirement 1: Schedule and Deliver Audio Reminders

**User Story:** As a mindfulness practitioner, I want the application to play an audio reminder at regular intervals throughout the day, so that I am consistently nudged to pause and check in with my present-moment experience.

#### Acceptance Criteria

1. WHEN a Reminder Session is started, THE Scheduler SHALL begin counting down from the configured Interval.
2. WHEN the Interval elapses during an active Reminder Session, THE Voice Engine SHALL play one Prompt selected from the Prompt Library.
3. WHILE a Reminder Session is active, THE Scheduler SHALL continue scheduling successive Reminders at the configured Interval after each Prompt finishes playing.
4. WHEN a Reminder Session is stopped, THE Scheduler SHALL cancel all pending Reminder events.
5. IF the Prompt Library is empty when a Reminder is due, THEN THE Background Service SHALL skip playback and log a warning, then schedule the next Reminder at the configured Interval.

---

### Requirement 2: Configurable Reminder Interval

**User Story:** As a user with a variable schedule, I want to set how often reminders occur, so that the reminder frequency fits my focus level and daily rhythm.

#### Acceptance Criteria

1. THE Settings Store SHALL persist the Interval value across browser restarts and extension reloads.
2. WHEN the user sets the Interval in the Popup, THE Scheduler SHALL apply the new Interval starting from the next scheduled Reminder.
3. THE Popup SHALL allow the user to select an Interval from a set of preset values: 5 minutes, 10 minutes, 15 minutes, 30 minutes, 1 hour, and 2 hours.
4. WHERE the user enables custom interval input, THE Popup SHALL accept any whole-number Interval value between 1 minute and 480 minutes inclusive.
5. IF the user enters an Interval value outside the range of 1 to 480 minutes, THEN THE Popup SHALL display a validation error message and reject the value.

---

### Requirement 3: Customizable Prompt Library

**User Story:** As a user, I want to create, edit, and remove my own mindfulness prompts, so that the reminders reflect the aspects of mindful awareness that matter most to me.

#### Acceptance Criteria

1. THE Settings Store SHALL persist the Prompt Library across browser restarts and extension reloads.
2. WHEN the user adds a new Prompt text in the Popup, THE Settings Store SHALL append the new Prompt to the Prompt Library.
3. WHEN the user deletes a Prompt from the Popup, THE Settings Store SHALL remove that Prompt from the Prompt Library.
4. WHEN the user edits an existing Prompt in the Popup, THE Settings Store SHALL replace the original Prompt text with the updated text.
5. IF the user attempts to save a Prompt with empty or whitespace-only text, THEN THE Popup SHALL display a validation error and reject the save.
6. THE Extension SHALL ship with a default Prompt Library containing at least the following prompts: "What do you see?", "What do you hear?", "What do you feel?", "What do you smell?", "What do you notice in your body right now?".
7. THE Settings Store SHALL support a Prompt Library of up to 100 Prompts.

---

### Requirement 4: Prompt Selection Strategy

**User Story:** As a user, I want the prompts to feel varied and non-repetitive, so that reminders stay engaging over many sessions.

#### Acceptance Criteria

1. WHEN selecting a Prompt to play, THE Scheduler SHALL choose a Prompt from the Prompt Library at random.
2. WHILE the Prompt Library contains more than one Prompt, THE Scheduler SHALL avoid playing the same Prompt twice in succession.
3. WHEN all Prompts in the Prompt Library have been played once in a cycle, THE Scheduler SHALL begin a new cycle, reshuffling the play order.

---

### Requirement 5: Reminder Session Controls

**User Story:** As a user, I want to start, pause, and stop my reminder session from the extension popup, so that I can manage mindfulness reminders around meetings or focused work.

#### Acceptance Criteria

1. THE Popup SHALL display controls to start, pause, resume, and stop the active Reminder Session.
2. WHEN the user starts a Reminder Session, THE Background Service SHALL activate the Scheduler.
3. WHEN the user pauses a Reminder Session, THE Scheduler SHALL suspend the current countdown without resetting it.
4. WHEN the user resumes a paused Reminder Session, THE Scheduler SHALL continue the countdown from where it was suspended.
5. WHEN the user stops a Reminder Session, THE Scheduler SHALL reset the countdown and transition the session to the stopped state.
6. THE Popup SHALL display the current session state (stopped, active, or paused) at all times.
7. THE Popup SHALL display the time remaining until the next Reminder when the session is in the active state.

---

### Requirement 6: Audio Playback via Voice Engine

**User Story:** As a user, I want the reminders to be spoken aloud clearly, so that I can receive the prompt without looking at the screen.

#### Acceptance Criteria

1. WHEN a Reminder is triggered, THE Voice Engine SHALL convert the selected Prompt text to speech using the browser's Web Speech API.
2. THE Voice Engine SHALL play audio through the device's default audio output.
3. WHERE the user has configured a playback volume, THE Voice Engine SHALL apply that volume level (0–100%) to each Prompt playback.
4. IF the Web Speech API is unavailable in the current browser environment, THEN THE Extension SHALL display a clear error message in the Popup informing the user that audio reminders are not supported.
5. WHEN a Reminder is playing, THE Voice Engine SHALL complete the current Prompt before the Scheduler begins counting down the next Interval.

---

### Requirement 7: Settings Persistence

**User Story:** As a user, I want my interval and prompt preferences to be saved automatically, so that I do not have to reconfigure the extension after closing and reopening the browser.

#### Acceptance Criteria

1. THE Settings Store SHALL save all user configuration (Interval, Prompt Library, volume) using the Chrome `storage.sync` API so that settings are available across devices signed into the same Chrome profile.
2. WHEN the Extension is loaded for the first time, THE Settings Store SHALL initialize the configuration with default values: Interval = 30 minutes, volume = 80%, and the default Prompt Library defined in Requirement 3.
3. WHEN the Settings Store fails to read from Chrome storage, THE Extension SHALL fall back to the default configuration values and display a non-blocking warning in the Popup.
4. WHEN the Settings Store fails to write to Chrome storage, THE Popup SHALL display an error message informing the user that the setting could not be saved.

---

### Requirement 8: Chrome Extension Packaging

**User Story:** As a user, I want the mindfulness reminders to work across any website I visit, so that I don't need a dedicated app window open to receive reminders.

#### Acceptance Criteria

1. THE Extension SHALL be packaged as a Manifest V3 Chrome extension.
2. THE Background Service SHALL run as a Manifest V3 service worker so that it can schedule reminders independently of any open tab.
3. THE Extension SHALL request only the minimum required permissions: `storage`, `alarms`, and `tts`.
4. WHEN the Chrome `alarms` API fires a scheduled alarm, THE Background Service SHALL trigger the Voice Engine to play the next Prompt.
5. THE Extension SHALL provide a browser-action icon that opens the Popup when clicked.
6. IF the Extension is updated while a Reminder Session is active, THEN THE Background Service SHALL restore the session state from the Settings Store on restart and resume the Reminder Session.
