// Placeholder data so the UI can be built before the backend exists.
// Later this comes from the catalog import and Socket.io.

export interface Song {
  id: string;
  artist: string;
  title: string;
  startTime: string; // "mm:ss" for display only, for now
  duration: string;
}

export const rounds = ["2010's Bingo 1", "2010's Bingo 2", "2000's Bingo 1", "80's Bingo"];

export const songs: Song[] = [
  { id: '1', artist: 'Clean Bandit ft Anne-Marie & Sean Paul', title: 'Rockabye', startTime: '00:38', duration: '04:11' },
  { id: '2', artist: 'Maroon 5 ft Christina Aguilera', title: 'Moves Like Jagger', startTime: '00:12', duration: '03:21' },
  { id: '3', artist: 'Post Malone ft 21 Savage', title: 'Rockstar', startTime: '00:20', duration: '03:38' },
  { id: '4', artist: 'Jason Derulo ft Nicki Minaj & Ty Dolla $ign', title: 'Swalla', startTime: '00:10', duration: '03:36' },
  { id: '5', artist: 'Ed Sheeran', title: 'Shape of You', startTime: '00:05', duration: '03:53' },
  { id: '6', artist: 'Pharrell Williams', title: 'Happy', startTime: '00:15', duration: '03:53' },
  { id: '7', artist: 'Mark Ronson ft Bruno Mars', title: 'Uptown Funk', startTime: '00:25', duration: '04:30' },
  { id: '8', artist: 'Katy Perry', title: 'Roar', startTime: '00:18', duration: '03:43' },
  { id: '9', artist: 'Lorde', title: 'Royals', startTime: '00:09', duration: '03:10' },
  { id: '10', artist: 'OneRepublic', title: 'Counting Stars', startTime: '00:14', duration: '04:17' },
  { id: '11', artist: 'Justin Bieber', title: 'Sorry', startTime: '00:08', duration: '03:20' },
  { id: '12', artist: 'Adele', title: 'Hello', startTime: '00:30', duration: '04:55' },
  { id: '13', artist: 'Luis Fonsi ft Daddy Yankee', title: 'Despacito', startTime: '00:22', duration: '03:47' },
  { id: '14', artist: 'Imagine Dragons', title: 'Thunder', startTime: '00:06', duration: '03:07' },
  { id: '15', artist: 'Imagine Dragons', title: 'Believer', startTime: '00:04', duration: '03:24' },
  { id: '16', artist: 'Camila Cabello ft Young Thug', title: 'Havana', startTime: '00:11', duration: '03:37' },
  { id: '17', artist: 'Ed Sheeran', title: 'Perfect', startTime: '00:16', duration: '04:23' },
  { id: '18', artist: 'Zedd & Alessia Cara', title: 'Stay', startTime: '00:07', duration: '03:30' },
  { id: '19', artist: 'Dua Lipa', title: 'Levitating', startTime: '00:13', duration: '03:23' },
  { id: '20', artist: 'The Weeknd', title: 'Blinding Lights', startTime: '00:20', duration: '03:20' },
  { id: '21', artist: 'Billie Eilish', title: 'Bad Guy', startTime: '00:03', duration: '03:14' },
  { id: '22', artist: 'Shawn Mendes & Camila Cabello', title: 'Senorita', startTime: '00:09', duration: '03:11' },
  { id: '23', artist: 'AnnenMayKantereit & Giant Rooks', title: 'Toms Diner', startTime: '00:12', duration: '04:30' },
  { id: '24', artist: 'Lady Gaga & Bradley Cooper', title: 'Shallow', startTime: '00:40', duration: '03:36' },
  { id: '25', artist: 'Taylor Swift', title: 'Shake It Off', startTime: '00:08', duration: '03:39' },
  { id: '26', artist: 'Bruno Mars', title: '24K Magic', startTime: '00:10', duration: '03:46' },
];
