import React from "react";
import { Track } from "../../interfaces/PlaylistInterfaces";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Play, Pause } from "lucide-react";

interface TrackComponentProps {
  track: Track;
  isPlaying: boolean;
  onPlayPreview: (track: Track) => void;
  density?: "comfortable" | "compact";
}

const TrackComponent: React.FC<TrackComponentProps> = ({
  track,
  isPlaying,
  onPlayPreview,
  density = "comfortable",
}) => {
  const rowHeightClass = density === "compact" ? "h-[52px]" : "h-[64px]";
  const coverSizeClass = density === "compact" ? "w-8 h-8" : "w-9 h-9";
  const controlSizeClass = density === "compact" ? "w-6 h-6" : "w-7 h-7";
  return (
    <div className={"flex items-center " + rowHeightClass}>
      <button
        onClick={() => onPlayPreview(track)}
        className="ml-2"
        aria-label={isPlaying ? `Pause preview of ${track.name}` : `Play preview of ${track.name}`}
      >
        {isPlaying ? (
          <div className={controlSizeClass + " text-accent fill-accent hover:text-muted hover:fill-muted rounded-md flex items-center justify-center mr-2 transition-colors ease-out"}>
            <Pause className="w-4 h-4" />
          </div>
        ) : (
          <div className={controlSizeClass + " text-accent fill-accent hover:text-muted hover:fill-muted rounded-md flex items-center justify-center mr-2 transition-colors ease-out"}>
            <Play className="w-4 h-4" />
          </div>
        )}
      </button>
      <img
        src={track.albumImage || ""}
        alt={track.name}
        className={coverSizeClass + " rounded-md mr-2 shadow-sm"}
      />

      <CustomTooltip
        children={
          <div className="text-sm leading-5 text-left ml-2 truncate max-w-[14rem]" title={track.name}>
            {track.name}
          </div>
        }
        description={track.name}
        time={300}
      />
    </div>
  );
};

export default TrackComponent;
