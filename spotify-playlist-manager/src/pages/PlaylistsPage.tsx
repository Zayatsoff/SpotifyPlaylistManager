import React, { useEffect, useReducer } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import SideNav from "../components/sideNav/SideNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uniqBy } from "lodash";
import { Plus, Check } from "lucide-react";
import TrackComponent from "@/components/playlists/TrackComponent";
import ArtistComponent from "@/components/playlists/ArtistComponent";
import { Track, Playlist, Artist } from "../interfaces/PlaylistInterfaces";

// Define action types
const actionTypes = {
  SET_PLAYLISTS: "SET_PLAYLISTS",
  TOGGLE_PLAYLIST_SELECTION: "TOGGLE_PLAYLIST_SELECTION",
  SET_TRACKS: "SET_TRACKS",
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
    default:
      return state;
  }
};

const PlaylistsPage: React.FC = () => {
  const { token } = useSpotifyAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

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
      dispatch({ type: actionTypes.SET_PLAYLISTS, payload: data.items });
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

  return (
    <div className="w-screen h-screen grid grid-cols-[auto,1fr] gap-3 overflow-hidden bg-background">
      <SideNav
        playlists={state.playlists}
        selectedPlaylists={state.selectedPlaylists}
        onPlaylistToggle={handlePlaylistToggle}
      />
      <Card className="flex-1 overflow-hidden">
        <CardHeader>Edit Playlists</CardHeader>
        <CardContent className="flex overflow-auto">
          {/* Songs Column */}
          <div className="flex flex-col p-3">
            <h2 className="font-bold">Song</h2>
            <div className="flex flex-col gap-6">
              {allTracks.map((track: Track) => (
                <TrackComponent key={track.id} track={track} />
              ))}
            </div>
          </div>
          {/* Artists Column */}
          <div className="flex flex-col p-3">
            <h2 className="font-bold">Artist</h2>
            <div className="flex flex-col gap-6">
              {allTracks.map((track: Track) => (
                <ArtistComponent key={track.id} track={track} />
              ))}
            </div>
          </div>

          {/* Playlists Columns */}
          {state.selectedPlaylists.map((playlist: Playlist) => (
            <div key={playlist.id} className="flex flex-col p-3 w-42">
              <h2 className="font-bold">{playlist.name}</h2>
              <div className="flex flex-col gap-6">
                {allTracks.map((track: Track) => {
                  const isInPlaylist = !!state.playlistTracks[
                    playlist.id
                  ]?.find((pTrack: Track) => pTrack.id === track.id);
                  return (
                    <div key={track.id} className="p-1 h-14 flex items-center">
                      {isInPlaylist ? (
                        <span className="text-green-500">
                          <Check />
                        </span>
                      ) : (
                        <span className="text-blue-500">
                          <Plus />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaylistsPage;
