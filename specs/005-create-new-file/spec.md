# Feature Specification: Create New File

**Feature Branch**: `005-create-new-file`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "When user click on the "New File" menu item under File menu, or press Ctrl+N in windows or Command+N in mac. a new file will be created in a new tauri window. The user settings like editor settings will be applied to the new file."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Create New File via Menu (Priority: P1)

As a user, I want to create a new file by clicking "New File" in the File menu so that I can start a new drawing quickly.

**Why this priority**: This is the primary method for creating new files and is essential for user workflow.

**Independent Test**: Can be tested by clicking the menu item and verifying a new window opens with a blank canvas.

**Acceptance Scenarios**:

1. **Given** the application is open with at least one window, **When** the user clicks "New File" in the File menu, **Then** a new Tauri window opens with a blank Excalidraw canvas.

2. **Given** the application has no open windows, **When** the user clicks "New File" in the File menu, **Then** a new Tauri window opens with a blank Excalidraw canvas.

---

### User Story 2 - Create New File via Keyboard Shortcut (Priority: P1)

As a power user, I want to create a new file by pressing Ctrl+N (Windows) or Cmd+N (Mac) so that I can start a new drawing without using the mouse.

**Why this priority**: Keyboard shortcuts are essential for efficient workflow and power users expect this standard shortcut.

**Independent Test**: Can be tested by pressing the keyboard shortcut and verifying a new window opens.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** the user presses Ctrl+N (Windows) or Cmd+N (Mac), **Then** a new Tauri window opens with a blank Excalidraw canvas.

2. **Given** the application is running, **When** the user presses the shortcut while a text input is focused in the app, **Then** a new window still opens (shortcut takes priority).

---

### User Story 3 - Apply User Settings to New File (Priority: P2)

As a user with custom preferences, I want my editor settings (like background color) to be applied to new files so that my new drawings start with my preferred appearance.

**Why this priority**: Enhances user experience by respecting preferences, but new files work without this feature.

**Independent Test**: Can be tested by changing editor settings, creating a new file, and verifying the settings are applied.

**Acceptance Scenarios**:

1. **Given** the user has configured a custom default background color in settings, **When** the user creates a new file, **Then** the new canvas displays with the configured background color.

2. **Given** the user has not configured any custom settings, **When** the user creates a new file, **Then** the new canvas displays with default settings (white background).

---

### Edge Cases

- What happens when the user has many windows already open? (System should handle opening additional windows)
- What happens if settings fail to load when creating a new file? (Fall back to default settings)
- What happens during the brief moment before settings are loaded? (Blank or default canvas shown until settings are applied)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "New File" menu item under the File menu
- **FR-002**: System MUST respond to Ctrl+N (Windows/Linux) and Cmd+N (macOS) keyboard shortcuts
- **FR-003**: System MUST open a new Tauri WebviewWindow when creating a new file
- **FR-004**: System MUST initialize the new window with a blank Excalidraw canvas
- **FR-005**: System MUST read user settings (editor preferences) from persistent storage
- **FR-006**: System MUST apply user settings to the new canvas when it loads
- **FR-007**: System MUST handle cases where settings are unavailable by falling back to defaults
- **FR-008**: System MUST assign a unique window label to each new file window (e.g., "excalidraw-1", "excalidraw-2")

### Key Entities *(include if feature involves data)*

- **New File Request**: Represents the intent to create a new file, containing no initial data
- **User Settings**: Contains editor preferences including default background color and other visual settings
- **Window Label**: Unique identifier for each window instance, used for state tracking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new file from the File menu with a single click
- **SC-002**: New file creation via keyboard shortcut responds within 500ms of key press
- **SC-003**: 100% of new files open in a properly initialized window (no errors)
- **SC-004**: User settings are correctly applied to new files when settings are persisted
- **SC-005**: System handles creating at least 10 concurrent windows without performance degradation
