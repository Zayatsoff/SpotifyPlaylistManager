import React, { useEffect, useState } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext"; // Adjust the import path as necessary
import SideNav from "../components/playlists/SideNav"; // Assuming SideNav component is located in the same directory

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
    <div className="w-screen h-screen grid grid-cols-6 ">
      <div className="col-span-1 h-full w-full overflow-auto">
        <SideNav playlists={playlists} />
      </div>
      <div className="col-span-4"> hi</div>
    </div>
  );
};

export default PlaylistsPage;
