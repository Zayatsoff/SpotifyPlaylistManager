import React from "react";
import { Track } from "../../interfaces/PlaylistInterfaces";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Play, Pause } from "lucide-react";

interface TrackComponentProps {
  track: Track;
  isPlaying: boolean;
  moreThanXPlaylistsSelected: boolean;
  onPlayPreview: (track: Track) => void;
}

const TrackComponent: React.FC<TrackComponentProps> = ({
  track,
  isPlaying,
  onPlayPreview,
}) => {
  return (
    <div className="flex items-center h-14">
      <button onClick={() => onPlayPreview(track)} className="ml-3">
        {isPlaying ? (
          <div className="w-8 h-8 text-accent fill-accent hover:text-muted hover:fill-muted rounded-full flex items-center justify-center mr-3 transition-all ease-out">
            <Pause fill="" className="w-5 h-5 " />
          </div>
        ) : (
          <div className="w-8 h-8 text-accent fill-accent hover:text-muted hover:fill-muted rounded-full flex items-center justify-center mr-3 transition-all ease-out ">
            <Play fill="" className="w-5 h-5  " />
          </div>
        )}
      </button>
      <img
        src={track.albumImage || ""}
        alt={track.name}
        className="w-10 h-10 rounded-md mr-3 shadow-md"
      />

      <CustomTooltip
        children={
          <div className="text-md text-left ml-3">
            {truncateText(track.name, 20)}
          </div>
        }
        description={track.name}
        time={300}
      />
    </div>
  );
};

export default TrackComponent;
