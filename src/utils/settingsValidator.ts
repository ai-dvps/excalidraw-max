import { isUserSettings, isValidHexColor, UserSettings } from '../types/settings';

/**
 * Validates that a value is a valid UserSettings object.
 */
export function isValidSettings(value: unknown): value is UserSettings {
  return isUserSettings(value);
}

/**
 * Validates an EditorSettings object.
 */
export function isValidEditorSettings(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const settings = value as { defaultBackgroundColor?: unknown };
  return (
    typeof settings.defaultBackgroundColor === 'string' &&
    isValidHexColor(settings.defaultBackgroundColor)
  );
}

/**
 * Normalizes a hex color to 6-digit format.
 * Converts #fff to #ffffff.
 */
export function normalizeHexColor(color: string): string {
  const hex = color.replace(/^#/, '');
  if (hex.length === 3) {
    return '#' + hex.split('').map((c) => c + c).join('');
  }
  return '#' + hex;
}
