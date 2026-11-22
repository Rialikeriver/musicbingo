import { screen } from 'electron';
import type { Display } from 'electron';
import type { DisplayInfo } from './index';

// All connected screens, in a simple form the Control Panel can show
export function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, index) => ({
    id: d.id,
    label: `Screen ${index + 1} – ${d.size.width} × ${d.size.height}` + (d.id === primaryId ? ' (this laptop)' : ''),
    isPrimary: d.id === primaryId
  }));
}

// Which screen the TV window should use:
// 1. the screen the host chose, if it is still connected
// 2. otherwise the first screen that is not the laptop
// 3. otherwise the laptop itself
export function chooseAudienceDisplay(chosenId: number | null): { display: Display; isExternal: boolean } {
  const primary = screen.getPrimaryDisplay();
  const all = screen.getAllDisplays();
  const chosen = chosenId === null ? undefined : all.find(d => d.id === chosenId);
  const display = chosen ?? all.find(d => d.id !== primary.id) ?? primary;
  return { display, isExternal: display.id !== primary.id };
}