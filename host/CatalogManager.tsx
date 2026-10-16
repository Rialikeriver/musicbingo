import React, { useState } from 'react';
import { Track } from '../../types';

export const CatalogManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    //parse dropped files from hard drive
    const newTracks: Track[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      album: "Unknown Album",
      filePath: file.path, 
      startTime: 0,
      duration:
    }));

    setTracks(prev => [...prev, ...newTracks]);
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      className="border-2 border-dashed border-gray-400 p-8 rounded-xl text-center"
    >
      <p>Drag & Drop Audio/Video catalogs here, or click to Import</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Browse Files
      </button>
    </div>
  );
};
