import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { BrowserWindow, screen } from 'electron';

export class ServerManager {
  private app = express();
  private server = http.createServer(this.app);
  private io = new Server(this.server);
  private commercialTimer: NodeJS.Timeout | null = null;

  constructor(private port: number = 3000) {
    this.setupServerRoutes();
    this.setupSocketEvents();
  }

  private setupServerRoutes(): void {
    this.app.use(express.static('public')); // Serves mobile player web pages
  }

  private setupSocketEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);

      socket.on('claimBingo', (data) => {
        // Broadcast bingo claim instantly back to host control panel
        this.io.emit('hostDisplayWinnerPopup', data);
      });
    });
  }

  public startCommercialInterval(intervalMinutes: number, imageUrl: string): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    this.commercialTimer = setInterval(() => {
      this.io.emit('showCommercialOverlay', { imageUrl });
    }, intervalMs);
  }

  public launchSecondaryDisplayWindow(url: string): BrowserWindow {
    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[0];

    const tvWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.size.width,
      height: externalDisplay.size.height,
      fullscreen: true,
      webPreferences: { nodeIntegration: true }
    });

    tvWindow.loadURL(url);
    return tvWindow;
  }

  public listen(callback: () => void): void {
    this.server.listen(this.port, callback);
  }
}
