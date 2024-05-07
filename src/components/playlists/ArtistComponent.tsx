import React from "react";
import { Artist, Track } from "../../interfaces/PlaylistInterfaces";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";

interface ArtistComponentProps {
  track: Track;
}

const ArtistComponent: React.FC<ArtistComponentProps> = ({ track }) => {
  const artistNames = track.artists
    .map((artist: Artist) => artist.name)
    .join(", ");
  return (
    <div key={track.id} className="p-1 h-14 flex items-center">
      <CustomTooltip
        children={<div>{truncateText(artistNames, 20)}</div>}
        description={artistNames}
        time={300}
      />
    </div>
  );
};

export default ArtistComponent;
