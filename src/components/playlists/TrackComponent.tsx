import React from "react";
import { Track } from "../../interfaces/PlaylistInterfaces"; // Correct the path as necessary
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
interface TrackComponentProps {
  track: Track;
}

const TrackComponent: React.FC<TrackComponentProps> = ({ track }) => {
  return (
    <div className="flex p-1 items-center h-14">
      <img
        src={track.albumImage || ""}
        alt={track.name}
        className="w-10 h-10 rounded-md mr-3"
      />

      <CustomTooltip
        children={<div>{truncateText(track.name, 30)}</div>}
        description={track.name}
        time={300}
      />
    </div>
  );
};

export default TrackComponent;
