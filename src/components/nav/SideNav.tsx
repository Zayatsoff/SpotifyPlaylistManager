import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Music } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface SideNavProps {
  playlists: Playlist[] | null;
  selectedPlaylists: Playlist[];
  onPlaylistToggle: (playlist: Playlist) => void;
}
const SideNav: React.FC<SideNavProps> = ({
  playlists,
  selectedPlaylists,
  onPlaylistToggle,
}) => {
  const maxPlaylistsSelected = selectedPlaylists.length >= 9;
  return (
    <Card className="w-full h-full bg-card overflow-hidden ">
      <ScrollArea className="w-full h-full ">
        <CardHeader>Playlists</CardHeader>
        <CardContent>
          <ul>
            {playlists?.map((playlist) => {
              const isSelected = selectedPlaylists.some(
                (selectedPlaylist) => selectedPlaylist.id === playlist.id
              );
              const listItemClass = isSelected
                ? "rounded-xl p-3 bg-accent/30 hover:bg-accent/70 font-semibold flex items-center mb-2 text-lg transition-all ease-out"
                : maxPlaylistsSelected
                ? "rounded-xl flex items-center mb-2 p-3 bg-muted text-lg"
                : "rounded-xl flex items-center mb-2 p-3 hover:bg-accent/10 text-lg transition-all ease-out";

              const handleClick = () => {
                if (!isSelected && maxPlaylistsSelected) return;
                onPlaylistToggle(playlist);
              };
              return (
                <li
                  key={playlist.id}
                  className={listItemClass}
                  onClick={handleClick}
                >
                  {playlist.images && playlist.images.length > 0 ? (
                    <img
                      src={playlist.images[0].url}
                      alt={`${playlist.name} cover`}
                      className="w-10 h-10 rounded-md mr-2 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-card-foreground/20 rounded-md mr-2 text-card-foreground flex items-center justify-center">
                      <Music />
                    </div>
                  )}
                  <span>
                    <CustomTooltip
                      children={truncateText(playlist.name, 20)}
                      description={playlist.name}
                      time={300}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default SideNav;
