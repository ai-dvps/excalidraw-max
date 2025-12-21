/**
 * useWindowCloseHandler Hook
 *
 * Hook for handling window close events with unsaved changes confirmation.
 */

import { useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';
import { stateService } from '../services/stateService';

/**
 * Hook for handling window close with unsaved changes confirmation.
 *
 * Usage:
 * useWindowCloseHandler();
 *
 * This will automatically:
 * - Listen for window close events
 * - Check if there are unsaved changes
 * - Show confirmation dialog if needed
 */
export function useWindowCloseHandler(): void {
  // Track if we've already handled a close request
  const closeHandled = useRef(false);

  const handleClose = useCallback(async (event: any) => {
    // Prevent duplicate close handling
    if (closeHandled.current) {
      return;
    }

    try {
      // Get current window
      const win = getCurrentWindow();
      const windowLabel = (win as any).label || 'main';

      // Check if there are unsaved changes
      const hasUnsaved = await stateService.hasUnsavedChanges(windowLabel);

      if (!hasUnsaved) {
        // No unsaved changes, allow close
        closeHandled.current = true;
        return;
      }

      // Get file path for dialog message
      const filePath = await stateService.getFilePath(windowLabel);
      const fileName = filePath?.split('/').pop() || 'this drawing';

      // Show confirmation dialog with Yes/No/Cancel
      // Note: message() returns true for Yes/OK, false for No/Cancel
      const confirmed = await message(
        `Do you want to save changes to ${fileName} before closing?`,
        {
          title: 'Unsaved Changes',
        }
      );

      closeHandled.current = true;

      if (confirmed) {
        // User clicked Yes/Save
        event.preventDefault();
        const { saveService } = await import('../services/saveService');
        const saved = await saveService.triggerSave();
        if (saved) {
          await win.close();
        } else {
          closeHandled.current = false;
        }
      } else {
        // User clicked No/Cancel - close without saving
        // Allow default close to proceed
      }
    } catch (error) {
      console.error('Error handling window close:', error);
      // On error, prevent close to be safe
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupCloseHandler = async () => {
      try {
        const win = getCurrentWindow();
        unlisten = await win.onCloseRequested(handleClose);
      } catch (error) {
        console.error('Failed to set up close handler:', error);
      }
    };

    setupCloseHandler();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [handleClose]);
}

export default useWindowCloseHandler;
