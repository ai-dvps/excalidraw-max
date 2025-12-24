# Feature Specification: User Settings

**Feature Branch**: `[005-user-settings]`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "User can change his settings in the settings menu under the application menu or press the shortcut `Ctrl+,` in windows and `Cmd+,` in mac. The settings page is opened in a modal window. It is a two-column layout, the left column contains the settings categories and the right column contains the setting items for the selected category. The user can select a category by clicking on the category name in the left column. When the settings page is opened, the stored settings are loaded and the first category is selected by default. User can click on the save button to save the settings, or click on the cancel button to close the settings page without saving the changes. Settings are stored in the local file via the tauri store plugin, the document of plugin is here. The settings can be accessed in the application by using the `useSettings` hook, and the settings in the hook should be updated when the settings page is closed. The settings category currently supported are: General, Appearance, Shortcuts, Editor. In the future, more settings categories will be added. In the Editor category, the user can change: default background color of the Excalidraw canvas. More settings will be added in the future. For the UI components of the settings page, use the Ant Design library."

## Clarifications

### Session 2025-12-24

- Q: Cancel with unsaved changes - should show confirmation dialog? → A: Confirmation required - show dialog asking "Discard unsaved changes?" with Yes/No
- Q: What happens when settings file is corrupted or missing at startup? → A: Use defaults with notification - show toast/banner indicating settings were reset
- Q: Which color picker implementation to use for default background color? → A: Use Ant Design ColorPicker component - built-in integration, standard features
- Q: Settings persistence reliability - how to handle restoration with corrupted files? → A: 100% restoration for valid files, graceful fallback for corrupted files with notification
- Q: Should there be a warning when opening settings while a drawing is unsaved? → A: No warning needed - settings access is independent of drawings
- Q: Which notification implementation should be used? → A: Use Tauri notification plugin (https://v2.tauri.app/plugin/notification/)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access and Open Settings (Priority: P1)

As a user, I want to open the settings page so that I can configure application preferences.

**Why this priority**: Settings access is fundamental to user customization - without the ability to open settings, no other configuration can occur.

**Independent Test**: Can be fully tested by pressing the keyboard shortcut (Cmd+, / Ctrl+,) or navigating through the menu, verifying the settings modal opens with the correct layout.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** the user presses `Cmd+,` on macOS or `Ctrl+,` on Windows, **Then** the settings modal window is displayed.
2. **Given** the application is running, **When** the user clicks on "Settings" under the application menu, **Then** the settings modal window is displayed.
3. **Given** the settings modal is open, **When** the user presses `Escape` or clicks outside the modal, **Then** the modal closes without saving changes.

---

### User Story 2 - Navigate Settings Categories (Priority: P1)

As a user, I want to navigate between different settings categories so that I can find and modify specific settings.

**Why this priority**: The two-column navigation layout is the primary interaction pattern for settings - users must be able to switch between categories to access different configuration options.

**Independent Test**: Can be fully tested by opening settings, clicking each category in the left column, and verifying the right column updates with the corresponding setting items.

**Acceptance Scenarios**:

1. **Given** the settings modal is open with the "General" category selected, **When** the user clicks on "Appearance" in the left column, **Then** the right column displays Appearance settings and the "Appearance" category is visually highlighted.
2. **Given** the settings modal is open, **When** the modal first opens, **Then** the "General" category is automatically selected and its settings are displayed.
3. **Given** the settings modal is open with any category selected, **When** the user clicks on "Shortcuts" in the left column, **Then** the right column displays Shortcuts settings and the "Shortcuts" category becomes highlighted.

---

### User Story 3 - Save Settings (Priority: P1)

As a user, I want to save my settings changes so that my preferences persist across sessions.

**Why this priority**: Settings changes are only useful if they persist - this is the core value proposition of the settings feature.

**Independent Test**: Can be fully tested by opening settings, modifying a setting value, clicking Save, closing the modal, reopening settings, and verifying the modified value persists.

**Acceptance Scenarios**:

1. **Given** the settings modal is open with unsaved changes, **When** the user clicks the Save button, **Then** the settings are saved to storage, the modal closes, and the changes take effect immediately.
2. **Given** the settings modal is open with no changes made, **When** the user clicks the Save button, **Then** the modal closes and settings remain unchanged.
3. **Given** the user changes the default background color in Editor settings, **When** the user saves and closes the settings, **Then** new Excalidraw canvases open with the configured background color.

---

### User Story 4 - Cancel Settings Changes (Priority: P2)

As a user, I want to discard my settings changes so that I can revert unwanted modifications.

**Why this priority**: Users may accidentally change settings or change their mind - providing a safe way to cancel prevents frustration and accidental misconfiguration.

**Independent Test**: Can be fully tested by opening settings, modifying values, clicking Cancel, reopening settings, and verifying original values are still present.

**Acceptance Scenarios**:

1. **Given** the settings modal is open with unsaved changes, **When** the user clicks the Cancel button, **Then** a confirmation dialog appears asking "Discard unsaved changes?" with Yes/No options.
2. **Given** the confirmation dialog is shown, **When** the user clicks "Yes", **Then** the modal closes and no changes are saved; original settings remain in effect.
3. **Given** the confirmation dialog is shown, **When** the user clicks "No", **Then** the modal remains open with all changes intact.
4. **Given** the settings modal is open with no changes made, **When** the user clicks the Cancel button, **Then** the modal closes immediately.

---

### User Story 5 - Modify Editor Settings (Priority: P2)

As a user, I want to configure the default background color for Excalidraw canvases so that my drawings open with my preferred background.

**Why this priority**: This is the only Editor setting defined in scope - it directly affects the user's drawing experience and is explicitly required by the feature specification.

**Independent Test**: Can be fully tested by opening settings, navigating to Editor category, changing the background color, saving, creating a new canvas, and verifying the canvas uses the selected background color.

**Acceptance Scenarios**:

1. **Given** the settings modal is open with the Editor category selected, **When** the user changes the default background color, **Then** the preview shows the selected color.
2. **Given** the user has configured a default background color, **When** the user opens a new drawing, **Then** the canvas background uses the configured color.
3. **Given** the settings modal is open with the Editor category selected, **When** the user clicks on the color picker field, **Then** the Ant Design ColorPicker panel is displayed allowing color selection.

---

### Edge Cases

- **Settings file corrupted or missing at startup**: System loads default settings and displays a notification toast indicating settings were reset to defaults.
- **Concurrent settings modifications if multiple windows are open**: Last save wins; settings are stored per-user, not per-window.
- **Opening settings with unsaved drawing**: No warning needed; settings access is independent of drawings.
- **Very long setting values**: System truncates or validates input length based on setting type.
- **Conflicting shortcut configurations**: System validates and prevents duplicate shortcut assignments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a keyboard shortcut (`Cmd+,` on macOS, `Ctrl+,` on Windows) to open the settings modal.
- **FR-002**: System MUST provide a menu item under the application menu to open the settings modal.
- **FR-003**: System MUST display the settings page in a modal window that blocks interaction with the main application.
- **FR-004**: System MUST display the settings interface using a two-column layout with categories on the left and setting items on the right.
- **FR-005**: System MUST automatically select and highlight the "General" category when the settings modal first opens.
- **FR-006**: System MUST support the following settings categories: General, Appearance, Shortcuts, and Editor.
- **FR-007**: System MUST save settings to local storage via the Tauri store plugin when the user clicks the Save button.
- **FR-008**: System MUST discard all unsaved changes and close the modal when the user clicks the Cancel button.
- **FR-009**: System MUST load stored settings from local storage when the settings modal opens.
- **FR-010**: System MUST provide a `useSettings` hook that returns the current user settings.
- **FR-011**: System MUST update the `useSettings` hook values when the settings page is closed with saved changes.
- **FR-012**: System MUST allow users to change the default background color for Excalidraw canvases in the Editor category.
- **FR-013**: System MUST visually highlight the currently selected category in the left column.
- **FR-014**: System MUST use Ant Design UI components for the settings page interface.
- **FR-015**: System MUST load default settings and display a notification toast when the settings file is corrupted or missing at startup.

### Key Entities

- **UserSettings**: Contains all user-configurable preferences for the application.
  - `general`: General settings (reserved for future use)
  - `appearance`: Appearance settings (reserved for future use)
  - `shortcuts`: Keyboard shortcut configurations (reserved for future use)
  - `editor`: Editor-specific settings including default canvas background color

- **SettingsCategory**: Represents a category in the settings navigation.
  - `id`: Unique identifier for the category/
  - `name`: Display name shown in the left column
  - `icon`: Optional icon for visual identification
  - `settings`: List of setting items belonging to this category

- **EditorSettings**: Editor-specific configuration.
  - `defaultBackgroundColor`: Default hex color code for new canvas backgrounds

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the settings modal within 1 second of triggering the shortcut or menu action.
- **SC-002**: Settings changes persist correctly - 100% of saved settings are restored when the application is restarted. Corrupted or missing files gracefully fall back to defaults with user notification.
- **SC-003**: Users can navigate between all four categories (General, Appearance, Shortcuts, Editor) within the settings modal.
- **SC-004**: New Excalidraw canvases display the configured default background color with 100% accuracy after saving Editor settings.
- **SC-005**: Cancelling settings changes restores all values to their previous state - 100% of tests verify no unintended changes persist.
- **SC-006**: Users can complete the entire settings workflow (open, modify, save, close) in under 10 seconds.
