import React, {
  useEffect,
  useReducer,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import TrackComponent from "@/components/playlists/TrackComponent";
import ArtistComponent from "@/components/playlists/ArtistComponent";
import {
  Track,
  Playlist,
  State,
  Action,
} from "../interfaces/PlaylistInterfaces";
import SideNav from "@/components/nav/SideNav";
import TopNav from "@/components/nav/TopNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uniqBy } from "lodash";
import { Plus, Check, ArrowUp, ArrowDownUp, ArrowDown } from "lucide-react";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Input } from "@/components/ui/input";
import useErrorHandling from "@/hooks/useErrorHandling";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SpotifyPreviewPlayer from "@/components/playlists/SpotifyPreviewPlayerComponent";

// Define action types and initial state outside of the component
const actionTypes = {
  SET_PLAYLISTS: "SET_PLAYLISTS",
  TOGGLE_PLAYLIST_SELECTION: "TOGGLE_PLAYLIST_SELECTION",
  SET_TRACKS: "SET_TRACKS",
  ADD_TRACK_TO_PLAYLIST: "ADD_TRACK_TO_PLAYLIST",
  REMOVE_TRACK_FROM_PLAYLIST: "REMOVE_TRACK_FROM_PLAYLIST",
  DELETE_PLAYLIST: "DELETE_PLAYLIST",
};

const initialState = {
  playlists: [],
  selectedPlaylists: [],
  playlistTracks: {} as Record<string, Track[]>,
};

// Reducer function
const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case actionTypes.SET_PLAYLISTS:
      return { ...state, playlists: action.payload as Playlist[] };
    case actionTypes.TOGGLE_PLAYLIST_SELECTION:
      const index = state.selectedPlaylists.findIndex(
        (p: Playlist) => p.id === action.payload.id
      );
      return {
        ...state,
        selectedPlaylists:
          index === -1
            ? [...state.selectedPlaylists, action.payload]
            : state.selectedPlaylists.filter(
                (p: Playlist) => p.id !== action.payload.id
              ),
      };
    case actionTypes.SET_TRACKS:
      return {
        ...state,
        playlistTracks: {
          ...state.playlistTracks,
          [action.payload.id]: action.payload.tracks as Track[],
        },
      };
    case actionTypes.ADD_TRACK_TO_PLAYLIST:
      return {
        ...state,
        playlistTracks: {
          ...state.playlistTracks,
          [action.payload.playlistId]: [
            ...(state.playlistTracks[action.payload.playlistId] || []),
            action.payload.track,
          ],
        },
      };
    case actionTypes.REMOVE_TRACK_FROM_PLAYLIST:
      const updatedTracks = state.playlistTracks[
        action.payload.playlistId
      ].filter((t) => t.id !== action.payload.trackId);
      return {
        ...state,
        playlistTracks: {
          ...state.playlistTracks,
          [action.payload.playlistId]: updatedTracks,
        },
      };
    case actionTypes.DELETE_PLAYLIST:
      return {
        ...state,
        playlists: state.playlists.filter((p) => p.id !== action.payload),
        selectedPlaylists: state.selectedPlaylists.filter(
          (p) => p.id !== action.payload
        ),
        playlistTracks: Object.keys(state.playlistTracks).reduce((acc, key) => {
          if (key !== action.payload) {
            acc[key] = state.playlistTracks[key];
          }
          return acc;
        }, {} as Record<string, Track[]>),
      };

    default:
      return state;
  }
};

const PlaylistsPage: React.FC = () => {
  const { token, userId } = useSpotifyAuth(); // Assuming userId is available here
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchQuery, setSearchQuery] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string | null;
  }>({ key: "", direction: null });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [columnWidths, _] = useState<{
    song: string;
    artist: string;
    playlists: { [key: string]: string };
  }>({
    song: "20rem",
    artist: "14rem",
    playlists: {},
  });

  const songRefs = useRef<(HTMLDivElement | null)[]>([]);
  const artistRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playlistRefs = useRef<{ [key: string]: (HTMLDivElement | null)[] }>({});

  useErrorHandling(setShowErrorPopup);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!token) return;

      const cachedPlaylists = sessionStorage.getItem("cachedPlaylists");
      if (cachedPlaylists) {
        dispatch({
          type: actionTypes.SET_PLAYLISTS,
          payload: JSON.parse(cachedPlaylists),
        });
        return;
      }

      let allPlaylists: any[] = [];
      let url = `https://api.spotify.com/v1/me/playlists`;
      let next = true;

      try {
        while (next) {
          const playlistsResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await playlistsResponse.json();
          allPlaylists = [...allPlaylists, ...data.items];
          // Check if there is a next page
          if (data.next) {
            url = data.next;
          } else {
            next = false;

            console.log("Fetched playlists:", allPlaylists); // Log fetched playlists for debugging
          }
        }

        sessionStorage.setItem("cachedPlaylists", JSON.stringify(allPlaylists));

        dispatch({
          type: actionTypes.SET_PLAYLISTS,
          payload: allPlaylists,
        });
      } catch (error) {
        console.error("Failed to fetch playlists", error);
      }
    };

    fetchPlaylists();
  }, [token]);

  const fetchAllTracks = async (playlistId: string) => {
    let allTracks: Track[] = [];
    let offset = 0;
    const limit = 100;

    try {
      while (true) {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        const tracks = data.items.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map((artist: any) => ({
            name: artist.name,
          })),
          albumImage: item.track.album.images[0]?.url || "",
          previewUrl: item.track.preview_url || "",
        }));

        allTracks = [...allTracks, ...tracks];

        if (data.items.length < limit) break;
        offset += limit;
      }
    } catch (error) {
      console.error("Failed to fetch tracks", error);
    }

    return allTracks;
  };

  useEffect(() => {
    const fetchTracks = async (playlistId: string) => {
      const cachedTracks = sessionStorage.getItem(`cachedTracks_${playlistId}`);
      if (cachedTracks) {
        dispatch({
          type: actionTypes.SET_TRACKS,
          payload: { id: playlistId, tracks: JSON.parse(cachedTracks) },
        });
        return;
      }

      const tracks = await fetchAllTracks(playlistId);
      sessionStorage.setItem(
        `cachedTracks_${playlistId}`,
        JSON.stringify(tracks)
      );
      dispatch({
        type: actionTypes.SET_TRACKS,
        payload: { id: playlistId, tracks },
      });
    };

    state.selectedPlaylists.forEach((playlist) => {
      if (!state.playlistTracks[playlist.id]) {
        fetchTracks(playlist.id);
      }
    });
  }, [state.selectedPlaylists, token]);

  const handlePlayPreview = useCallback(
    (track: Track) => {
      if (currentTrack && currentTrack.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    },
    [currentTrack, isPlaying]
  );

  const allTracks = useMemo(() => {
    return uniqBy(
      state.selectedPlaylists.flatMap(
        (playlist) => state.playlistTracks[playlist.id] || []
      ),
      (track: Track) => track.id
    );
  }, [state.selectedPlaylists, state.playlistTracks]);

  const handlePlaylistToggle = useCallback((playlist: Playlist): void => {
    dispatch({
      type: actionTypes.TOGGLE_PLAYLIST_SELECTION,
      payload: playlist,
    });
  }, []);

  const sortTracks = useCallback(
    (
      tracks: Track[],
      key: keyof Track | "artist" | "playlist" | string,
      direction: "ascending" | "descending",
      playlistId?: string
    ) => {
      return tracks.sort((a, b) => {
        let aValue: string, bValue: string;

        if (playlistId) {
          const aInPlaylist = state.playlistTracks[playlistId]?.some(
            (t) => t.id === a.id
          );
          const bInPlaylist = state.playlistTracks[playlistId]?.some(
            (t) => t.id === b.id
          );

          if (aInPlaylist && !bInPlaylist) return -1;
          if (!aInPlaylist && bInPlaylist) return 1;
        }

        if (key === "artist") {
          aValue = a.artists[0]?.name.toLowerCase();
          bValue = b.artists[0]?.name.toLowerCase();
        } else if (key === "playlist") {
          const aPlaylist = state.selectedPlaylists.find((playlist) =>
            state.playlistTracks[playlist.id]?.some((t) => t.id === a.id)
          );
          const bPlaylist = state.selectedPlaylists.find((playlist) =>
            state.playlistTracks[playlist.id]?.some((t) => t.id === b.id)
          );
          aValue = aPlaylist?.name.toLowerCase() || "";
          bValue = bPlaylist?.name.toLowerCase() || "";
        } else if (key === "name") {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
          aValue = (a as any)[key]?.toString().toLowerCase();
          bValue = (a as any)[key]?.toString().toLowerCase();
        }

        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    },
    [state.playlistTracks, state.selectedPlaylists]
  );

  const handleRenamePlaylist = async (playlistId: string, newName: string) => {
    try {
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });
      dispatch({
        type: actionTypes.SET_PLAYLISTS,
        payload: state.playlists.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, name: newName } : playlist
        ),
      });
    } catch (error) {
      console.error("Failed to rename playlist", error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      dispatch({
        type: actionTypes.DELETE_PLAYLIST,
        payload: playlistId,
      });
    } catch (error) {
      console.error("Failed to delete playlist", error);
    }
  };

  const filteredTracks = useMemo(
    () =>
      sortConfig.key
        ? sortTracks(
            [...allTracks],
            sortConfig.key as keyof Track | "artist" | "playlist",
            sortConfig.direction as "ascending" | "descending",
            state.selectedPlaylists.find((p) => p.id === sortConfig.key)?.id
          )
        : allTracks,
    [allTracks, sortConfig, sortTracks, state.selectedPlaylists]
  );

  const filteredAndSearchedTracks = useMemo(
    () =>
      filteredTracks.filter(
        (track) =>
          track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artists.some((artist) =>
            artist.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      ),
    [filteredTracks, searchQuery]
  );

  const addTrackToPlaylist = async (playlistId: string, trackUri: string) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [trackUri] }),
        }
      );
      return response.json();
    } catch (error) {
      console.error("Failed to add track to playlist", error);
    }
  };

  const moreThanXPlaylistsSelected = state.selectedPlaylists.length > 8;

  const removeTrackFromPlaylist = async (
    playlistId: string,
    trackUri: string
  ) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
        }
      );
      return response.json();
    } catch (error) {
      console.error("Failed to remove track from playlist", error);
    }
  };

  useEffect(() => {
    songRefs.current = [];
    artistRefs.current = [];
  }, [state.selectedPlaylists, filteredAndSearchedTracks]);

  const handleSort = (key: keyof Track | "artist" | "playlist" | string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-background flex flex-col">
      {showErrorPopup && (
        <Dialog open={showErrorPopup} onOpenChange={setShowErrorPopup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Spotify API blocked 😞</DialogTitle>
              <DialogDescription>
                It looks like a browser extension is blocking the Spotify API.
                Usually, at least for me, it's Privacy Badger blocking{" "}
                <span className="text-accent">api.spotify.com</span>. Unless you
                disable it the app can't really access any of you Spotify data.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      <div className="w-full h-full flex-1">
        <TopNav />
      </div>
      <div className="w-full h-full grid grid-cols-[auto,1fr] gap-3 p-3 pt-0 overflow-hidden">
        {userId && (
          <SideNav
            playlists={state.playlists}
            selectedPlaylists={state.selectedPlaylists}
            onPlaylistToggle={handlePlaylistToggle}
            onDeletePlaylist={handleDeletePlaylist}
            onRenamePlaylist={handleRenamePlaylist}
            currentUserId={userId}
          />
        )}
        <Card className="flex flex-col w-full h-full overflow-hidden">
          <CardHeader>
            <div>Edit Playlists</div>
            <div className="pt-3 w-full">
              <Input
                type="text"
                placeholder="Search for a song or artist in your playlist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background"
              />
            </div>
          </CardHeader>
          <div className="w-full h-full flex flex-col overflow-auto">
            <div className="pl-3 sticky top-0 z-10 bg-background">
              <div className="w-full flex">
                <div
                  className="flex flex-col"
                  style={{ minWidth: `${columnWidths.song}` }}
                >
                  <h2
                    className="font-bold h-14 cursor-pointer flex flex-row items-center justify-center"
                    onClick={() => handleSort("name")}
                  >
                    Song
                    {sortConfig.key === "name" ? (
                      sortConfig.direction === "ascending" ? (
                        <ArrowUp className="ml-1 w-4 h-4" />
                      ) : (
                        <ArrowDown className="ml-1 w-4 h-4" />
                      )
                    ) : (
                      <ArrowDownUp className="ml-1 w-4 h-4 text-muted-foreground" />
                    )}
                  </h2>
                </div>
                <div
                  className="flex flex-col"
                  style={{ minWidth: `${columnWidths.artist}` }}
                >
                  <h2
                    className="font-bold h-14 cursor-pointer flex flex-row items-center justify-center"
                    onClick={() => handleSort("artist")}
                  >
                    Artist
                    {sortConfig.key === "artist" ? (
                      sortConfig.direction === "ascending" ? (
                        <ArrowUp className="ml-1 w-4 h-4" />
                      ) : (
                        <ArrowDown className="ml-1 w-4 h-4" />
                      )
                    ) : (
                      <ArrowDownUp className="ml-1 w-4 h-4 text-muted-foreground" />
                    )}
                  </h2>
                </div>
                {state.selectedPlaylists.map((playlist: Playlist) => (
                  <div
                    key={playlist.id}
                    className="flex flex-col"
                    style={{
                      minWidth: `${columnWidths.playlists[playlist.id]}`,
                    }}
                  >
                    <div
                      className="h-14 w-14 cursor-pointer flex flex-row items-center justify-center"
                      onClick={() => handleSort(playlist.id)}
                    >
                      <CustomTooltip
                        children={
                          <img
                            src={
                              playlist?.images?.[0]?.url ||
                              "https://raw.githubusercontent.com/Zayatsoff/SpotifyPlaylistManager/main/src/assets/emptyPlaylist.png"
                            }
                            alt={`${playlist?.name || "Playlist"} cover`}
                            className={`w-10 h-10 rounded-md ${
                              sortConfig.key === playlist.id
                                ? "outline outline-3 outline-accent drop-shadow-3d"
                                : "drop-shadow-3d"
                            }`}
                          />
                        }
                        description={playlist.name}
                        time={200}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ScrollArea className="w-full h-full flex flex-col overflow-auto">
              <CardContent className="w-full flex p-3">
                <div
                  className="flex flex-col"
                  style={{ minWidth: `${columnWidths.song}` }}
                >
                  <div className="flex flex-col gap-6">
                    {filteredAndSearchedTracks.map(
                      (track: Track, index: number) => (
                        <div
                          ref={(el) => {
                            if (el) songRefs.current[index] = el;
                          }}
                          key={track.id}
                        >
                          <TrackComponent
                            track={track}
                            moreThanXPlaylistsSelected={
                              moreThanXPlaylistsSelected
                            }
                            isPlaying={
                              currentTrack?.id === track.id && isPlaying
                            }
                            onPlayPreview={handlePlayPreview}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div
                  className="flex flex-col"
                  style={{ minWidth: `${columnWidths.artist}` }}
                >
                  <div className="flex flex-col gap-6">
                    {filteredAndSearchedTracks.map(
                      (track: Track, index: number) => (
                        <div
                          ref={(el) => {
                            if (el) artistRefs.current[index] = el;
                          }}
                          key={track.id}
                        >
                          <ArtistComponent
                            track={track}
                            moreThanXPlaylistsSelected={
                              moreThanXPlaylistsSelected
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
                {state.selectedPlaylists.map((playlist: Playlist) => (
                  <div
                    key={playlist.id}
                    className="flex flex-col"
                    style={{
                      minWidth: `${columnWidths.playlists[playlist.id]}`,
                    }}
                  >
                    <div className="flex flex-col gap-6">
                      {filteredAndSearchedTracks.map(
                        (track: Track, index: number) => {
                          const isInPlaylist = state.playlistTracks[
                            playlist.id
                          ]?.some((pTrack) => pTrack.id === track.id);
                          const handleToggleTrack = () => {
                            if (isInPlaylist) {
                              removeTrackFromPlaylist(
                                playlist.id,
                                `spotify:track:${track.id}`
                              ).then(() => {
                                dispatch({
                                  type: actionTypes.REMOVE_TRACK_FROM_PLAYLIST,
                                  payload: {
                                    playlistId: playlist.id,
                                    trackId: track.id,
                                  },
                                });
                              });
                            } else {
                              addTrackToPlaylist(
                                playlist.id,
                                `spotify:track:${track.id}`
                              ).then(() => {
                                dispatch({
                                  type: actionTypes.ADD_TRACK_TO_PLAYLIST,
                                  payload: {
                                    playlistId: playlist.id,
                                    track: track,
                                  },
                                });
                              });
                            }
                          };
                          return (
                            <div
                              ref={(el) => {
                                if (el) {
                                  if (!playlistRefs.current[playlist.id])
                                    playlistRefs.current[playlist.id] = [];
                                  playlistRefs.current[playlist.id][index] = el;
                                }
                              }}
                              key={track.id}
                              className="h-14 w-14 flex justify-center items-center"
                            >
                              {playlist.owner.id === userId ? (
                                <button
                                  onClick={handleToggleTrack}
                                  className=""
                                >
                                  {isInPlaylist ? (
                                    <Check className="text-primary hover:text-primary/50" />
                                  ) : (
                                    <Plus className="text-accent hover:text-accent/50" />
                                  )}
                                </button>
                              ) : (
                                <Check className="text-muted-foreground" />
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </ScrollArea>
          </div>
        </Card>
      </div>
      {currentTrack && (
        <SpotifyPreviewPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPreview={handlePlayPreview}
        />
      )}
    </div>
  );
};

export default PlaylistsPage;
