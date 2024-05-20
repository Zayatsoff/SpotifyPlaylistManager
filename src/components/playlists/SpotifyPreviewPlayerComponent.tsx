import React, { useState, useEffect } from "react";
import { Track } from "../../interfaces/PlaylistInterfaces";
import { Play, Pause } from "lucide-react";

interface SpotifyPreviewPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPreview: (track: Track) => void;
}

const SpotifyPreviewPlayer: React.FC<SpotifyPreviewPlayerProps> = ({
  track,
  isPlaying,
  onPlayPreview,
}) => {
  const [progress, setProgress] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = track.previewUrl;
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / 30) * 100);
        }
      };

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };
    }
  }, [isPlaying]);

  return (
    <div className="flex items-center">
      <img
        src={track.albumImage || ""}
        alt={track.name}
        className="w-20 h-20 rounded-md mr-3 shadow-md"
      />
      <button onClick={() => onPlayPreview(track)} className="mr-3">
        {isPlaying ? (
          <div className="w-8 h-8 bg-accent/30 hover:bg-accent/70 rounded-full flex items-center justify-center mr-3 transition-all ease-out">
            <Pause className="w-5 h-5 " />
          </div>
        ) : (
          <div className="w-8 h-8 bg-accent/30 hover:bg-accent/70 rounded-full flex items-center justify-center mr-3 transition-all ease-out">
            <Play className="w-5 h-5  " />
          </div>
        )}
      </button>
      <div className="flex-1 h-1 bg-gray-300 rounded">
        <div
          className="h-full bg-blue-500 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
      <audio ref={audioRef} />
    </div>
  );
};

export default SpotifyPreviewPlayer;
