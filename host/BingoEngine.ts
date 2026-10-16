import { CustomPattern, WinningPattern } from '../types';

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
      data_horizontal:
        for (let c = 0; c < size; c++) grid[Math.floor(size / 2)][c] = true;
        break;
      case 'vertical':
        for (let r = 0; r < size; r++) grid[r][Math.floor(size / 2)] = true;
        break;
      case 'L':
        for (let r = 0; r < size; r++) grid[r][0] = true;
        for (let c = 0; c < size; c++) grid[size - 1][c] = true;
        break;
      case 'custom':
        if (customGrid) return customGrid;
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
}
