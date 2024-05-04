import React from "react";
import { Artist, Track } from "../../interfaces/PlaylistInterfaces"; // Correct the path as necessary

interface ArtistComponentProps {
  track: Track;
}

const TrackComponent: React.FC<ArtistComponentProps> = ({ track }) => {
  return (
    <div key={track.id} className="p-1 h-14 flex items-center">
      {track.artists.map((artist: Artist) => artist.name).join(", ")}
    </div>
  );
};

export default TrackComponent;
