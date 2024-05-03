import React, { useEffect, useState } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext"; // Adjust the import path as necessary

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

const PlaylistsPage: React.FC = () => {
  const { token } = useSpotifyAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchPlaylists = async () => {
      try {
        // Fetch user info first to get the user ID
        const userResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const userData = await userResponse.json();
        const userId = userData.id;

        // Fetch playlists using the user ID
        const playlistsResponse = await fetch(
          `https://api.spotify.com/v1/users/${userId}/playlists`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await playlistsResponse.json();
        setPlaylists(data.items);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };

    fetchPlaylists();
  }, [token]);

  return (
    <div className="flex flex-wrap gap-4">
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="bg-green-500 text-white p-4 rounded-lg w-64"
        >
          <img
            src={playlist.images?.[0]?.url || ""} // Add null checks here
            alt={`${playlist.name} cover`}
            className="w-full rounded-lg"
          />
          <div className="mt-2">{playlist.name}</div>
        </div>
      ))}
    </div>
  );
};

export default PlaylistsPage;
