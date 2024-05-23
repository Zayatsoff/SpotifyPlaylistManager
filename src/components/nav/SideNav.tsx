import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Music, Trash2, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
  onRenamePlaylist: (playlistId: string, newName: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({
  playlists,
  selectedPlaylists,
  onPlaylistToggle,
  onDeletePlaylist,
  onRenamePlaylist,
}) => {
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [playlistToRename, setPlaylistToRename] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [renamePosition, setRenamePosition] = useState<{ top: number; left: number } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const maxPlaylistsSelected = selectedPlaylists.length >= 9;

  const handleDeleteClick = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setPlaylistToDelete(playlistId);
    setIsDialogOpen(true);
  };

  const handleRenameClick = (e: React.MouseEvent, playlistId: string, playlistName: string) => {
    e.stopPropagation();
    setPlaylistToRename(playlistId);
    setNewPlaylistName(playlistName);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newPosition = { top: rect.top + rect.height, left: rect.left };
    setRenamePosition(newPosition);
    setPopoverOpen(true);
  };

  const handleRenameSave = () => {
    if (playlistToRename && newPlaylistName) {
      onRenamePlaylist(playlistToRename, newPlaylistName);
      setPlaylistToRename(null);
      setPopoverOpen(false);
    }
  };

  const handleCancelRename = () => {
    setPlaylistToRename(null);
    setNewPlaylistName("");
    setPopoverOpen(false);
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

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setPopoverOpen(isOpen);
  };

  return (
    <Card className="w-full h-full bg-card overflow-hidden">
      <ScrollArea className="w-full h-full">
        <CardHeader>Playlists</CardHeader>
        <CardContent>
          <ul>
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
                ? "w-5 h-5 ml-2 cursor-pointer text-destructive hover:text-foreground transition-all"
                : "w-5 h-5 ml-2 cursor-pointer text-destructive/0";
              const editClass = hoveredPlaylist === playlist.id
                ? "w-5 h-5 ml-auto cursor-pointer text-primary hover:text-foreground transition-all"
                : "w-5 h-5 ml-auto cursor-pointer text-primary/0";

              const handleClick = () => {
                if (!isSelected && maxPlaylistsSelected) return;
                onPlaylistToggle(playlist);
              };

              return (
                <li
                  key={playlist.id}
                  className={listItemClass}
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
                  <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
                    <PopoverTrigger asChild>
                      <Edit3
                        className={`${editClass}`}
                        onClick={(e) => handleRenameClick(e, playlist.id, playlist.name)}
                      />
                    </PopoverTrigger>
                    {popoverOpen && playlistToRename === playlist.id && renamePosition && (
                      <PopoverContent
                        className="transform"
                        style={{
                          position: "absolute",
                          top: -30,
                        }}
                      >
                        <div className="flex flex-col p-4">
                          <div className="text-foreground text-md pb-3">Rename <span className="font-semibold">{playlist.name} </span>:</div>
                          <Input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="New playlist name"
                            className="mb-2"
                          />
                          <div className="pt-3 flex justify-end items-center">
                            <Button className="mr-2" onClick={handleRenameSave}>Save</Button>
                            <Button variant="secondary" onClick={handleCancelRename}>Cancel</Button>
                          </div>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                  <Trash2
                    className={`${trashClass}`}
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
