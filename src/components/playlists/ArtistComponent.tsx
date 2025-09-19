import React from "react";
import { Artist, Track } from "../../interfaces/PlaylistInterfaces";
import CustomTooltip from "@/components/ui/CustomTooltip";

interface ArtistComponentProps {
  track: Track;
  density?: "comfortable" | "compact";
}

const ArtistComponent: React.FC<ArtistComponentProps> = ({ track, density = "comfortable" }) => {
  const artistNames = track.artists
    .map((artist: Artist) => artist.name)
    .join(", ");
  return (
    <div key={track.id} className={"text-xs text-muted-foreground flex items-center " + (density === "compact" ? "h-[52px]" : "h-[64px]") }>
      <CustomTooltip
        children={<div className="truncate max-w-[12rem]" title={artistNames}>{artistNames}</div>}
        description={artistNames}
        time={300}
      />
    </div>
  );
};

export default ArtistComponent;
