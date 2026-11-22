// Helpers for showing files from the app's media folder (used by the Control Panel and the TV screen)

// Just the file name from a full path, or "Not chosen"
export function fileName(filePath: string | null): string {
  if (!filePath) return 'Not chosen';
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

// The safe address a screen uses to show a file from the media folder
export function mediaUrl(filePath: string): string {
  return `media://files/${encodeURIComponent(fileName(filePath))}`;
}