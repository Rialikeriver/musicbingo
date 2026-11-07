import React, { useState, useRef, useEffect } from 'react';
import type { Track } from '../../host/index';
import { TrackCropperModal } from './TrackCropperModal';

export const CatalogManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show the saved catalog when the screen opens (only inside the Electron app)
  useEffect(() => {
    window.catalogApi?.list().then(saved => setTracks(saved));
  }, []);

  // Read video/audio duration via an in-memory browser element
  const getFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const element = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
      element.src = URL.createObjectURL(file);
      element.onloadedmetadata = () => {
        resolve(Math.round(element.duration) || 0);
        URL.revokeObjectURL(element.src);
      };
      element.onerror = () => resolve(0);
    });
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      /\.(mp3|mp4|wav|ogg|m4a)$/i.test(file.name)
    );

    const added: Track[] = [];
    for (const file of validFiles) {
      const duration = await getFileDuration(file);
      const previewUrl = URL.createObjectURL(file); // Browser-safe blob URL for playback
      const filePath = (file as any).path || file.name;

      if (window.catalogApi) {
        // Inside Electron: the host reads the artist and title, gives the song a stable id,
        // and saves it. Returns null if this file is already in the catalog.
        const saved = await window.catalogApi.importFile(filePath, duration);
        if (saved) added.push({ ...saved, previewUrl });
      } else {
        // Plain browser preview (no host): keep the old behaviour
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
    }

    setTracks(prev => [...prev, ...added]);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const handleSaveCrop = async (updatedTrack: Track) => {
    let saved = updatedTrack;
    if (window.catalogApi) {
      // Save the new crop to the host so it survives a restart
      const result = await window.catalogApi.updateCrop(
        updatedTrack.id, updatedTrack.startTime, updatedTrack.endTime
      );
      if (result) saved = { ...updatedTrack, startTime: result.startTime, endTime: result.endTime };
    }
    setTracks(prev => prev.map(t => t.id === saved.id ? saved : t));
    setEditingTrack(null);
  };

  const removeTrack = async (id: string) => {
    if (window.catalogApi) {
      await window.catalogApi.remove(id);
    }
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hidden input supporting multi-file selection via Ctrl+S or multi-select */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a"
        style={{ display: 'none' }}
      />

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
                    onClick={() => setEditingTrack(track)}
                    style={{ fontSize: '12px', height: 'auto', width: 'auto', padding: '4px 8px' }}
                  >
                    Edit Crop
                  </button>
                  <button
                    className="red"
                    onClick={() => removeTrack(track.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cropper Modal */}
      {editingTrack && (
        <TrackCropperModal
          track={editingTrack}
          onSave={handleSaveCrop}
          onClose={() => setEditingTrack(null)}
        />
      )}
    </div>
  );
};
