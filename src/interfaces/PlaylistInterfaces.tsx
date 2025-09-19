export interface Track {
  artists: { name: string }[];
  id: string;
  name: string;
  albumImage: string;
  previewUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { id: string };
  tracks?: { total: number };
}

export interface Artist {
  name: string;
}

export interface Owner {
  id: string;
}

export interface State {
  playlists: Playlist[];
  selectedPlaylists: Playlist[];
  playlistTracks: Record<string, Track[]>;
}

export interface Action {
  type: string;
  payload: any;
}
