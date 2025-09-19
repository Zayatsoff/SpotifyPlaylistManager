import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/utils/textHelpers";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { MoreHorizontal } from "lucide-react";
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
  onDuplicatePlaylist: (playlist: Playlist) => void;
  isLoading?: boolean;
}

const SideNav: React.FC<SideNavProps> = ({
  playlists,
  selectedPlaylists,
  onPlaylistToggle,
  onDeletePlaylist,
  onRenamePlaylist,
  currentUserId,
  onDuplicatePlaylist,
  isLoading,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [playlistToRename, setPlaylistToRename] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [tabValue, setTabValue] = useState("owned");
  const [localQuery, setLocalQuery] = useState("");

  if (!playlists) {
    return null;
  }

  const ownedPlaylists = playlists?.filter(
    (playlist) => playlist.owner.id === currentUserId
  );
  const otherPlaylists = playlists?.filter(
    (playlist) => playlist.owner.id !== currentUserId
  );

  const filteredOwned = useMemo(() => {
    if (!ownedPlaylists) return [] as Playlist[];
    const q = localQuery.trim().toLowerCase();
    if (!q) return ownedPlaylists;
    return ownedPlaylists.filter((p) => p.name.toLowerCase().includes(q));
  }, [ownedPlaylists, localQuery]);

  const filteredOthers = useMemo(() => {
    if (!otherPlaylists) return [] as Playlist[];
    const q = localQuery.trim().toLowerCase();
    if (!q) return otherPlaylists;
    return otherPlaylists.filter((p) => p.name.toLowerCase().includes(q));
  }, [otherPlaylists, localQuery]);

  const maxPlaylistsSelected = selectedPlaylists.length >= 9;

  const handleDeleteClick = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setPlaylistToDelete(playlistId);
    setIsDeleteDialogOpen(true);
  };

  const openRenameDialog = (e: React.MouseEvent, playlistId: string, playlistName: string) => {
    e.stopPropagation();
    setPlaylistToRename(playlistId);
    setNewPlaylistName(playlistName);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSave = () => {
    if (playlistToRename && newPlaylistName) {
      onRenamePlaylist(playlistToRename, newPlaylistName);
      setPlaylistToRename(null);
      setIsRenameDialogOpen(false);
    }
  };

  const handleCancelRename = () => {
    setPlaylistToRename(null);
    setNewPlaylistName("");
    setIsRenameDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (playlistToDelete) {
      onDeletePlaylist(playlistToDelete);
      setPlaylistToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setPlaylistToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  

  return (
    <Card className="w-72 h-full bg-card overflow-hidden border-r border-border/50" data-left-rail>
      <Tabs
        value={tabValue}
        onValueChange={(val) => {
          setTabValue(val);
        }}
        className="w-full h-full"
      >
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b">
          <div className="px-2 py-2">
            <TabsList className="flex-wrap gap-1 h-auto min-h-[2.25rem] p-1 overflow-visible">
              <TabsTrigger value="owned">Playlists ({ownedPlaylists?.length || 0})</TabsTrigger>
              <TabsTrigger value="others">Following ({otherPlaylists?.length || 0})</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>
            <div className="mt-2">
              <div className="relative">
                <Input
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Filter playlists"
                  aria-label="Filter playlists"
                  className="h-8 pr-6"
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={() => setLocalQuery("")}
                    aria-label="Clear filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <TabsContent value="owned" className="w-full h-full">
          <ScrollArea className="w-full h-full">
            <CardContent className="pt-2">
              {isLoading ? (
                <RailSkeleton />
              ) : (
              <ul>
                {filteredOwned?.map((playlist) => {
                  const isSelected = selectedPlaylists.some(
                    (selectedPlaylist) => selectedPlaylist.id === playlist.id
                  );
                  const listItemClass =
                    (isSelected
                      ? "relative bg-accent/15 "
                      : maxPlaylistsSelected
                      ? "relative bg-muted/50 "
                      : "relative bg-card ") +
                    "group rounded-lg h-12 px-2 flex items-center mb-1 text-sm transition-colors hover:bg-accent/10";

                  const handleClick = () => {
                    const cachedKey = `cachedTracks_${playlist.id}`;
                    const hasCache = Boolean(sessionStorage.getItem(cachedKey));
                    console.group(
                      "Playlist click",
                      `${playlist.name} (${playlist.id})`
                    );
                    console.log("selected?", isSelected);
                    console.log("cache", { key: cachedKey, present: hasCache });
                    if (!isSelected && maxPlaylistsSelected) {
                      console.warn(
                        "Selection blocked: maximum selected playlists reached"
                      );
                      console.groupEnd();
                      return;
                    }
                    console.log("Toggling selection");
                    console.groupEnd();
                    onPlaylistToggle(playlist);
                  };

                  return (
                    <li
                      key={playlist.id}
                      className={listItemClass}
                      onClick={handleClick}
                      data-playlist-id={playlist.id}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-0 h-full w-1.5 bg-accent rounded-l" aria-hidden="true" />
                      )}
                      {playlist.images && playlist.images.length > 0 ? (
                        <img
                          src={playlist.images[0].url}
                          alt={`${playlist.name} cover`}
                          className="w-9 h-9 rounded-md mr-2 shadow-sm"
                          />
                      ) : (
                        <div className="w-9 h-9 bg-card-foreground/20 rounded-md mr-2 text-card-foreground "
                        >
                          <img
                            src={
                              "https://raw.githubusercontent.com/Zayatsoff/SpotifyPlaylistManager/main/src/assets/emptyPlaylist.png"
                            }
                            alt={`${playlist.name} cover`}
                            className="w-9 h-9 rounded-md mr-2 shadow-sm"
                          />
                        </div>
                      )}
                      <span className="truncate max-w-[140px]">
                        <CustomTooltip
                          children={truncateText(playlist.name, 22)}
                          description={playlist.name}
                          time={300}
                        />
                      </span>
                      <div className="ml-auto">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              aria-label={`Open menu for ${playlist.name}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-md text-foreground/70 hover:text-foreground hover:bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-1">
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20"
                              onClick={(e) => openRenameDialog(e, playlist.id, playlist.name)}
                            >
                              Rename
                            </button>
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePlaylist(playlist);
                              }}
                            >
                              Duplicate
                            </button>
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20 text-destructive"
                              onClick={(e) => handleDeleteClick(e, playlist.id)}
                            >
                              Delete
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </li>
                  );
                })}
              </ul>
              )}
            </CardContent>
          </ScrollArea>
        </TabsContent>
        <ScrollArea className="w-full h-full">
          <TabsContent value="others" className="w-full h-full">
            <CardContent>
              {isLoading ? (
                <RailSkeleton />
              ) : (
              <ul>
                {filteredOthers?.map((playlist) => {
                  const isSelected = selectedPlaylists.some(
                    (selectedPlaylist) => selectedPlaylist.id === playlist.id
                  );
                  const listItemClass =
                    (isSelected
                      ? "relative bg-accent/15 "
                      : maxPlaylistsSelected
                      ? "relative bg-muted/50 "
                      : "relative bg-card ") +
                    "group rounded-lg h-12 px-2 flex items-center mb-1 text-sm transition-colors hover:bg-accent/10";

                  const handleClick = () => {
                    const cachedKey = `cachedTracks_${playlist.id}`;
                    const hasCache = Boolean(sessionStorage.getItem(cachedKey));
                    console.group(
                      "Playlist click",
                      `${playlist.name} (${playlist.id})`
                    );
                    console.log("selected?", isSelected);
                    console.log("cache", { key: cachedKey, present: hasCache });
                    if (!isSelected && maxPlaylistsSelected) {
                      console.warn(
                        "Selection blocked: maximum selected playlists reached"
                      );
                      console.groupEnd();
                      return;
                    }
                    console.log("Toggling selection");
                    console.groupEnd();
                    onPlaylistToggle(playlist);
                  };

                  return (
                    <li
                      key={playlist.id}
                      className={listItemClass}
                      onClick={handleClick}
                      data-playlist-id={playlist.id}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-0 h-full w-1.5 bg-accent rounded-l" aria-hidden="true" />
                      )}
                      {playlist.images && playlist.images.length > 0 ? (
                        <img
                          src={playlist.images[0].url}
                          alt={`${playlist.name} cover`}
                          className="w-9 h-9 rounded-md mr-2 shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-card-foreground/20 rounded-md mr-2 text-card-foreground ">
                          <img
                            src={
                              "https://raw.githubusercontent.com/Zayatsoff/SpotifyPlaylistManager/main/src/assets/emptyPlaylist.png"
                            }
                            alt={`${playlist.name} cover`}
                            className="w-9 h-9 rounded-md mr-2 shadow-sm"
                          />
                        </div>
                      )}
                      <span className="truncate max-w-[140px]">
                        <CustomTooltip
                          children={truncateText(playlist.name, 20)}
                          description={playlist.name}
                          time={300}
                        />
                      </span>
                      <div className="ml-auto">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              aria-label={`Open menu for ${playlist.name}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-md text-foreground/70 hover:text-foreground hover:bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-1">
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20"
                              onClick={(e) => openRenameDialog(e, playlist.id, playlist.name)}
                            >
                              Rename
                            </button>
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePlaylist(playlist);
                              }}
                            >
                              Duplicate
                            </button>
                            <button
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/20 text-destructive"
                              onClick={(e) => handleDeleteClick(e, playlist.id)}
                            >
                              Delete
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </li>
                  );
                })}
              </ul>
              )}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogTrigger asChild>
          <span></span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename playlist</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleRenameSave}>Save</Button>
              <Button variant="secondary" onClick={handleCancelRename}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SideNav;

const RailSkeleton: React.FC = () => {
  return (
    <ul className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="h-12 px-2 flex items-center gap-2 animate-pulse">
          <div className="w-9 h-9 rounded-md bg-muted/30" />
          <div className="h-4 w-40 rounded bg-muted/30" />
        </li>
      ))}
    </ul>
  );
};
