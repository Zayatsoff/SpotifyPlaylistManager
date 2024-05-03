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
            {playlists?.map((playlist) => (
              <li
                key={playlist.id}
                className="flex items-center mb-2"
                onClick={() => onPlaylistToggle(playlist)} // Updated to onPlaylistToggle
              >
                <img
                  src={playlist.images?.[0]?.url || ""}
                  alt={`${playlist.name} cover`}
                  className="w-10 h-10 rounded-full mr-2"
                />
                <span>{playlist.name}</span>
                <input
                  type="checkbox"
                  className="ml-auto"
                  checked={selectedPlaylists.some(
                    (selectedPlaylist) => selectedPlaylist.id === playlist.id
                  )} // Check if the playlist is selected
                  readOnly // Make the checkbox read-only
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default SideNav;
