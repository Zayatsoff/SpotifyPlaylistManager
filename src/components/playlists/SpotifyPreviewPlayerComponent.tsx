import React, { useState, useEffect, useRef } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;

      if (currentTrackRef.current !== track) {
        audioElement.pause();
        audioElement.src = track.previewUrl;
        audioElement.load(); // Ensure the new source is loaded
        currentTrackRef.current = track;
      }

      const handleCanPlayThrough = () => {
        if (isPlaying) {
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.error("Error playing audio:", e);
            });
          }
        }
      };

      audioElement.addEventListener("canplaythrough", handleCanPlayThrough);

      return () => {
        audioElement.removeEventListener(
          "canplaythrough",
          handleCanPlayThrough
        );
      };
    }
  }, [track, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;

      if (isPlaying) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.error("Error playing audio:", e);
          });
        }
      } else {
        audioElement.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          const currentTime = (
            (audioRef.current.currentTime / 30) *
            100
          ).toFixed(1);
          setProgress(parseFloat(currentTime));
        }
      };

      const interval = setInterval(handleTimeUpdate, 50); // Update progress every 50ms

      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        clearInterval(interval);
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };
    }
  }, [isPlaying]);

  const handleProgressClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (audioRef.current && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width) * 100;
      const newTime = (newProgress / 100) * 30; // Assuming 30 seconds duration
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const rect = progressBar.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const newProgress = Math.min(
        Math.max((moveX / rect.width) * 100, 0),
        100
      );
      const newTime = (newProgress / 100) * 30; // Assuming 30 seconds duration
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
      setProgress(newProgress);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex items-center px-3 pb-3 ">
      <div className="flex items-center w-96">
        <img
          src={track.albumImage || ""}
          alt={track.name}
          className="w-20 h-20 rounded-md mr-3 shadow-md"
        />
        <div className="flex flex-col mr-3">
          <span className="text-lg font-bold text-foreground">
            {track.name}
          </span>
          <span className="text-sm text-foreground">
            {track.artists[0].name}
          </span>
        </div>
      </div>
      <div className="flex items-center w-3/4">
        <button onClick={() => onPlayPreview(track)} className="mr-3">
          {isPlaying ? (
            <div className="w-8 h-8 text-accent fill-accent hover:text-muted hover:fill-muted rounded-full flex items-center justify-center mr-3 transition-all ease-out">
              <Pause fill="" className="w-5 h-5 " />
            </div>
          ) : (
            <div className="w-8 h-8 text-accent fill-accent hover:text-muted hover:fill-muted rounded-full flex items-center justify-center mr-3 transition-all ease-out">
              <Play fill="" className="w-5 h-5  " />
            </div>
          )}
        </button>
        <div
          className=" w-full flex-1 h-1 bg-muted rounded relative mr-6"
          onClick={handleProgressClick}
          ref={progressBarRef}
        >
          <div
            className="w-full h-full bg-accent rounded relative"
            style={{ width: `${progress}%` }}
          >
            <div
              className={`absolute right-[-4px] top-1/2 transform -translate-y-1/2 bg-accent rounded-full transition-all ease-in-out h-4 w-4 hover:w-5 hover:h-5 hover:right-[-5px]${
                isDragging ? "w-5 h-5 right-[-5px]" : ""
              }`}
              onMouseDown={handleMouseDown}
            />
          </div>
        </div>
        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default SpotifyPreviewPlayer;
