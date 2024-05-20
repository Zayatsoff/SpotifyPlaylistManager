export interface Track {
  artists: { name: string }[];
  id: string;
  name: string;
  albumImage: string;
  previewUrl: string; // Add this line
}

export interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

export interface Artist {
  name: string;
}
