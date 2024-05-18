import React, { useEffect, useReducer, useState } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import TrackComponent from "@/components/playlists/TrackComponent";
import ArtistComponent from "@/components/playlists/ArtistComponent";
import { Track, Playlist } from "../interfaces/PlaylistInterfaces";
import SideNav from "@/components/nav/SideNav";
import TopNav from "@/components/nav/TopNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uniqBy } from "lodash";
import { Plus, Check } from "lucide-react";
import { truncateText } from "@/utils/textHelpers";
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

// Define action types
const actionTypes = {
  SET_PLAYLISTS: "SET_PLAYLISTS",
  TOGGLE_PLAYLIST_SELECTION: "TOGGLE_PLAYLIST_SELECTION",
  SET_TRACKS: "SET_TRACKS",
  ADD_TRACK_TO_PLAYLIST: "ADD_TRACK_TO_PLAYLIST",
  REMOVE_TRACK_FROM_PLAYLIST: "REMOVE_TRACK_FROM_PLAYLIST",
};
// Define the initial state with the correct types
const initialState = {
  playlists: [],
  selectedPlaylists: [],
  playlistTracks: {},
};

interface State {
  playlists: Playlist[];
  selectedPlaylists: Playlist[];
  playlistTracks: Record<string, Track[]>;
}

interface Action {
  type: string;
  payload: any;
}

// Reducer function to manage state
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

    default:
      return state;
  }
};

const PlaylistsPage: React.FC = () => {
  const { token } = useSpotifyAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchQuery, setSearchQuery] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useErrorHandling(setShowErrorPopup);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!token) return;

      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();

      const playlistsResponse = await fetch(
        `https://api.spotify.com/v1/users/${userData.id}/playlists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await playlistsResponse.json();

      // Filter to only include playlists where the current user is the owner
      const userOwnedPlaylists = data.items.filter(
        (playlist: { owner: { id: any } }) => playlist.owner.id === userData.id
      );

      dispatch({
        type: actionTypes.SET_PLAYLISTS,
        payload: userOwnedPlaylists,
      });
    };

    fetchPlaylists();
  }, [token]);

  useEffect(() => {
    state.selectedPlaylists.forEach((playlist) => {
      if (!state.playlistTracks[playlist.id]) {
        const fetchTracks = async () => {
          const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await response.json();
          const tracks = data.items.map((item: any) => ({
            // Ensure type safety by replacing 'any' with a more specific type
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map((artist: any) => ({
              name: artist.name,
            })),
            albumImage: item.track.album.images[0]?.url || "",
          }));
          dispatch({
            type: actionTypes.SET_TRACKS,
            payload: { id: playlist.id, tracks },
          });
        };
        fetchTracks();
      }
    });
  }, [state.selectedPlaylists, token]);

  const handlePlaylistToggle = (playlist: Playlist): void => {
    dispatch({
      type: actionTypes.TOGGLE_PLAYLIST_SELECTION,
      payload: playlist,
    });
  };

  const allTracks = uniqBy(
    state.selectedPlaylists.flatMap(
      (playlist) => state.playlistTracks[playlist.id] || []
    ),
    (track: Track) => track.id
  );
  const filteredTracks = allTracks.filter(
    (track) =>
      track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artists.some((artist) =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const addTrackToPlaylist = async (playlistId: string, trackUri: string) => {
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
  };
  const moreThanXPlaylistsSelected = state.selectedPlaylists.length > 8;
  const removeTrackFromPlaylist = async (
    playlistId: string,
    trackUri: string
  ) => {
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
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-background grid auto-rows-12">
      {/* Error Popup Dialog */}
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
      <div className="w-full h-full row-span-1">
        <TopNav />
      </div>
      <div className="w-full h-full row-span-11 grid grid-cols-[auto,1fr] gap-3 p-3 pt-0 overflow-hidden">
        <SideNav
          playlists={state.playlists}
          selectedPlaylists={state.selectedPlaylists}
          onPlaylistToggle={handlePlaylistToggle}
        />

        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <div>Edit Playlists</div>
            <div className="py-3 w-4/5 ">
              <Input
                type="text"
                placeholder="Search for a song or artist in your playlist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background"
              />
            </div>
          </CardHeader>
          <ScrollArea className="w-full h-full">
            <CardContent className="flex overflow-auto">
              {/* Songs Column */}
              <div className="flex flex-col p-3">
                <h2 className="font-bold h-14">Song</h2>
                <div className="flex flex-col gap-6">
                  {filteredTracks.map((track: Track) => (
                    <TrackComponent
                      key={track.id}
                      track={track}
                      moreThanXPlaylistsSelected={moreThanXPlaylistsSelected}
                    />
                  ))}
                </div>
              </div>
              {/* Artists Column */}
              <div className="flex flex-col p-3">
                <h2 className="font-bold h-14">Artist</h2>
                <div className="flex flex-col gap-6">
                  {filteredTracks.map((track: Track) => (
                    <ArtistComponent
                      key={track.id}
                      track={track}
                      moreThanXPlaylistsSelected={moreThanXPlaylistsSelected}
                    />
                  ))}
                </div>
              </div>
              {/* Playlists Columns */}
              {state.selectedPlaylists.map((playlist: Playlist) => (
                <div key={playlist.id} className="flex flex-col p-3 w-42 ">
                  <h2 className="font-bold h-14">
                    <CustomTooltip
                      children={truncateText(playlist.name, 20)}
                      description={playlist.name}
                      time={300}
                    />
                  </h2>
                  <div className="flex flex-col gap-6">
                    {filteredTracks.map((track: Track) => {
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
                          key={track.id}
                          className="p-1 h-14 flex justify-center "
                        >
                          <button onClick={handleToggleTrack} className="">
                            {isInPlaylist ? (
                              <Check className="text-primary hover:text-primary/50" />
                            ) : (
                              <Plus className="text-accent hover:text-accent/50" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default PlaylistsPage;
