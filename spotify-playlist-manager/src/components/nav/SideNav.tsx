import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
                ? "rounded-xl p-1 bg-primary/30 hover:bg-primary/40 font-semibold flex items-center mb-2"
                : "rounded-xl flex items-center mb-2 p-1 hover:bg-primary/10";
              return (
                <li
                  key={playlist.id}
                  className={listItemClass}
                  onClick={() => onPlaylistToggle(playlist)}
                >
                  <img
                    src={playlist.images?.[0]?.url || ""}
                    alt={`${playlist.name} cover`}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <span>{playlist.name}</span>
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
