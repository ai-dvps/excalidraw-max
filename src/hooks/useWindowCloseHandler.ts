/**
 * useWindowCloseHandler Hook
 *
 * Hook for handling window close events with unsaved changes confirmation.
 */

import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';
import { windowStates } from './useWindowState';

/**
 * Hook for handling window close with unsaved changes confirmation.
 *
 * Usage:
 * useWindowCloseHandler();
 */
// Counter to track how many handlers are registered
let handlerCount = 0;

export function useWindowCloseHandler(): void {
  // Track if close is currently being processed
  const closeInProgress = useRef(false);

  const handleClose = useCallback(async (event: any) => {
    console.log('[Close Handler] ================= CLOSE REQUESTED =================');
    console.log('[Close Handler] Event type:', event?.constructor?.name);

    // Always prevent default first to block native close
    event.preventDefault();
    console.log('[Close Handler] Prevented default');

    // Prevent duplicate close handling
    if (closeInProgress.current) {
      console.log('[Close Handler] ALREADY IN PROGRESS, returning');
      return;
    }

    closeInProgress.current = true;
    console.log('[Close Handler] Started processing');

    try {
      // Get current window
      const win = getCurrentWindow();
      const windowLabel = (win as any).label || 'main';
      console.log(`[Close Handler] Window: ${windowLabel}`);

      // Get current state from frontend state (same store as useWindowState)
      const currentState = windowStates.get(windowLabel);
      console.log(`[Close Handler] Current state:`, currentState);

      const hasUnsaved = currentState?.hasUnsavedChanges || false;
      console.log(`[Close Handler] Has unsaved changes: ${hasUnsaved}`);

      if (!hasUnsaved) {
        // No unsaved changes, allow close
        console.log('[Close Handler] No unsaved changes, allowing close');
        closeInProgress.current = false;
        await win.close();
        return;
      }

      // Get file path for dialog message
      const filePath = currentState?.filePath || null;
      const fileName = filePath?.split('/').pop() || 'this drawing';

      console.log(`[Close Handler] Showing dialog for: ${fileName}`);

      // Show confirmation dialog with Yes/No/Cancel
      // Returns: 'Yes', 'No', or 'Cancel' (default labels)
      const choice = await message(
        `Do you want to save changes to ${fileName} before closing?`,
        {
          title: 'Unsaved Changes',
          buttons: 'YesNoCancel',
        }
      );

      console.log(`[Close Handler] User choice:`, choice);

      // Handle by return value
      if (choice === 'Cancel') {
        // User clicked Cancel
        console.log('[Close Handler] User clicked Cancel - keeping window open');
        closeInProgress.current = false;
        return;
      } else if (choice === 'Yes') {
        // User clicked Yes (Save)
        console.log('[Close Handler] User clicked Save - showing save dialog');
        const { saveService } = await import('../services/saveService');
        const saved = await saveService.triggerSave();
        if (saved) {
          console.log('[Close Handler] Save successful, closing window');
          closeInProgress.current = false;
          await win.close();
        } else {
          // Save failed, allow user to try again
          console.log('[Close Handler] Save failed or cancelled - keeping window open');
          closeInProgress.current = false;
        }
      } else if (choice === 'No') {
        // User clicked No (Discard)
        console.log('[Close Handler] User clicked Discard - closing without saving');
        closeInProgress.current = false;
        await win.close();
      } else {
        // Unknown choice
        console.log('[Close Handler] Unknown choice, keeping window open');
        closeInProgress.current = false;
      }
    } catch (error) {
      console.error('[Close Handler] Error:', error);
      // On error, keep window open
      closeInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupCloseHandler = async () => {
      try {
        handlerCount++;
        console.log(`[Close Handler] Setting up handler #${handlerCount}`);

        const win = getCurrentWindow();
        const windowLabel = (win as any).label || 'main';

        // Initialize state for this window if not exists (sync with useWindowState)
        if (!windowStates.has(windowLabel)) {
          windowStates.set(windowLabel, {
            state: 'created',
            filePath: null,
            lastSavedAt: null,
            hasUnsavedChanges: false,
          });
        }

        unlisten = await win.onCloseRequested(handleClose);
        console.log(`[Close Handler] Registered handler #${handlerCount} for window: ${windowLabel}`);
      } catch (error) {
        console.error('[Close Handler] Failed to set up close handler:', error);
      }
    };

    setupCloseHandler();

    return () => {
      if (unlisten) {
        unlisten();
        console.log('[Close Handler] Unregistered a handler');
      }
    };
  }, [handleClose]);
}

export default useWindowCloseHandler;
