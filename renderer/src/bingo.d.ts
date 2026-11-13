// Tells TypeScript what window.bingo (from host/preload.ts) looks like.
// It only exists inside the Electron app, not in a normal browser, so it is optional (?).
import type { ControlPanelSettings, MediaSettingKey } from '../../host/index';

declare global {
  interface Window {
    bingo?: {
      sendToAudience: (text: string) => void;
      onAudienceText: (callback: (text: string) => void) => void;
      getSettings: () => Promise<ControlPanelSettings>;
      chooseFile: (key: MediaSettingKey) => Promise<ControlPanelSettings>;
      addBanners: () => Promise<ControlPanelSettings>;
      removeBanner: (bannerPath: string) => Promise<ControlPanelSettings>;
    };
  }
}

export {};