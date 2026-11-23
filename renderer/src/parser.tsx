interface ParsedSong {
    title: string;
    artist: string;
    path: string;
  }
  
  export function parseM3U(fileContent: string): ParsedSong[] {
    const lines = fileContent.split(/\r?\n/);
    const songs: ParsedSong[] = [];
  
    let currentArtist = "Unknown Artist";
    let currentTitle = "Unknown Title";
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
  
      if (line.startsWith("#EXTINF:")) {
        // format: Artist - Title
        const commaIndex = line.indexOf(",");
        if (commaIndex !== -1) {
          const meta = line.substring(commaIndex + 1).trim();
          const parts = meta.split(" - ");
          if (parts.length >= 2) {
            currentArtist = parts[0].trim();
            currentTitle = parts.slice(1).join(" - ").trim();
          } else {
            currentTitle = meta;
          }
        }
      } else if (line && !line.startsWith("#")) {
        // Path line reached, save the song object
        songs.push({
          title: currentTitle,
          artist: currentArtist,
          path: line,
        });
  
        // Reset for the next entry
        currentArtist = "Unknown Artist";
        currentTitle = "Unknown Title";
      }
    }
  
    return songs;
  }