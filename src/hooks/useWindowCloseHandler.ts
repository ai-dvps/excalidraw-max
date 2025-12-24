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
 */
// Counter to track how many handlers are registered
let handlerCount = 0;

export function useWindowCloseHandler(): void {
  // Track if close is currently being processed
  const closeInProgress = useRef(false);
   // 1. Add a ref to track if we are forcing a close
  const ignoreCloseRequest = useRef(false);

  const handleClose = useCallback(async (event: any) => {
    // 2. CHECK THIS FIRST: If we decided to close, let it happen!
    if (ignoreCloseRequest.current) {
      console.log('[Close Handler] Force close flag active - allowing close');
      return; // Returns without calling preventDefault(), so the window closes.
    }

    // 3. NOW prevent default for normal user interactions
    event.preventDefault();

    // Prevent duplicate processing (user mashing the X button)
    if (closeInProgress.current) {
      console.log('[Close Handler] Logic already running - ignoring duplicate click');
      return;
    }

    closeInProgress.current = true;

    try {
      const win = getCurrentWindow();
      const windowLabel = (win as any).label || 'main';

      const currentState = await  stateService.getState(windowLabel);
      const hasUnsaved = currentState?.hasUnsavedChanges || false;

      if (!hasUnsaved) {
        console.log('[Close Handler] No unsaved changes, closing now');
        // 4. Set the VIP flag before closing
        ignoreCloseRequest.current = true;
        await win.close();
        return;
      }

      const filePath = currentState?.filePath || null;
      const fileName = filePath?.split('/').pop() || 'this drawing';

      const choice = await message(
        `Do you want to save changes to ${fileName} before closing?`,
        { title: 'Unsaved Changes', buttons: 'YesNoCancel' }
      );

      if (choice === 'Cancel') {
        closeInProgress.current = false;
        return;
      } else if (choice === 'Yes') {
        const { saveService } = await import('../services/saveService');
        const saved = await saveService.triggerSave(win.label);
        if (saved) {
          // 5. Save success -> Set VIP flag -> Close
          ignoreCloseRequest.current = true;
          await win.close();
        } else {
          closeInProgress.current = false;
        }
      } else if (choice === 'No') {
        // 6. User discarded -> Set VIP flag -> Close
        ignoreCloseRequest.current = true;
        await win.close();
      } else {
        closeInProgress.current = false;
      }
    } catch (error) {
      console.error('[Close Handler] Error:', error);
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
        console.log(`[Close Handler] Window label: ${windowLabel}`);

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
