import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface SideNavProps {
  playlists: Playlist[] | null; // Make sure playlists can be null
}

const SideNav: React.FC<SideNavProps> = ({ playlists }) => {
  return (
    <Card className="w-full h-full bg-card  overflow-hidden">
      <ScrollArea className="w-full h-full p-6">
        <h2 className="text-lg font-bold mb-4">Playlists</h2>
        <ul>
          {playlists?.map((playlist) => (
            <li key={playlist.id} className="flex items-center mb-2">
              <img
                src={playlist.images?.[0]?.url || ""}
                alt={`${playlist.name} cover`}
                className="w-10 h-10 rounded-full mr-2"
              />
              <span>{playlist.name}</span>
              <input type="checkbox" className="ml-auto" />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
};

export default SideNav;
