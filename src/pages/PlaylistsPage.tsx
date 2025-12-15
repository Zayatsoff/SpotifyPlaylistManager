import React, {
  useEffect,
  useReducer,
  useState,
  useCallback,
  useMemo,
  useRef,
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
import { uniqBy } from "lodash";
import { Plus, Check, ChevronDown, Undo2, Loader2, ListPlus, AlertTriangle, BarChart3 } from "lucide-react";
import CustomTooltip from "@/components/ui/CustomTooltip";
import { Input } from "@/components/ui/input";
import useErrorHandling from "@/hooks/useErrorHandling";
import SpotifyPreviewPlayer, { SpotifyPreviewPlayerHandle } from "@/components/playlists/SpotifyPreviewPlayerComponent";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useDevModeDialog } from "@/components/ui/DevModeDialogProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import emptyState from "@/assets/emptyPlaylist.png";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CommandPalette, Command } from "@/components/ui/command-palette";
import { DEV_PLAYLISTS, DEV_TRACKS_BY_PLAYLIST } from "@/utils/devSampleData";

// Define action types and initial state outside of the component
const actionTypes = {
  SET_PLAYLISTS: "SET_PLAYLISTS",
  TOGGLE_PLAYLIST_SELECTION: "TOGGLE_PLAYLIST_SELECTION",
  SET_TRACKS: "SET_TRACKS",
  ADD_TRACK_TO_PLAYLIST: "ADD_TRACK_TO_PLAYLIST",
  REMOVE_TRACK_FROM_PLAYLIST: "REMOVE_TRACK_FROM_PLAYLIST",
  DELETE_PLAYLIST: "DELETE_PLAYLIST",
  RENAME_PLAYLIST: "RENAME_PLAYLIST",
  RESET_STATE: "RESET_STATE",
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
      console.log("Reducer: TOGGLE_PLAYLIST_SELECTION", {
        toggledId: (action.payload as any)?.id,
        beforeSelected: state.selectedPlaylists.map((p: any) => p.id),
      });
      const index = state.selectedPlaylists.findIndex(
        (p: Playlist) => p.id === action.payload.id
      );
      const nextSelected =
        index === -1
          ? [...state.selectedPlaylists, action.payload]
          : state.selectedPlaylists.filter((p: Playlist) => p.id !== action.payload.id);
      const next = {
        ...state,
        selectedPlaylists: nextSelected,
      };
      console.log("Reducer: selection result", {
        afterSelected: next.selectedPlaylists.map((p: any) => p.id),
      });
      return next;
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
    case actionTypes.RENAME_PLAYLIST:
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.payload.id
            ? { ...p, name: action.payload.newName }
            : p
        ),
      };
    case actionTypes.RESET_STATE:
      console.log("Reducer: RESET_STATE - clearing all selections and tracks");
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

const PlaylistsPage: React.FC = () => {
  const { token, userId, setToken } = useSpotifyAuth(); // Assuming userId is available here
  const [state, dispatch] = useReducer(reducer, initialState);
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"selected" | "spotify">("selected");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string | null;
  }>({ key: "", direction: null });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [columnWidths, setColumnWidths] = useState<{
    song: string;
    artist: string;
    playlists: { [key: string]: string };
  }>(() => {
    const savedSong = localStorage.getItem("colWidth_song");
    const savedArtist = localStorage.getItem("colWidth_artist");
    return {
      song: savedSong || "20rem",
      artist: savedArtist || "14rem",
      playlists: {},
    };
  });
  const [history, setHistory] = useState<string[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [loadingTracksMap, setLoadingTracksMap] = useState<Record<string, boolean>>({});
  const [undoStack, setUndoStack] = useState<
    { type: "add" | "remove"; playlistId: string; track: Track }[]
  >([]);
  const [rowDensity, setRowDensity] = useState<"comfortable" | "compact">("comfortable");
  const [listScrolled, setListScrolled] = useState<boolean>(false);
  const [addSearchResults, setAddSearchResults] = useState<Track[]>([]);
  const [isSearchingNew, setIsSearchingNew] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  // If we've already shown the dev-mode modal anywhere, apply sample data immediately
  useEffect(() => {
    const DEV_SAMPLE_APPLIED_KEY = "devSampleApplied";
    const devModalShown = !!sessionStorage.getItem("notifiedSpotifyDevMode403");
    const alreadyApplied = !!sessionStorage.getItem(DEV_SAMPLE_APPLIED_KEY);
    if (devModalShown && !alreadyApplied) {
      dispatch({ type: actionTypes.SET_PLAYLISTS, payload: DEV_PLAYLISTS });
      DEV_PLAYLISTS.forEach((p) =>
        dispatch({ type: actionTypes.TOGGLE_PLAYLIST_SELECTION, payload: p })
      );
      sessionStorage.setItem(DEV_SAMPLE_APPLIED_KEY, "1");
      setIsDevMode(true);
    }
  }, []);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const { showDevMode403 } = useDevModeDialog();
  const isLoadingAnyTracks = useMemo(() => Object.values(loadingTracksMap).some(Boolean), [loadingTracksMap]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const previewPlayerRef = useRef<SpotifyPreviewPlayerHandle | null>(null);

  const notifyDevMode403 = useCallback(() => {
    // Always show the modal so users see the dev-mode notice even with cached sessions
    showDevMode403();
  }, [showDevMode403]);

  useErrorHandling(setShowErrorPopup);

  const addToHistory = (action: string) => {
    setHistory((prevHistory) => [action, ...prevHistory]);
  };

  const applyDevSample = useCallback((showModal: boolean = false) => {
    const DEV_SAMPLE_APPLIED_KEY = "devSampleApplied";
    try {
      sessionStorage.setItem("cachedPlaylists", JSON.stringify(DEV_PLAYLISTS));
    } catch (e) {
      // ignore
    }
    dispatch({ type: actionTypes.SET_PLAYLISTS, payload: DEV_PLAYLISTS });
    if (!sessionStorage.getItem(DEV_SAMPLE_APPLIED_KEY)) {
      DEV_PLAYLISTS.forEach((p) =>
        dispatch({ type: actionTypes.TOGGLE_PLAYLIST_SELECTION, payload: p })
      );
      sessionStorage.setItem(DEV_SAMPLE_APPLIED_KEY, "1");
    }
    // Overwrite per-playlist cached tracks with local-cover dataset so UI never reads stale remote images
    try {
      DEV_PLAYLISTS.forEach((p) => {
        const tracks = DEV_TRACKS_BY_PLAYLIST[p.id] || [];
        sessionStorage.setItem(`cachedTracks_${p.id}`, JSON.stringify(tracks));
      });
    } catch (_) {}
    // Only show the dev-mode modal when explicitly requested (e.g., after API 403)
    // Don't show during initial load race condition where token hasn't loaded yet
    if (showModal) {
      try {
        notifyDevMode403();
      } catch (_) {}
    }
    setIsDevMode(true);
  }, []);

  const fetchPlaylists = async () => {
    console.log("📋 fetchPlaylists called, token:", token ? `${token.substring(0, 20)}...` : "null");
    
    if (!token) {
      console.log("⚠️ No token, showing demo mode");
      setIsLoadingPlaylists(true);
      applyDevSample();
      setIsLoadingPlaylists(false);
      return;
    }

    // Clear any devSampleApplied flag and cached dev data since we now have a valid token
    // This handles the race condition where demo mode was set before token loaded
    if (sessionStorage.getItem("devSampleApplied")) {
      console.log("🔄 Token now available, clearing dev mode data and fetching real playlists");
      sessionStorage.removeItem("devSampleApplied");
      sessionStorage.removeItem("cachedPlaylists"); // Clear cached dev playlists
      // Clear any cached dev tracks
      DEV_PLAYLISTS.forEach((p) => {
        sessionStorage.removeItem(`cachedTracks_${p.id}`);
      });
      setIsDevMode(false);
      // Reset component state to clear dev playlists and selections
      dispatch({ type: actionTypes.RESET_STATE, payload: null });
    }

    const cachedPlaylists = sessionStorage.getItem("cachedPlaylists");
    if (cachedPlaylists) {
      try {
        const parsed = JSON.parse(cachedPlaylists);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: actionTypes.SET_PLAYLISTS, payload: parsed });
          return;
        }
      } catch (_) {}
      // Empty or invalid cache → ignore and proceed
    }

    let allPlaylists: any[] = [];
    let url = `https://api.spotify.com/v1/me/playlists`;
    let next = true;

    try {
      setIsLoadingPlaylists(true);
      let blocked = false;
      while (next) {
        const playlistsResponse = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (playlistsResponse.status === 403) {
          notifyDevMode403();
          blocked = true;
          break;
        }
        if (playlistsResponse.status === 401) {
          // Invalid token - clear it
          console.error("Token is invalid (401), clearing auth state");
          setToken(null);
          blocked = true;
          break;
        }
        if (!playlistsResponse.ok) {
          // Treat any other non-OK as blocked for demo purposes
          blocked = true;
          break;
        }
        const data = await playlistsResponse.json();
        allPlaylists = [...allPlaylists, ...data.items];
        if (data.next) {
          url = data.next;
        } else {
          next = false;
        }
      }
      if (blocked) {
        applyDevSample();
        return;
      }
      if (allPlaylists.length === 0) {
        // Nothing returned; show sample
        applyDevSample();
        return;
      }
      sessionStorage.setItem("cachedPlaylists", JSON.stringify(allPlaylists));

      dispatch({
        type: actionTypes.SET_PLAYLISTS,
        payload: allPlaylists,
      });
    } catch (error) {
      console.error("Failed to fetch playlists", error);
      // Fallback to dev sample on any fetch error
      applyDevSample();
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [token]);

  const fetchAllTracks = async (playlistId: string) => {
    let allTracks: Track[] = [];
    let offset = 0;
    const limit = 100;

    try {
      // Use dev sample tracks immediately if available
      if (DEV_TRACKS_BY_PLAYLIST[playlistId]) {
        return DEV_TRACKS_BY_PLAYLIST[playlistId];
      }
      console.log("Tracks: fetch start", { playlistId });
      while (true) {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&market=from_token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status === 403) {
          notifyDevMode403();
          // Use dev sample tracks for this playlist if available
          const devTracks = DEV_TRACKS_BY_PLAYLIST[playlistId];
          if (devTracks) {
            allTracks = devTracks;
          }
          break;
        }
        if (response.status === 401) {
          console.error("Token is invalid (401), clearing auth state");
          setToken(null);
          break;
        }
        const data = await response.json();
        if (!response.ok) {
          console.error("Spotify tracks API error", { playlistId, status: response.status, data });
          break;
        }

        const tracks = data.items.map((item: any) => {
          const track = {
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map((artist: any) => ({
              name: artist.name,
            })),
            albumImage: item.track.album.images[0]?.url || "",
            previewUrl: item.track.preview_url || "",
          };
          
          // Log tracks without preview URLs for debugging
          if (!item.track.preview_url) {
            console.warn(`Track "${track.name}" has no preview_url from Spotify API`, {
              trackId: track.id,
              available_markets: item.track.available_markets?.length || 0,
              is_playable: item.track.is_playable
            });
          }
          
          return track;
        });

        allTracks = [...allTracks, ...tracks];

        if (data.items.length < limit) break;
        offset += limit;
      }
      console.log("Tracks: fetch complete", { playlistId, count: allTracks.length });
    } catch (error) {
      console.error("Failed to fetch tracks", error);
    }

    return allTracks;
  };

  useEffect(() => {
    console.log("Selected playlists changed", {
      selectedIds: state.selectedPlaylists.map((p) => p.id),
    });
    const fetchTracks = async (playlistId: string) => {
      const cacheKey = `cachedTracks_${playlistId}`;
      const cachedTracks = sessionStorage.getItem(cacheKey);
      if (cachedTracks) {
        const parsed = JSON.parse(cachedTracks);
        console.log("Tracks: cache hit", { playlistId, cacheKey, count: parsed.length });
        // If cache exists but is empty, try a fresh fetch once
        if (Array.isArray(parsed) && parsed.length === 0) {
          console.warn("Tracks: empty cache detected; refetching", { playlistId });
        } else {
          dispatch({
            type: actionTypes.SET_TRACKS,
            payload: { id: playlistId, tracks: parsed },
          });
          return;
        }
      }

      setLoadingTracksMap((prev) => ({ ...prev, [playlistId]: true }));
      console.time(`load-tracks-${playlistId}`);
      const tracks = await fetchAllTracks(playlistId);
      console.timeEnd(`load-tracks-${playlistId}`);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(tracks));
      } catch (e) {
        console.warn("Tracks: failed to write cache", { cacheKey, error: e });
      }
      dispatch({
        type: actionTypes.SET_TRACKS,
        payload: { id: playlistId, tracks },
      });
      setLoadingTracksMap((prev) => ({ ...prev, [playlistId]: false }));
    };

    state.selectedPlaylists.forEach((playlist) => {
      if (!state.playlistTracks[playlist.id]) {
        console.log("Tracks: loading for newly selected playlist", { playlistId: playlist.id });
        fetchTracks(playlist.id);
      } else {
        console.log("Tracks: already loaded for playlist", { playlistId: playlist.id, count: state.playlistTracks[playlist.id]?.length || 0 });
      }
    });
  }, [state.selectedPlaylists, token]);

  const handlePlayPreview = useCallback(
    async (track: Track) => {
      // Handle pause/resume for same track
      if (currentTrack && currentTrack.id === track.id) {
        const next = !isPlaying;
        setIsPlaying(next);
        if (next) {
          try {
            await previewPlayerRef.current?.playFromClick(track);
          } catch (error) {
            console.error('Failed to resume playback:', error);
            setIsPlaying(false);
          }
        } else {
          previewPlayerRef.current?.pause();
        }
        return;
      }

      // For new track, set it and try to play
      // The SpotifyPreviewPlayer component will handle:
      // 1. Web Playback SDK (uses track.id, doesn't need preview URL) - Premium users
      // 2. HTML5 audio fallback (uses track.previewUrl from Spotify API) - All users
      
      setCurrentTrack(track);
      setIsPlaying(true);
      
      try {
        await previewPlayerRef.current?.playFromClick(track);
      } catch (error: any) {
        console.error('Playback failed:', error);
        setIsPlaying(false);
        
        if (error?.message === 'NO_PREVIEW_URL') {
          showToast({
            title: "Preview not available",
            description: `"${track.name}" doesn't have a preview URL from Spotify. Try playing full tracks with Spotify Premium!`,
            variant: "info",
            duration: 5000,
          });
        } else {
          showToast({
            title: "Playback failed",
            description: `Unable to play "${track.name}". Check console for details.`,
            variant: "info",
            duration: 3000,
          });
        }
      }
    },
    [currentTrack, isPlaying, showToast]
  );

  const allTracks = useMemo(() => {
    return uniqBy(
      state.selectedPlaylists.flatMap(
        (playlist) => state.playlistTracks[playlist.id] || []
      ),
      (track: Track) => track.id
    );
  }, [state.selectedPlaylists, state.playlistTracks]);

  // Debug helper - expose in dev mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).debugSpotify = {
        clearTracksCache: () => {
          const keys = Object.keys(sessionStorage);
          const trackKeys = keys.filter(k => k.startsWith('cachedTracks_'));
          trackKeys.forEach(key => sessionStorage.removeItem(key));
          console.log(`Cleared ${trackKeys.length} cached playlists. Refresh the page to reload tracks.`);
        },
        checkTrack: (trackName: string) => {
          const track = allTracks.find(t => t.name.toLowerCase().includes(trackName.toLowerCase()));
          if (track) {
            console.log('Track details:', track);
          } else {
            console.log('Track not found in loaded playlists');
          }
        }
      };
      console.log('🔧 Debug commands available:\n  - window.debugSpotify.clearTracksCache()\n  - window.debugSpotify.checkTrack("song name")');
    }
  }, [allTracks]);

  // Unified search: spotify scope triggers remote search
  useEffect(() => {
    let aborted = false;
    const search = async () => {
      if (!token) return;
      const q = query.trim();
      if (searchScope !== "spotify") return;
      if (q.length < 3) {
        setAddSearchResults([]);
        return;
      }
      try {
        setIsSearchingNew(true);
        const resp = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=50&market=from_token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resp.status === 403) {
          notifyDevMode403();
          setAddSearchResults([]);
          return;
        }
        if (resp.status === 401) {
          console.error("Token is invalid (401), clearing auth state");
          setToken(null);
          setAddSearchResults([]);
          return;
        }
        const data = await resp.json();
        const results: Track[] = (data.tracks?.items || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          artists: t.artists?.map((a: any) => ({ name: a.name })) || [],
          albumImage: t.album?.images?.[0]?.url || "",
          previewUrl: t.preview_url || "",
        }));
        if (!aborted) setAddSearchResults(results);
      } catch (e) {
        console.error("Failed to search tracks", e);
      } finally {
        if (!aborted) setIsSearchingNew(false);
      }
    };
    const id = window.setTimeout(search, 250);
    return () => {
      aborted = true;
      window.clearTimeout(id);
    };
  }, [query, token, searchScope]);

  const handlePlaylistToggle = useCallback((playlist: Playlist): void => {
    console.log("UI: onPlaylistToggle", {
      playlist: { id: playlist.id, name: playlist.name },
    });
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
        type: actionTypes.RENAME_PLAYLIST,
        payload: { id: playlistId, newName },
      });
      addToHistory(`Renamed playlist with ID ${playlistId} to "${newName}"`);
    } catch (error) {
      console.error("Failed to rename playlist", error);
    }
  };

  const handleDuplicatePlaylist = async (playlist: Playlist) => {
    try {
      if (!userId || !token) return;
      // Create a new playlist
      const createResp = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${playlist.name} (Copy)`, public: false }),
      });
      const created = await createResp.json();
      const newId = created.id as string;
      // Fetch all tracks from original
      const originalTracks = await fetchAllTracks(playlist.id);
      const uris = originalTracks.map((t) => `spotify:track:${t.id}`);
      for (const part of chunk(uris, 100)) {
        await fetch(`https://api.spotify.com/v1/playlists/${newId}/tracks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ uris: part }),
        });
      }
      await fetchPlaylists();
      addToHistory(`Duplicated playlist "${playlist.name}"`);
    } catch (e) {
      console.error("Failed to duplicate playlist", e);
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
      addToHistory(`Deleted playlist with ID ${playlistId}`);
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

  const selectedScopedTracks = useMemo(
    () =>
      filteredTracks.filter(
        (track) =>
          track.name.toLowerCase().includes(query.toLowerCase()) ||
          track.artists.some((artist) =>
            artist.name.toLowerCase().includes(query.toLowerCase())
          )
      ),
    [filteredTracks, query]
  );

  const tracksToRender = useMemo(() => {
    return searchScope === "spotify" ? addSearchResults : selectedScopedTracks;
  }, [searchScope, addSearchResults, selectedScopedTracks]);

  const addTrackToPlaylist = async (playlistId: string, trackUri: string) => {
    try {
      if (isDevMode) {
        // No-op in dev mode; state/session are updated elsewhere
        return { ok: true } as any;
      }
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

  

  const removeTrackFromPlaylist = async (
    playlistId: string,
    trackUri: string
  ) => {
    try {
      if (isDevMode) {
        // No-op in dev mode; state/session are updated elsewhere
        return { ok: true } as any;
      }
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

  const handleUndo = async () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    try {
      if (last.type === "add") {
        await removeTrackFromPlaylist(last.playlistId, `spotify:track:${last.track.id}`);
        dispatch({
          type: actionTypes.REMOVE_TRACK_FROM_PLAYLIST,
          payload: { playlistId: last.playlistId, trackId: last.track.id },
        });
      } else {
        await addTrackToPlaylist(last.playlistId, `spotify:track:${last.track.id}`);
        dispatch({
          type: actionTypes.ADD_TRACK_TO_PLAYLIST,
          payload: { playlistId: last.playlistId, track: last.track },
        });
      }
      addToHistory(`Undid ${last.type} of "${last.track.name}"`);
      showToast({
        title: "Undone",
        description: `Reverted ${last.type} of ${last.track.name}.`,
        variant: "success",
        duration: 2500,
      });
    } catch (e) {
      console.error("Failed to undo action", e);
    } finally {
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const handleCombineSelectedPlaylists = async () => {
    if (!token || !userId) return;
    const name = window.prompt("Name for combined playlist:", "Combined Playlist");
    if (!name) return;
    try {
      // Create new playlist
      const createResp = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, public: false }),
      });
      const created = await createResp.json();
      const playlistId = created.id as string;
      // Collect unique uris
      const uris = uniqBy(allTracks, (t) => t.id).map((t) => `spotify:track:${t.id}`);
      for (const part of chunk(uris, 100)) {
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ uris: part }),
        });
      }
      // Refresh playlists list
      await fetchPlaylists();
      addToHistory(`Combined ${state.selectedPlaylists.length} playlists into "${name}"`);
    } catch (e) {
      console.error("Failed to combine playlists", e);
    }
  };

  const songRefs = useRef<(HTMLDivElement | null)[]>([]);
  const artistRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    songRefs.current = [];
    artistRefs.current = [];
  }, [state.selectedPlaylists, tracksToRender]);

  useEffect(() => {
    if (columnWidths.song) localStorage.setItem("colWidth_song", columnWidths.song);
    if (columnWidths.artist) localStorage.setItem("colWidth_artist", columnWidths.artist);
  }, [columnWidths.song, columnWidths.artist]);

  const handleSort = (key: keyof Track | "artist" | "playlist" | string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const parseWidthPx = (value: string): number => {
    if (value.endsWith("rem")) return parseFloat(value) * 16;
    if (value.endsWith("px")) return parseFloat(value);
    return parseFloat(value) || 0;
  };

  const startResize = (column: "song" | "artist") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = (e as React.MouseEvent).clientX;
    const initial = column === "song" ? parseWidthPx(columnWidths.song) : parseWidthPx(columnWidths.artist);
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.min(560, Math.max(200, initial + delta));
      setColumnWidths((w) => ({ ...w, [column]: `${Math.round(next)}px` }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
    };
    window.addEventListener("mousemove", onMove as any);
    window.addEventListener("mouseup", onUp as any);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo]);

  const commands: Command[] = useMemo(() => {
    return [
      { id: "focus-search", label: "Focus search", hint: "Search bar", run: () => searchInputRef.current?.focus() },
      { id: "toggle-density", label: rowDensity === "compact" ? "Set density: Comfortable" : "Set density: Compact", run: () => setRowDensity((d) => (d === "compact" ? "comfortable" : "compact")) },
      { id: "toggle-stats", label: showStats ? "Hide stats" : "Show stats", run: () => setShowStats((s) => !s) },
      ...state.playlists.slice(0, 20).map((p) => ({ id: `jump-${p.id}`, label: `Jump to playlist: ${p.name}`, run: () => {
        const el = document.querySelector(`[data-playlist-id="${p.id}"]`)
        if (el) el.scrollIntoView({ behavior: "smooth" })
      }})),
    ]
  }, [rowDensity, showStats, state.playlists])

  return (
    <div className="w-screen h-screen overflow-hidden bg-background flex flex-col">
      {showErrorPopup && (
        <div className="w-full bg-warning/10 border-b border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))] px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Spotify API blocked. Privacy extension may be blocking api.spotify.com.</span>
          <a
            href="https://www.spotify.com/ca-en/account/recover-playlists/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs underline"
          >
            Fix
          </a>
        </div>
      )}
      <div className="w-full h-full flex-1">
        <TopNav history={history} onOpenCommand={() => setIsCommandOpen(true)} onToggleRail={() => setRailOpen((s) => !s)} />
      </div>
      <div className={"w-full h-full gap-3 p-3 pt-0 overflow-hidden grid " + (railOpen ? "grid-cols-[auto,1fr]" : "grid-cols-1") }>
        {railOpen && (userId || isDevMode) && (
          <SideNav
            playlists={state.playlists}
            selectedPlaylists={state.selectedPlaylists}
            onPlaylistToggle={handlePlaylistToggle}
            onDeletePlaylist={handleDeletePlaylist}
            onRenamePlaylist={handleRenamePlaylist}
            currentUserId={userId || 'spotify'}
            onDuplicatePlaylist={handleDuplicatePlaylist}
            isLoading={isLoadingPlaylists}
            devMode={isDevMode}
          />
        )}
        <Card className="flex flex-col w-full h-full overflow-hidden">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-base font-semibold shrink-0">Edit Playlists</div>
                <div className="hidden md:flex flex-wrap gap-1 max-w-[40rem]">
                  {state.selectedPlaylists.map((p) => (
                    <Chip
                      key={p.id}
                      imageSrc={p.images?.[0]?.url}
                      label={p.name}
                      onRemove={() => handlePlaylistToggle(p)}
                    />
                  ))}
                </div>
                {isLoadingPlaylists && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading playlists...
                  </div>
                )}
                {Object.values(loadingTracksMap).some(Boolean) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading tracks...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CustomTooltip description="Merge selected playlists" time={300}>
                  <Button size="sm" variant="secondary" className="hidden md:inline-flex" onClick={async () => {
                    await handleCombineSelectedPlaylists();
                    showToast({ title: "Merged into new playlist", variant: "success", duration: 2500 });
                  }} disabled={state.selectedPlaylists.length === 0} aria-label="Merge into target">
                    <ListPlus className="w-4 h-4 mr-2" /> Merge into target
                  </Button>
                </CustomTooltip>
                <Button size="icon" variant="ghost" className="md:hidden" onClick={async () => {
                  await handleCombineSelectedPlaylists();
                  showToast({ title: "Merged into new playlist", variant: "success", duration: 2500 });
                }} aria-label="Merge into target">
                  <ListPlus className="w-4 h-4" />
                </Button>
                <CustomTooltip description="Undo (Cmd/Ctrl+Z)" time={300}>
                  <Button size="sm" variant="secondary" className="hidden md:inline-flex" onClick={handleUndo} disabled={undoStack.length === 0} aria-label="Undo last action">
                    <Undo2 className="w-4 h-4 mr-2" /> Undo
                  </Button>
                </CustomTooltip>
                <Button size="icon" variant="ghost" className="md:hidden" onClick={handleUndo} disabled={undoStack.length === 0} aria-label="Undo last action">
                  <Undo2 className="w-4 h-4" />
                </Button>
                <CustomTooltip description="Playlist stats" time={300}>
                  <Button size="icon" variant="ghost" onClick={() => setShowStats(true)} aria-label="Playlist stats">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </CustomTooltip>
              </div>
            </div>
            <div className="pt-2 w-full grid grid-cols-1 gap-2 md:grid-cols-[1fr,auto,auto] items-center">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchScope === "spotify" ? "Search songs and artists… (All Spotify) — Cmd/Ctrl+K" : "Search songs and artists… (In selected) — Cmd/Ctrl+K"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-background pr-8"
                  aria-label="Search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
                {searchScope === "spotify" && (
                  <div className="absolute -bottom-5 left-1">
                    <Badge variant="info" size="sm">Search all of Spotify</Badge>
                  </div>
                )}
              </div>
              <Tabs value={searchScope} onValueChange={(v) => setSearchScope(v as any)}>
                <TabsList>
                  <TabsTrigger value="selected" aria-pressed={searchScope === "selected"}>In selected</TabsTrigger>
                  <TabsTrigger value="spotify" aria-pressed={searchScope === "spotify"}>All Spotify</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {isSearchingNew ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                  </>
                ) : (
                  <span>{tracksToRender.length} loaded</span>
                )}
                <Tabs value={rowDensity} onValueChange={(v) => setRowDensity(v as any)}>
                  <TabsList>
                    <TabsTrigger value="comfortable" aria-label="Comfortable density">Comfort</TabsTrigger>
                    <TabsTrigger value="compact" aria-label="Compact density">Compact</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <div className="w-full h-full flex flex-col overflow-auto">
            <Sheet open={showStats} onOpenChange={setShowStats}>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Stats</SheetTitle>
                </SheetHeader>
                <div className="p-2 text-sm text-foreground/80">
                  <StatsPanel tracks={allTracks} selectedPlaylists={state.selectedPlaylists} />
                </div>
              </SheetContent>
            </Sheet>
            {/* Settings panel removed; density toggle lives in header */}
            {/* Stats moved to right sheet */}
            <div className={"sticky top-0 z-10 bg-background border-t border-border/50 " + (listScrolled ? "shadow-sm" : "") }>
              <div className="w-full flex overflow-x-auto px-3">
                <div
                  className="flex flex-col relative select-none"
                  style={{ minWidth: `${columnWidths.song}` }}
                >
                  <h2
                    className="font-semibold h-12 cursor-pointer flex flex-row items-center justify-center"
                    onClick={() => handleSort("name")}
                  >
                    Song
                    <ChevronDown
                      className={
                        "ml-1 w-4 h-4 transition-transform " +
                        (sortConfig.key === "name"
                          ? sortConfig.direction === "ascending"
                            ? "rotate-180 text-foreground"
                            : "text-foreground"
                          : "opacity-50 text-muted-foreground")
                      }
                    />
                  </h2>
                  <span
                    onMouseDown={startResize("song")}
                    role="separator"
                    aria-label="Resize Song column"
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-accent/20"
                  />
                </div>
                <div
                  className="flex flex-col relative select-none"
                  style={{ minWidth: `${columnWidths.artist}` }}
                >
                  <h2
                    className="font-semibold h-12 cursor-pointer flex flex-row items-center justify-center"
                    onClick={() => handleSort("artist")}
                  >
                    Artist
                    <ChevronDown
                      className={
                        "ml-1 w-4 h-4 transition-transform " +
                        (sortConfig.key === "artist"
                          ? sortConfig.direction === "ascending"
                            ? "rotate-180 text-foreground"
                            : "text-foreground"
                          : "opacity-50 text-muted-foreground")
                      }
                    />
                  </h2>
                  <span
                    onMouseDown={startResize("artist")}
                    role="separator"
                    aria-label="Resize Artist column"
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-accent/20"
                  />
                </div>
                {state.selectedPlaylists.map((playlist: Playlist) => (
                  <div
                    key={playlist.id}
                    className="w-12 h-12 cursor-pointer flex items-center justify-center"
                    style={{ minWidth: '48px' }}
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
                              ? "outline outline-3 outline-accent"
                              : ""
                          }`}
                        />
                      }
                      description={playlist.name}
                      time={200}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Virtualized list with empty state */}
            <CardContent className="w-full p-3">
              {isLoadingAnyTracks ? (
                <TrackRowsSkeleton rows={10} />
              ) : tracksToRender.length === 0 ? (
                <div className="w-full h-56 flex flex-col items-center justify-center text-muted-foreground">
                  <img src={emptyState} alt="Empty" className="w-16 h-16 opacity-70 mb-3" />
                  <div className="text-sm mb-2">
                    {state.selectedPlaylists.length === 0
                      ? "Pick a playlist to get started."
                      : query
                      ? "No results. Try a different query."
                      : "No tracks to display."}
                  </div>
                  <Button onClick={() => {
                    document.querySelector("[data-left-rail]")?.scrollIntoView({ behavior: "smooth" });
                  }} variant="secondary">Pick a playlist</Button>
                </div>
              ) : (
                <VirtualizedTracks
                  tracks={tracksToRender}
                  columnWidths={columnWidths}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayPreview={handlePlayPreview}
                  selectedPlaylists={state.selectedPlaylists}
                  playlistTracks={state.playlistTracks}
                  userId={isDevMode ? 'spotify' : userId}
                  devMode={isDevMode}
                  onToggleTrack={async (playlist: Playlist, track: Track, isInPlaylist: boolean) => {
                    if (isInPlaylist) {
                      await removeTrackFromPlaylist(playlist.id, `spotify:track:${track.id}`);
                      dispatch({
                        type: actionTypes.REMOVE_TRACK_FROM_PLAYLIST,
                        payload: { playlistId: playlist.id, trackId: track.id },
                      });
                      if (isDevMode) {
                        const cacheKey = `cachedTracks_${playlist.id}`;
                        try {
                          const cached = JSON.parse(sessionStorage.getItem(cacheKey) || '[]');
                          const next = Array.isArray(cached) ? cached.filter((t: any) => t.id !== track.id) : [];
                          sessionStorage.setItem(cacheKey, JSON.stringify(next));
                        } catch (_) {}
                      }
                      setUndoStack((prev) => [...prev, { type: "remove", playlistId: playlist.id, track }]);
                      addToHistory(`Removed track "${track.name}" from playlist "${playlist.name}"`);
                      showToast({
                        title: "Removed from playlist",
                        description: `${track.name} → ${playlist.name}`,
                        variant: "info",
                        actionLabel: "Undo",
                        onAction: async () => {
                          await addTrackToPlaylist(playlist.id, `spotify:track:${track.id}`);
                          dispatch({
                            type: actionTypes.ADD_TRACK_TO_PLAYLIST,
                            payload: { playlistId: playlist.id, track },
                          });
                        },
                      });
                    } else {
                      await addTrackToPlaylist(playlist.id, `spotify:track:${track.id}`);
                      dispatch({
                        type: actionTypes.ADD_TRACK_TO_PLAYLIST,
                        payload: { playlistId: playlist.id, track },
                      });
                      if (isDevMode) {
                        const cacheKey = `cachedTracks_${playlist.id}`;
                        try {
                          const cached = JSON.parse(sessionStorage.getItem(cacheKey) || '[]');
                          const base = Array.isArray(cached) ? cached : [];
                          const exists = base.some((t: any) => t.id === track.id);
                          const next = exists ? base : [...base, track];
                          sessionStorage.setItem(cacheKey, JSON.stringify(next));
                        } catch (_) {}
                      }
                      setUndoStack((prev) => [...prev, { type: "add", playlistId: playlist.id, track }]);
                      addToHistory(`Added track "${track.name}" to playlist "${playlist.name}"`);
                      showToast({
                        title: "Added to playlist",
                        description: `${track.name} → ${playlist.name}`,
                        variant: "success",
                        actionLabel: "Undo",
                        onAction: async () => {
                          await removeTrackFromPlaylist(playlist.id, `spotify:track:${track.id}`);
                          dispatch({
                            type: actionTypes.REMOVE_TRACK_FROM_PLAYLIST,
                            payload: { playlistId: playlist.id, trackId: track.id },
                          });
                        },
                      });
                    }
                  }}
                  density={rowDensity}
                  onScrollStateChange={setListScrolled}
                />
              )}
            </CardContent>
          </div>
        </Card>
      </div>
      {currentTrack && (
        <SpotifyPreviewPlayer
          ref={previewPlayerRef}
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPreview={handlePlayPreview}
        />
      )}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} commands={commands} />
    </div>
  );
};

type VirtualizedTracksProps = {
  tracks: Track[];
  columnWidths: { song: string; artist: string; playlists: { [key: string]: string } };
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPreview: (track: Track) => void;
  selectedPlaylists: Playlist[];
  playlistTracks: Record<string, Track[]>;
  userId: string | null;
  onToggleTrack: (playlist: Playlist, track: Track, isInPlaylist: boolean) => void | Promise<void>;
  density: "comfortable" | "compact";
  onScrollStateChange?: (scrolled: boolean) => void;
  devMode?: boolean;
};

const VirtualizedTracks: React.FC<VirtualizedTracksProps> = ({
  tracks,
  columnWidths,
  currentTrack,
  isPlaying,
  onPlayPreview,
  selectedPlaylists,
  playlistTracks,
  userId,
  onToggleTrack,
  density,
  onScrollStateChange,
  devMode,
}) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === "compact" ? 52 : 64),
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      if (typeof onScrollStateChange === "function") {
        onScrollStateChange(el.scrollTop > 0);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true } as any);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScrollStateChange]);

  return (
    <div ref={parentRef} className="w-full h-full overflow-auto">
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {virtualItems.map((virtualRow) => {
          const track = tracks[virtualRow.index];
          const top = 0;
          return (
            <div
              key={track.id}
              className="absolute left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)`, top }}
            >
              <div
                className={
                  "w-full flex items-center border-b border-border/40 transition-colors " +
                  (virtualRow.index % 2 === 1 ? " bg-muted/10" : "") +
                  " hover:bg-accent/5 transition-all duration-150 motion-reduce:transition-none"
                }
                style={{ height: density === "compact" ? 52 : 64 }}
              >
                <div className="flex flex-col justify-center h-full" style={{ minWidth: `${columnWidths.song}` }}>
                  <TrackComponent
                    track={track}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                    onPlayPreview={onPlayPreview}
                    density={density}
                  />
                </div>
                <div className="flex flex-col justify-center h-full" style={{ minWidth: `${columnWidths.artist}` }}>
                  <ArtistComponent track={track} density={density} />
                </div>
                {selectedPlaylists.map((playlist) => {
                  const isInPlaylist = playlistTracks[playlist.id]?.some((pTrack) => pTrack.id === track.id);
                  return (
                    <div
                      key={`${playlist.id}-${track.id}`}
                      className="w-12 h-full flex justify-center items-center"
                      style={{ minWidth: `${48}px` }}
                    >
                      {(devMode || playlist.owner.id === userId) ? (
                        <CustomTooltip
                          description={isInPlaylist ? `Remove from ${playlist.name}` : `Add to ${playlist.name}`}
                          time={200}
                        >
                          <button
                            onClick={() => onToggleTrack(playlist, track, !!isInPlaylist)}
                            className={
                              "w-8 h-8 rounded-full border border-border/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform duration-150 active:scale-95 " +
                              (isInPlaylist
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-card text-accent hover:bg-accent/20")
                            }
                            aria-label={isInPlaylist ? `Remove ${track.name} from ${playlist.name}` : `Add ${track.name} to ${playlist.name}`}
                            aria-pressed={isInPlaylist}
                          >
                            {isInPlaylist ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </CustomTooltip>
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-transparent flex items-center justify-center">
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrackRowsSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="w-full flex items-center gap-3 animate-pulse">
          <div className="flex items-center" style={{ minWidth: "20rem" }}>
            <div className="ml-2 mr-2 h-7 w-7 rounded-md bg-muted/30" />
            <div className="h-9 w-9 rounded-md bg-muted/30 mr-2" />
            <div className="h-4 w-40 rounded bg-muted/30" />
          </div>
          <div className="flex items-center" style={{ minWidth: "14rem" }}>
            <div className="h-4 w-32 rounded bg-muted/30" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="h-8 w-8 rounded-full bg-muted/30" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsPanel: React.FC<{ tracks: Track[]; selectedPlaylists: Playlist[] }> = ({ tracks, selectedPlaylists }) => {
  const totalTracks = tracks.length;
  const artistCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tracks) {
      for (const a of t.artists) {
        counts[a.name] = (counts[a.name] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [tracks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-3 rounded-md bg-card">
        <div className="text-xs text-muted-foreground">Selected playlists</div>
        <div className="text-xl font-semibold">{selectedPlaylists.length}</div>
      </div>
      <div className="p-3 rounded-md bg-card">
        <div className="text-xs text-muted-foreground">Unique tracks</div>
        <div className="text-xl font-semibold">{totalTracks}</div>
      </div>
      <div className="p-3 rounded-md bg-card md:col-span-1 col-span-1">
        <div className="text-xs text-muted-foreground mb-2">Top artists</div>
        <ul className="text-sm">
          {artistCounts.map(([name, count]) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span className="text-muted-foreground">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlaylistsPage;
