import React from "react";
import { Track } from "../../interfaces/PlaylistInterfaces"; // Correct the path as necessary

interface TrackComponentProps {
  track: Track;
}

const TrackComponent: React.FC<TrackComponentProps> = ({ track }) => {
  return (
    <div className="flex p-1 items-center h-14">
      <img
        src={track.albumImage || ""}
        alt={track.name}
        className="w-10 h-10 rounded-full mr-2"
      />
      {track.name}
    </div>
  );
};

export default TrackComponent;
