import React from "react";
import { Artist, Track } from "../../interfaces/PlaylistInterfaces";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";

interface ArtistComponentProps {
  track: Track;
  moreThanXPlaylistsSelected: boolean;
}

const ArtistComponent: React.FC<ArtistComponentProps> = ({
  track,
  moreThanXPlaylistsSelected,
}) => {
  const artistNames = track.artists
    .map((artist: Artist) => artist.name)
    .join(", ");
  return (
    <div key={track.id} className="text-base p-1 h-14 flex items-center">
      <CustomTooltip
        children={<div>{truncateText(artistNames, 20)}</div>}
        description={artistNames}
        time={300}
      />
    </div>
  );
};

export default ArtistComponent;
