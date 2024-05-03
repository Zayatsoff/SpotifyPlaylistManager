import React, { useEffect, useState } from "react";
import { useSpotifyAuth } from "../context/SpotifyAuthContext";
import SideNav from "../components/playlists/SideNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
    name: string;
  };
  albumImage: string;
}

const PlaylistsPage: React.FC = () => {
  const { token } = useSpotifyAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Playlist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, Track[]>>(
    {}
  ); // Store tracks for each playlist separately

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

  useEffect(() => {
    const fetchTracks = async (playlist: Playlist) => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        const tracks = data.items.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map((artist: any) => ({
            name: artist.name,
          })),
          // Extract album image URL from the first image in the album.images array
          albumImage: item.track.album.images[0]?.url || "",
        }));
        // Store tracks for each playlist separately
        setPlaylistTracks((prevTracks) => ({
          ...prevTracks,
          [playlist.id]: tracks,
        }));
      } catch (error) {
        console.error("Error fetching tracks:", error);
      }
    };

    // Fetch tracks for all selected playlists
    selectedPlaylists.forEach((playlist) => {
      fetchTracks(playlist);
    });
  }, [selectedPlaylists, token]);

  const handlePlaylistToggle = (playlist: Playlist) => {
    const index = selectedPlaylists.findIndex((p) => p.id === playlist.id);
    if (index === -1) {
      setSelectedPlaylists((prevSelected) => [...prevSelected, playlist]);
    } else {
      const updatedSelected = [...selectedPlaylists];
      updatedSelected.splice(index, 1);
      setSelectedPlaylists(updatedSelected);
    }
  };

  return (
    <div className="w-screen h-screen grid grid-cols-6 gap-3 overflow-hidden bg-background">
      <div className="col-span-1 h-full w-full overflow-auto">
        <SideNav
          playlists={playlists}
          selectedPlaylists={selectedPlaylists}
          onPlaylistToggle={handlePlaylistToggle}
        />
      </div>
      <Card className="col-span-5 overflow-hidden">
        <CardHeader>Edit Playlists</CardHeader>
        <CardContent className="overflow-hidden w-full h-full ">
          <ScrollArea className=" w-full h-full">
            <div className=" w-full h-full flex flex-row gap-3">
              {selectedPlaylists.map((playlist, index) => (
                <div key={playlist.id} className="">
                  <h2 className="font-bold">{playlist.name}</h2>
                  <div className="flex flex-col gap-3">
                    {playlistTracks[playlist.id]?.map((track) => (
                      <div key={track.id} className="flex items-center">
                        {/* Display album cover */}
                        <img
                          src={track.albumImage || ""}
                          alt={`${track.album?.name} cover`}
                          className="w-10 h-10 rounded-full mr-2"
                        />
                        <div className="rounded-md bg-primary p-3">
                          {/* Truncate track name to first 30 characters */}
                          {track.name.length > 30
                            ? `${track.name.slice(0, 30)}...`
                            : track.name}{" "}
                          -{" "}
                          {/* Combine remaining artists into "..." if there are more than 2 */}
                          {track.artists.length > 2
                            ? `${track.artists
                                .slice(0, 2)
                                .map((artist) => artist.name)
                                .join(", ")}...`
                            : track.artists
                                .map((artist) => artist.name)
                                .join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaylistsPage;
