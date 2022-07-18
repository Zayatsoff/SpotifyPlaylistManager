import os
from client import SpotifyClient
import json


def main():
    # Variables #TODO Get it automatically via https://developer.spotify.com/console/get-current-user/ and https://developer.spotify.com/console/post-playlists/
    with open("key.json") as jsonFile:
        key = json.load(jsonFile)
        jsonFile.close()
    # Instantiate Spotify client
    spotify_client = SpotifyClient(auth_token=key["auth_token"], user_id=key["user_id"])

    # Get last played tracks
    num_tracks_to_visualize = int(input("How many tracks would you like to visualize? "))

    last_played_tracks = spotify_client.get_last_played_tracks(num_tracks_to_visualize)

    print(
        f"Here are the last {num_tracks_to_visualize} tracks you listened to on spotify: "
    )
    for index, track in enumerate(last_played_tracks):
        print(f"{index+1} - {track}")

    # Choose which tracks to use as a seed to generate a playlist
    indexes = input(
        "Enter a list of up to 5 tracks you'd like to use as seeds. Use indexes separated by a space: "
    )
    indexes = indexes.split()
    seed_tracks = [last_played_tracks[int(index) - 1] for index in indexes]

    # Get recommended tracks based off seed tracks
    recommended_tracks = spotify_client.get_recommended_tracks(seed_tracks)
    print(
        "Here are your recommended tracks which will be included in your enw playlist: "
    )
    for index, track in enumerate(recommended_tracks):
        print(f"{index+1} - {track}")

    # Get playlist name from user and create playlist
    playlist_name = input("What's the playlist name? ")
    playlist = spotify_client.create_playlist(playlist_name)
    print(f"Playlist '{playlist.name}' was successfully created.")

    # Populate playlist with tracks
    spotify_client.populate_playlist(playlist, recommended_tracks)
    print(
        f"Recommended tracks have been successfully uploaded to playlist '{playlist.name}'."
    )

if __name__ == "__main__":
    main()
