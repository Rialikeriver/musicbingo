import React, { useState, useRef, useEffect } from 'react';
import type { Track } from '../../../host/index';

interface TrackCropperModalProps {
  track: Track;
  onSave: (updatedTrack: Track) => void;
  onClose: () => void;
}

export const TrackCropperModal: React.FC<TrackCropperModalProps> = ({ track, onSave, onClose }) => {
  const [startTime, setStartTime] = useState<number>(track.startTime || 0);
  const [endTime, setEndTime] = useState<number>(track.endTime || track.duration || 30);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const trackBarRef = useRef<HTMLDivElement>(null);
  const isDraggingStart = useRef(false);
  const isDraggingEnd = useRef(false);
  
  // Track whether audio was playing before drag started so we can resume it on release
  const wasPlayingBeforeDrag = useRef(false);

  const isVideo = track.filePath.toLowerCase().endsWith('.mp4');
  const mediaSrc = track.previewUrl || `file://${track.filePath}`;

  useEffect(() => {
    console.log("Playing media from source:", mediaSrc);
  }, [mediaSrc]);

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      if (mediaRef.current.currentTime >= endTime) {
        mediaRef.current.pause();
        mediaRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      if (mediaRef.current.currentTime < startTime || mediaRef.current.currentTime >= endTime) {
        mediaRef.current.currentTime = startTime;
      }
      
      mediaRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Browser playback blocked or failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!trackBarRef.current || (!isDraggingStart.current && !isDraggingEnd.current)) return;
    const rect = trackBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = offsetX / rect.width;
    const calculatedTime = Math.round(percentage * track.duration * 10) / 10;

    if (isDraggingStart.current) {
      if (calculatedTime < endTime - 1) {
        setStartTime(calculatedTime);
        // Sync media current time to the new start point while dragging
        if (mediaRef.current) {
          mediaRef.current.currentTime = calculatedTime;
        }
      }
    } else if (isDraggingEnd.current) {
      if (calculatedTime > startTime + 1) {
        setEndTime(calculatedTime);
      }
    }
  };

  const handleMouseUp = () => {
    if ((isDraggingStart.current || isDraggingEnd.current) && mediaRef.current) {
      // If it was playing before dragging, resume from the updated start point
      if (wasPlayingBeforeDrag.current) {
        mediaRef.current.currentTime = startTime;
        mediaRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }

    isDraggingStart.current = false;
    isDraggingEnd.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const startDragging = (type: 'start' | 'end') => {
    if (mediaRef.current) {
      wasPlayingBeforeDrag.current = !mediaRef.current.paused;
      mediaRef.current.pause();
      setIsPlaying(false);
    }

    if (type === 'start') isDraggingStart.current = true;
    if (type === 'end') isDraggingEnd.current = true;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startPercent = track.duration ? (startTime / track.duration) * 100 : 0;
  const endPercent = track.duration ? (endTime / track.duration) * 100 : 100;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>Trim Track: {track.title}</h3>
        
        <div style={{ marginBottom: '12px', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
          {isVideo ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaSrc}
              preload="auto"
              style={{ width: '100%', maxHeight: '200px' }}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaSrc}
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
            />
          )}
        </div>

        {/* CapCut-Style Timeline Tape */}
        <div style={{ margin: '20px 0' }}>
          <div className="muted" style={{ marginBottom: '6px', fontSize: '12px' }}>
            Drag handle edges to crop clip duration ({formatTime(endTime - startTime)} selected)
          </div>
          <div
            ref={trackBarRef}
            style={{
              position: 'relative',
              height: '48px',
              backgroundColor: '#333',
              borderRadius: '6px',
              userSelect: 'none',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff9f00, #ff1a00)',
                opacity: 0.85
              }}
            />

            <div
              onMouseDown={() => startDragging('start')}
              style={{
                position: 'absolute',
                left: `calc(${startPercent}% - 6px)`,
                width: '12px',
                height: '100%',
                backgroundColor: '#ffffff',
                border: '2px solid #ff9f00',
                cursor: 'ew-resize',
                zIndex: 2,
                borderRadius: '4px 0 0 4px'
              }}
            />

            <div
              onMouseDown={() => startDragging('end')}
              style={{
                position: 'absolute',
                left: `calc(${endPercent}% - 6px)`,
                width: '12px',
                height: '100%',
                backgroundColor: '#ffffff',
                border: '2px solid #ff1a00',
                cursor: 'ew-resize',
                zIndex: 2,
                borderRadius: '0 4px 4px 0'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block' }}>Start Time (s)</label>
            <input
              type="number"
              min={0}
              max={endTime - 1}
              value={startTime}
              onChange={(e) => setStartTime(Number(e.target.value))}
              style={{ width: '80px', padding: '4px' }}
            />
          </div>
          <button className="btn" onClick={togglePlay}>
            {isPlaying ? 'Pause Preview' : 'Play Preview'}
          </button>
          <div>
            <label style={{ fontSize: '12px', display: 'block' }}>End Time (s)</label>
            <input
              type="number"
              min={startTime + 1}
              max={track.duration}
              value={endTime}
              onChange={(e) => setEndTime(Number(e.target.value))}
              style={{ width: '80px', padding: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn green" onClick={() => onSave({ ...track, startTime, endTime })}>
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  width: '460px',
  maxWidth: '90%'
};