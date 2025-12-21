# Window State Machine

**Feature Name**: Window State Machine
**Feature Number**: 004
**Status**: Draft
**Created**: 2024-12-20

## Problem Statement

Currently, each window operates without tracking its save state. Users and the application cannot distinguish between:
- A newly created window with no file path
- A window with an opened file that has no unsaved changes
- A window with unsaved modifications

This leads to confusion about when to show save dialogs, when to prompt for unsaved changes before closing, and how to handle save operations for multiple windows.

## Clarifications

### Session 2024-12-21

- Q: Should opening a file ALWAYS set state to "saved", or should it consider whether the file content differs? → A: Opening a file ALWAYS sets state to "saved" regardless of file content. User edits then trigger "saved → edited".
- Q: What type of prompt should appear when closing a window with unsaved changes? → A: Use native Tauri dialog with Save/Discard/Cancel options.

## User Scenarios & Testing

### Scenario 1: New Window State
As a user, when I create a new window, it should be in the "created" state with no associated file path. The title should show "Untitled" or similar placeholder. When I try to save, the system should prompt me to choose a file location.

**Testing**:
- Verify new window shows "Untitled" title
- Verify first save triggers file dialog
- Verify state transitions to "saved" after successful save

### Scenario 2: Opening a File
As a user, when I open an existing file, the window should transition to "saved" state. The window title should display the filename. The save operation should use the existing file path without prompting.

**Testing**:
- Verify opened window shows filename in title
- Verify save uses existing path (no dialog)
- Verify state is "saved" after opening

### Scenario 3: Editing Changes
As a user, when I make changes to a saved drawing, the window should transition to "edited" state. The title should indicate unsaved changes (e.g., "filename *").

**Testing**:
- Verify changes trigger state transition to "edited"
- Verify title shows unsaved indicator
- Verify unsaved indicator clears after save

### Scenario 4: Saving Edited Window
As a user, when I save an edited window, it should transition back to "saved" state. The unsaved indicator should be removed from the title.

**Testing**:
- Verify save clears unsaved indicator
- Verify state transitions to "saved"
- Verify subsequent saves use same file path

### Scenario 5: Multiple Windows
As a user, when I have multiple windows open, each window should maintain its own independent state. Saving one window should not affect other windows.

**Testing**:
- Verify each window has independent state
- Verify save shortcuts affect only focused window
- Verify unsaved indicators are per-window

### Scenario 6: Close Window with Unsaved Changes
As a user, when I try to close a window with unsaved changes, the system should prompt me to save, discard, or cancel.

**Testing**:
- Verify close prompt appears for edited windows
- Verify prompt allows save, discard, or cancel
- Verify no prompt for saved windows

## Functional Requirements

### REQ-001: State Definition
The system shall define three distinct window states:
- **created**: Window has no associated file path (new or unsaved)
- **saved**: Window has a file path with no unsaved changes
- **edited**: Window has unsaved modifications since last save

**Acceptance Criteria**:
- Each window maintains its own state
- State is persisted for the window lifetime
- Initial state for new windows is "created"

### REQ-002: State Transitions
The system shall support the following state transitions:
- **created → edited**: User makes first change to canvas
- **created → saved**: User loads file content from disk (always, regardless of file content)
- **edited → saved**: User successfully saves to file
- **saved → edited**: User makes changes after saving

**Acceptance Criteria**:
- All defined transitions are supported
- No invalid transitions are allowed
- State change is immediate on trigger

### REQ-003: State Indication
The system shall provide visual indication of window state:
- **created**: Window title shows "Untitled" or equivalent
- **saved**: Window title shows filename without modification marker
- **edited**: Window title shows filename with modification marker (e.g., "*")

**Acceptance Criteria**:
- Title format matches requirements for each state
- Visual indicator is immediately visible
- Indicator updates within 1 second of state change

### REQ-004: Save Behavior by State
The save operation shall behave differently based on state:
- **created**: Show save dialog to select file path
- **saved**: Save to existing path silently
- **edited**: Save to existing path silently

**Acceptance Criteria**:
- Created state always triggers file dialog
- Saved/edited states use existing path
- Save confirmation is shown within 2 seconds

### REQ-005: Unsaved Change Detection
The system shall detect when user changes have been made to the canvas since last save.

**Acceptance Criteria**:
- Changes are detected within 1 second
- State transition occurs automatically on change
- False positives (non-modifying actions) do not trigger state change

### REQ-006: Window Close Handling
When user attempts to close a window in "edited" state, the system shall prompt for user action using a native Tauri dialog:
- **Save**: Save file and close
- **Discard**: Close without saving
- **Cancel**: Abort close operation

**Acceptance Criteria**:
- Prompt appears only for edited windows
- All three options are available via native dialog
- User selection is respected

### REQ-007: State Persistence per Window
Each window shall maintain independent state that does not affect other windows.

**Acceptance Criteria**:
- State is stored per window label/ID
- Operations on one window don't affect others
- Window disposal cleans up associated state

### REQ-008: State Query API
The system shall provide an API to query the current state of any window.

**Acceptance Criteria**:
- State can be retrieved synchronously
- State includes: current state, file path, last saved timestamp
- API is accessible to services that need it

## Success Criteria

### Quantitative Metrics
- **SC-001**: State transition completes within 100ms of trigger
- **SC-002**: Visual indicator (title update) visible within 1 second
- **SC-003**: Save dialog response time under 2 seconds
- **SC-004**: Unsaved change detection within 1 second of user action
- **SC-005**: Zero state corruption across 100+ window operations

### Qualitative Measures
- **SC-006**: Users can confidently identify which windows have unsaved changes
- **SC-007**: Users can predict save behavior based on current state
- **SC-008**: No confusion about file paths for each window
- **SC-009**: Close behavior is consistent and predictable

## Key Entities

### WindowState
| Property | Type | Description |
|----------|------|-------------|
| state | enum | One of: created, saved, edited |
| filePath | string \| null | Full path to saved file |
| lastSavedAt | timestamp | When last save occurred |
| hasUnsavedChanges | boolean | Convenience flag for edited state |

### WindowStateContext
| Property | Type | Description |
|----------|------|-------------|
| windowLabel | string | Unique identifier for the window |
| currentState | WindowState | Current state object |
| stateHistory | array | Previous states for undo support |

## Assumptions

1. **File paths are unique**: Each saved file has a unique path that can be used as identifier
2. **Window labels are stable**: Window labels (e.g., "main", "excalidraw-1") remain consistent during window lifetime
3. **State changes are single-threaded**: State transitions happen on the main thread to avoid race conditions
4. **Memory footprint is low**: State objects are small and won't cause memory issues with many windows
5. **No persistence across app restart**: State is in-memory only and reset when app closes
6. **Tauri event system is reliable**: Event-based state updates will reach all subscribers
7. **User expects immediate feedback**: State changes should be reflected visually within 1 second

## Dependencies

- Window management (existing)
- File save dialog (existing via tauri-plugin-dialog)
- Save command (existing)
- Open command (existing)

## Out of Scope

- Auto-save functionality
- Version history or revision tracking
- Cloud sync or collaboration features
- File conflict resolution
- Window state persistence across app restart

## Notes

The state machine design follows a simple pattern:
- State is a property of the window, not the drawing data
- Visual feedback (title) is the primary user indicator
- Save behavior adapts based on current state
- Close behavior protects against data loss

This approach minimizes complexity while providing clear user feedback and protecting against data loss.
