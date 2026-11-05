import React from 'react';
import { CustomPattern, WinningPattern } from '../types';

export interface BingoCardSquare {
  id: string;
  songTitle: string;
  artist: string;
  album: string;
  displayValue: string;     // Display for title, artist, album, or scrambled
  isMarked: boolean;
  isFreeSpace: boolean;
}

export interface BingoCard {
  cardId: string;               // Unique card id
  grid: BingoCardSquare[][];    // Bingo card grid (5x5)
  markedGrid: boolean[][];      // Bingo card marked grid
}

//hi 
export interface CardStylePreferences {
  fontFamily: string;       // Font style
  fontSize: number;         // Font size
  fontColor: string;        // Font color
  backgroundColor: string;  // Background color
  markedColor: string;      // Color marker
  accentColor: string;      // Accent color
}

export type DisplayOption = 'song' | 'artist' | 'album';

export class BingoEngine {
  
  /**
   * Automatically calculates roof rounding to the nearest perfect square
   */
  public static calculateCardMatrixSize(requestedCount: number): { rowsCols: number; totalCards: number } {
    const sqrt = Math.sqrt(requestedCount);
    const rowsCols = Math.ceil(sqrt);
    const totalCards = rowsCols * rowsCols;
    return { rowsCols, totalCards };
  }

  public static generatePatternMask(pattern: WinningPattern, size: number = 5, customGrid?: boolean[][]): boolean[][] {
    let grid: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

    switch (pattern) {
      case 'vertical':    // Vertical pattern
        for (let r = 0; r < size; r++) grid[r][Math.floor(size / 2)] = true;
        break;
      case 'L':           // L pattern
        for (let r = 0; r < size; r++) grid[r][0] = true;
        for (let c = 0; c < size; c++) grid[size - 1][c] = true;
        break;
      case 'custom':      // Custom pattern chosen by host
        if (customGrid) return customGrid;
        break;
      case 'horizontal':  // Horizontal pattern
        for (let c = 0; c < size; c++) grid[Math.floor(size / 2)][c] = true;
        break;
      case 'diagonal':    // Diagonal pattern
        for (let i = 0; i < size; i++) {
          grid[i][i] = true;
          grid[i][size - 1 - i] = true;
        }
        break;
      case 'corners':     // Corner patterns
        grid[0][0] = true;
        grid[0][size - 1] = true;
        grid[size - 1][0] = true;
        grid[size - 1][size - 1] = true;
        break;
      case 'blackout':    // Full house pattern
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            grid[r][c] = true;
          }
        }
        break;
      case 'plus':        // + pattern
      case 'cross':       // X pattern
        for (let i = 0; i < size; i++) {
          grid[Math.floor(size / 2)][i] = true;
          grid[i][Math.floor(size / 2)] = true;
        }
        break;
    }
    return grid;
  }

  public static validateBingo(markedGrid: boolean[][], patternMask: boolean[][]): boolean {
    for (let r = 0; r < markedGrid.length; r++) {
      for (let c = 0; c < markedGrid[r].length; c++) {
        if (patternMask[r][c] && !markedGrid[r][c]) {
          return false; // Required pattern square is missing
        }
      }
    }
    return true;
  }

  // HOST PATTERN VERIFICATION
  // Primary checker used when a player claims bingo
  public static validateCardAgainstRoundPattern(
    markedGrid: boolean[][],
    selectedPattern: WinningPattern | 'standard_line',
    customMask?: boolean[][]
  ): { isWin: boolean; winningPattern: string } {
    const size = markedGrid.length;

    // If host allows any standard line (horizontal, vertical, diagonal)
    if (selectedPattern === 'standard_line') {
      const isLineWin = this.validateAnyStandardLine(markedGrid);
      return { isWin: isLineWin, winningPattern: 'standard_line' };
    }

    // If host selected horizontal, check if ANY horizontal row is completely filled
    if (selectedPattern === 'horizontal') {
      for (let r = 0; r < size; r++) {
        if (markedGrid[r].every(val => val)) {
          return {
            isWin: true, winningPattern: 'horizontal'
          };
        }
      }
      return {
        isWin: false, winningPattern: 'horizontal'
      };
    }

    // If host selected vertical, check if ANY vertical column is completely filled
    if (selectedPattern === 'vertical') {
      for (let c = 0; c < size; c++) {
        let fullCol = true;
        for (let r = 0; r < size; r++) {
          if (!markedGrid[r][c]) {
            fullCol = false;
            break;
          }
        }
        if (fullCol) {
          return {
            isWin: true, winningPattern: 'vertical'
          };
        }
      }
      return {
        isWin: false, winningPattern: 'vertical'
      };
    }

    // For fixed shape patterns (corners, L, blackout, plus, diagonal, custom)
    const mask = this.generatePatternMask(selectedPattern as WinningPattern, size, customMask);
    const isWin = this.validateBingo(markedGrid, mask);
    return {
      isWin, winningPattern: selectedPattern
    };
  }

  // Helper verifying if any single row, column or diagonal is filled
  public static validateAnyStandardLine(markedGrid: boolean[][]): boolean {
    const size = markedGrid.length;

    // Horizontal rows
    for (let r = 0; r < size; r++) {
      if (markedGrid[r].every(val => val))
        return true;
    }

    // Vertical columns
    for (let c = 0; c < size; c++) {
      let fullCol = true;
      for (let r = 0; r < size; r++) {
        if (!markedGrid[r][c]) {
          fullCol = false;
          break;
        }
      }
      if (fullCol)
        return true;
    }

    // Diagonal 1 (\)
    let diag1 = true;
    for (let i = 0; i < size; i++) {
      if (!markedGrid[i][i]) {
        diag1 = false;
        break;
      }
    }
    if (diag1)
      return true;

    // Diagonal 2 (/)
    let diag2 = true;
    for (let i = 0; i < size; i++) {
      if (!markedGrid[i][size - 1 - i]) {
        diag2 = false;
        break;
      }
    }
    if (diag2)
      return true;

    return false;
  }

  // CUSTOM PATTERN CREATOR
  // Creates an empty size x size grid for the custom pattern builder
  public static createEmptyCustomGrid(size: number = 5): boolean[][] {
    return Array(size).fill(false).map(() => Array(size).fill(false));
  }

  // Taps on a square: toggles true/false, a second tap resets it
  public static toggleCustomGridCell(grid: boolean[][], row: number, col: number): boolean[][] {
    const updated = grid.map(r => [...r]);
    if (row >= 0 && row < updated.length && col >= 0 && col < updated[row].length) {
      updated[row][col] = !updated[row][col];
    }
    return updated;
  }

  // CARD GENERATOR & DISPLAY OPTIONS
  // Resolves the display text based on host settings
  public static resolveSquareDisplayValue(
    item: {
      title: string; artist: string; album?: string
    },
    displayOption: DisplayOption
  ): string {
    switch (displayOption) {
      case 'artist':
        return item.artist && item.artist.trim() !== '' ? item.artist : item.title;
      case 'album':
        return item.album && item.album.trim() !== '' ? item.album : item.title;
      case 'song':
      default:
        return item.title;
    }
  }

  // Generates a unique 5x5 card for players with selected display options
  public static generateCard(
    cardId: string,
    songPool: Array<{ id: string; title: string; artist: string; album?: string }>,
    size: number = 5,
    displayOption: DisplayOption = 'song',
    scrambleOnPlayerSide: boolean = false
  ): BingoCard {
    const shuffled = [...songPool].sort(() => Math.random() - 0.5);
    const grid: BingoCardSquare[][] = [];
    const markedGrid: boolean[][] = [];
    const centerIndex = Math.floor(size / 2);

    let songIdx = 0;

    for (let r = 0; r < size; r++) {
      const rowSquares: BingoCardSquare[] = [];
      const rowMarked: boolean[] = [];

      for (let c = 0; c < size; c++) {
        const isFree = (size % 2 !== 0 && r === centerIndex && c === centerIndex);

        if (isFree) {
          rowSquares.push({
            id: 'FREE_SPACE',
            songTitle: 'FREE SPACE',
            artist: '',
            album: '',
            displayValue: '★ FREE ★',
            isMarked: true,
            isFreeSpace: true,
          });
          rowMarked.push(true);
        } else {
          const item = shuffled[songIdx % shuffled.length];
          songIdx++;

          const rawText = this.resolveSquareDisplayValue(item, displayOption);
          const finalDisplay = scrambleOnPlayerSide ? this.scrambleText(rawText) : rawText;

          rowSquares.push({
            id: item.id,
            songTitle: item.title,
            artist: item.artist,
            album: item.album || '',
            displayValue: finalDisplay,
            isMarked: false,
            isFreeSpace: false,
          });
          rowMarked.push(false);
        }
      }
      grid.push(rowSquares);
      markedGrid.push(rowMarked);
    }

    return { cardId, grid, markedGrid };
  }

  // Scrambles word characters for hint mode while preserving spaces
  public static scrambleText(text: string): string {
    return text
      .split(' ')
      .map(word => {
        const chars = word.split('');
        for (let i = chars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
      })
      .join(' ');
  }

  // Default theme style for low-light bar environments
  public static getDefaultStyle(): CardStylePreferences {
    return {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 15,
      fontColor: '#FFFFFF',
      backgroundColor: '#0F172A',
      markedColor: '#10B981',
      accentColor: '#F43F5E'
    };
  }

  // Converts the style configuration into a CSS style
  public static getGridContainerStyle(style: CardStylePreferences): React.CSSProperties {
    return {
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      color: style.fontColor,
      backgroundColor: style.backgroundColor
    };
  }

  // Returns cell-specific CSS styles for marked and unmarked squares
  public static getSquareStyle(isMarked: boolean, style: CardStylePreferences): React.CSSProperties {
    return {
      color: style.fontColor,
      backgroundColor: isMarked ? style.markedColor : 'transparent',
      borderColor: style.accentColor,
      fontSize: `${style.fontSize}px`
    };
  }
}