import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Music, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; 
interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface SideNavProps {
  playlists: Playlist[] | null;
  selectedPlaylists: Playlist[];
  onPlaylistToggle: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({
  playlists,
  selectedPlaylists,
  onPlaylistToggle,
  onDeletePlaylist,
}) => {
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  const maxPlaylistsSelected = selectedPlaylists.length >= 9;

  const handleDeleteClick = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setPlaylistToDelete(playlistId);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (playlistToDelete) {
      onDeletePlaylist(playlistToDelete);
      setPlaylistToDelete(null);
      setIsDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setPlaylistToDelete(null);
    setIsDialogOpen(false);
  };

  return (
    <Card className="w-full h-full bg-card overflow-hidden">
      <ScrollArea className="w-full h-full">
        <CardHeader>Playlists</CardHeader>
        <CardContent >
          <ul >
            {playlists?.map((playlist) => {
              const isSelected = selectedPlaylists.some(
                (selectedPlaylist) => selectedPlaylist.id === playlist.id
              );
              const listItemClass = isSelected
                ? "rounded-xl p-3 bg-accent/30 hover:bg-accent/70 font-semibold flex items-center mb-2 text-md transition-all ease-out"
                : maxPlaylistsSelected
                ? "rounded-xl flex items-center mb-2 p-3 bg-muted text-md transition-all ease-out"
                : "rounded-xl flex items-center mb-2 p-3 hover:bg-accent/10 text-md transition-all ease-out";
                const trashClass = hoveredPlaylist === playlist.id
                ? "w-5 h-5 ml-auto cursor-pointer text-destructive hover:text-foreground transition-all "
                : "w-5 h-5 ml-auto cursor-pointer text-card "
                

              const handleClick = () => {
                if (!isSelected && maxPlaylistsSelected) return;
                onPlaylistToggle(playlist);
              };

              return (
                <li
                  key={playlist.id}
                  className={listItemClass }
                  onClick={handleClick}
                  onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                >
                  {playlist.images && playlist.images.length > 0 ? (
                    <img
                      src={playlist.images[0].url}
                      alt={`${playlist.name} cover`}
                      className="w-10 h-10 rounded-md mr-2 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-card-foreground/20 rounded-md mr-2 text-card-foreground flex items-center justify-center ">
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
                  
                    <Trash2
                      className={`${trashClass} `}
                      onClick={(e) => handleDeleteClick(e, playlist.id)}
                    />
                  
                </li>
              );
            })}
          </ul>
        </CardContent>
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span></span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your playlist and remove your data from Spotify servers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button className="mr-2" onClick={handleConfirmDelete}>Yes</Button>
            <Button variant="secondary" onClick={handleCancelDelete}>No</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SideNav;
