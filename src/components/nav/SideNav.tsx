import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Trash2, Edit3 } from "lucide-react";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Playlist } from "@/interfaces/PlaylistInterfaces";

interface SideNavProps {
  playlists: Playlist[] | null;
  selectedPlaylists: Playlist[];
  onPlaylistToggle: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRenamePlaylist: (playlistId: string, newName: string) => void;
  currentUserId: string;
}

const SideNav: React.FC<SideNavProps> = ({
  playlists,
  selectedPlaylists,
  onPlaylistToggle,
  onDeletePlaylist,
  onRenamePlaylist,
  currentUserId,
}) => {
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [playlistToRename, setPlaylistToRename] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [renamePosition, setRenamePosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tabValue, setTabValue] = useState("owned");

  if (!playlists) {
    return null;
  }

  const ownedPlaylists = playlists?.filter(
    (playlist) => playlist.owner.id === currentUserId
  );
  const otherPlaylists = playlists?.filter(
    (playlist) => playlist.owner.id !== currentUserId
  );

  const maxPlaylistsSelected = selectedPlaylists.length >= 9;

  const handleDeleteClick = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setPlaylistToDelete(playlistId);
    setIsDialogOpen(true);
  };

  const handleRenameClick = (
    e: React.MouseEvent,
    playlistId: string,
    playlistName: string
  ) => {
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
    <Card className="w-80 h-full bg-card overflow-hidden">
      <Tabs
        value={tabValue}
        onValueChange={setTabValue}
        className="w-full h-full"
      >
        <TabsList>
          <TabsTrigger value="owned">Playlists</TabsTrigger>
          <TabsTrigger value="others">Other</TabsTrigger>
          <TabsTrigger value="recommended">Recommended </TabsTrigger>
        </TabsList>
        <ScrollArea className="w-full h-full">
          <TabsContent value="owned" className="w-full h-full">
            <CardHeader>Owned Playlists</CardHeader>
            <CardContent>
              <ul>
                {ownedPlaylists?.map((playlist) => {
                  const isSelected = selectedPlaylists.some(
                    (selectedPlaylist) => selectedPlaylist.id === playlist.id
                  );
                  const listItemClass = isSelected
                    ? "rounded-xl p-3 bg-accent/30 hover:bg-accent/70 font-semibold flex items-center mb-2 text-md transition-all ease-out"
                    : maxPlaylistsSelected
                    ? "rounded-xl flex items-center mb-2 p-3 bg-muted text-md transition-all ease-out"
                    : "rounded-xl flex items-center bg-card mb-2 p-3 hover:bg-accent/10 text-md transition-all ease-out";
                  const trashClass =
                    hoveredPlaylist === playlist.id
                      ? "w-5 h-5  cursor-pointer text-destructive hover:text-foreground transition-all"
                      : "w-5 h-5 cursor-pointer text-destructive/0";
                  const editClass =
                    hoveredPlaylist === playlist.id
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
                        <div className="w-10 h-10 bg-card-foreground/20 rounded-md mr-2 text-card-foreground ">
                          <img
                            src={
                              "https://raw.githubusercontent.com/Zayatsoff/SpotifyPlaylistManager/main/src/assets/emptyPlaylist.png"
                            }
                            alt={`${playlist.name} cover`}
                            className="w-10 h-10 rounded-md mr-2 shadow-md"
                          />
                        </div>
                      )}
                      <span>
                        <CustomTooltip
                          children={truncateText(playlist.name, 20)}
                          description={playlist.name}
                          time={300}
                        />
                      </span>
                      <Popover
                        open={popoverOpen}
                        onOpenChange={handlePopoverOpenChange}
                      >
                        <PopoverTrigger asChild>
                          <div className={`${editClass}`}>
                            <CustomTooltip
                              children={
                                <Edit3
                                  className={`${editClass}`}
                                  onClick={(e) =>
                                    handleRenameClick(
                                      e,
                                      playlist.id,
                                      playlist.name
                                    )
                                  }
                                />
                              }
                              description="Rename"
                              time={300}
                            />
                          </div>
                        </PopoverTrigger>
                        {popoverOpen &&
                          playlistToRename === playlist.id &&
                          renamePosition && (
                            <PopoverContent
                              className="transform"
                              style={{
                                position: "absolute",
                                top: -30,
                              }}
                            >
                              <div className="flex flex-col p-4">
                                <div className="text-foreground text-md pb-3">
                                  Rename{" "}
                                  <span className="font-semibold">
                                    {playlist.name}{" "}
                                  </span>
                                  :
                                </div>
                                <Input
                                  type="text"
                                  value={newPlaylistName}
                                  onChange={(e) =>
                                    setNewPlaylistName(e.target.value)
                                  }
                                  placeholder="New playlist name"
                                  className="mb-2"
                                />
                                <div className="pt-3 flex justify-end items-center">
                                  <Button
                                    className="mr-2"
                                    onClick={handleRenameSave}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={handleCancelRename}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          )}
                      </Popover>
                      <div className={`${trashClass} `}>
                        <CustomTooltip
                          children={
                            <Trash2
                              className={`${trashClass} ml-2`}
                              onClick={(e) => handleDeleteClick(e, playlist.id)}
                            />
                          }
                          description="Delete"
                          time={300}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </TabsContent>
        </ScrollArea>
        <ScrollArea className="w-full h-full">
          <TabsContent value="others" className="w-full h-full">
            <CardHeader>Other Playlists</CardHeader>
            <CardContent>
              <ul>
                {otherPlaylists?.map((playlist) => {
                  const isSelected = selectedPlaylists.some(
                    (selectedPlaylist) => selectedPlaylist.id === playlist.id
                  );
                  const listItemClass = isSelected
                    ? "rounded-xl p-3 bg-accent/30 hover:bg-accent/70 font-semibold flex items-center mb-2 text-md transition-all ease-out"
                    : maxPlaylistsSelected
                    ? "rounded-xl flex items-center mb-2 p-3 bg-muted text-md transition-all ease-out"
                    : "rounded-xl flex items-center mb-2 p-3 hover:bg-accent/10 text-md transition-all ease-out";

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
                        <div className="w-10 h-10 bg-card-foreground/20 rounded-md mr-2 text-card-foreground ">
                          <img
                            src={
                              "https://raw.githubusercontent.com/Zayatsoff/SpotifyPlaylistManager/main/src/assets/emptyPlaylist.png"
                            }
                            alt={`${playlist.name} cover`}
                            className="w-10 h-10 rounded-md mr-2 shadow-md"
                          />
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
          </TabsContent>
        </ScrollArea>
        <ScrollArea className="w-full h-full">
          <TabsContent value="recommended" className="w-full h-full">
            <CardHeader>Recommended Playlists</CardHeader>
            <CardContent>
              <ul>
                <div>TBA</div>
              </ul>
            </CardContent>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span></span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              playlist and remove your data from Spotify servers. Although, you
              can always recover playlists within 90 days through{" "}
              <a
                href="https://www.spotify.com/ca-en/account/recover-playlists/"
                className="text-accent"
              >
                Spotify's recovery page
              </a>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button className="mr-2" onClick={handleConfirmDelete}>
              Yes
            </Button>
            <Button variant="secondary" onClick={handleCancelDelete}>
              No
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SideNav;
