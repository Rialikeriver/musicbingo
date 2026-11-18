import React, { useState, useRef, useEffect } from 'react';
import type { Track } from '../../host/index';
import { TrackCropperModal } from './TrackCropperModal';

export const CatalogManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [message, setMessage] = useState<string>('');
  const [cropError, setCropError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connected = Boolean(window.catalogApi);

  // Show the saved catalog when the screen opens
  useEffect(() => {
    if (!window.catalogApi) return;
    window.catalogApi.list()
      .then(saved => setTracks(saved))
      .catch(() => setMessage('Could not load the saved catalog.'));
  }, []);

  // Read the length of an audio or video file in the browser
  const getFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const element = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
      const url = URL.createObjectURL(file);
      element.src = url;
      element.onloadedmetadata = () => {
        resolve(Math.round(element.duration) || 0);
        URL.revokeObjectURL(url);
      };
      element.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(url);
      };
    });
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      /\.(mp3|mp4|wav|ogg|m4a)$/i.test(file.name)
    );

    if (!window.catalogApi) {
      setMessage('Not connected to the host, so these songs will not be saved.');
    }

    const added: Track[] = [];
    let duplicates = 0;
    let failed = 0;

    for (const file of validFiles) {
      try {
        const duration = await getFileDuration(file);
        const previewUrl = URL.createObjectURL(file); // Browser preview of this session
        // The full path on disk, from the host. Plain browser preview falls back to the file name.
        const filePath = window.catalogApi?.getFilePath(file) || file.name;

        if (window.catalogApi) {
          // The host reads the artist and title, gives the song a stable id, and saves it.
          // It returns null if this file is already in the catalog.
          const saved = await window.catalogApi.importFile(filePath, duration);
          if (saved) added.push({ ...saved, previewUrl });
          else duplicates += 1;
        } else {
          // Plain browser preview: nothing is saved
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
          added.push({
            id: `${Date.now()}-${Math.random()}`,
            title: cleanTitle,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            filePath,
            previewUrl,
            startTime: 0,
            endTime: duration || 30,
            duration: duration || 30,
          });
        }
      } catch {
        failed += 1;
      }
    }

    setTracks(prev => [...prev, ...added]);

    const parts: string[] = [];
    if (added.length) parts.push(`${added.length} added`);
    if (duplicates) parts.push(`${duplicates} already in the catalog`);
    if (failed) parts.push(`${failed} could not be read`);
    if (parts.length) setMessage(parts.join(', ') + '.');
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = ''; // allow choosing the same file again later
  };

  const handleSaveCrop = async (updatedTrack: Track) => {
    if (!window.catalogApi) {
      setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
      setEditingTrack(null);
      return;
    }

    try {
      const result = await window.catalogApi.updateCrop(
        updatedTrack.id, updatedTrack.startTime, updatedTrack.endTime
      );

      if (!result) {
        // The host rejected the crop (for example, end past the song length). Keep the old crop.
        setCropError('The host did not save this crop. Check the start and end times.');
        return;
      }

      setTracks(prev => prev.map(t =>
        t.id === updatedTrack.id ? { ...t, startTime: result.startTime, endTime: result.endTime } : t
      ));
      setCropError('');
      setEditingTrack(null);
    } catch {
      setCropError('Could not save the crop. Try again.');
    }
  };

  const removeTrack = async (id: string) => {
    try {
      if (window.catalogApi) {
        const removed = await window.catalogApi.remove(id);
        if (!removed) {
          setMessage('That song could not be removed from the saved catalog.');
          return;
        }
      }
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch {
      setMessage('That song could not be removed. Try again.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a"
        style={{ display: 'none' }}
      />

      {!connected && (
        <div className="panel" style={{ color: '#b45309' }}>
          Not connected to the host. Songs added here will not be saved.
        </div>
      )}

      {/* Drag & Drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{
          border: '2px dashed var(--border, #aaa)',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center',
          background: 'var(--panel, #fff)'
        }}
      >
        <p style={{ margin: '0 0 12px 0' }}>
          Drag & Drop MP3/MP4 files here, or browse files directly (hold Ctrl/Cmd to select multiple).
        </p>
        <button className="btn green" onClick={handleBrowseClick}>
          Browse Files
        </button>
      </div>

      {message && <div className="muted">{message}</div>}

      {/* Catalog List */}
      <div className="panel">
        <div className="panel-head" style={{ marginBottom: '8px' }}>
          <h2>Imported Catalog ({tracks.length} tracks)</h2>
        </div>

        {tracks.length === 0 ? (
          <p className="muted">No tracks added to catalog yet.</p>
        ) : (
          <ul className="song-list">
            {tracks.map((track) => (
              <li key={track.id} className="song-row">
                <div>
                  <div className="song-title">{track.title}</div>
                  <div className="song-meta">
                    {track.artist} | Crop: {track.startTime}s - {track.endTime}s | Total: {track.duration}s
                  </div>
                </div>
                <div className="move-btns">
                  <button
                    className="btn"
                    onClick={() => {
                      setCropError('');
                      setEditingTrack(track);
                    }}
                    style={{ fontSize: '12px', height: 'auto', width: 'auto', padding: '4px 8px' }}
                  >
                    Edit Crop
                  </button>
                  <button className="red" onClick={() => removeTrack(track.id)}>
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingTrack && (
        <TrackCropperModal
          track={editingTrack}
          onSave={handleSaveCrop}
          onClose={() => {
            setCropError('');
            setEditingTrack(null);
          }}
          error={cropError}
        />
      )}
    </div>
  );
};
