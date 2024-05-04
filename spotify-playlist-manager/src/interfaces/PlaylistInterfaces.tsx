export interface Track {
  artists: { name: string }[];
  id: string;
  name: string;
  albumImage: string;
}

export interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

export interface Artist {
  name: string;
}
