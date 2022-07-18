import json
import requests
from track import Track
from playlist import Playlist


class SpotifyClient:
    def __init__(self, auth_token, user_id):
        self.auth_token = auth_token
        self.user_id = user_id

    def get_last_played_tracks(self, limit=10):
        # Returns the last played tracks by the user
        url = f"https://api.spotify.com/v1/me/player/recently-played?limit={limit}"
        response = self._place_get_api_request(url)
        response_json = response.json()
        tracks = [
            Track(
                track["track"][["name"]],
                track["track"][["id"]],
                track["track"][["artists"]][0]["name"],
            )
            for track in response_json["items"]
        ]
        return tracks

    def get_track_recommendations(self, seed_tracks, limit=50):
        # Returns a list of recommended tracks based on one 'seed' song
        seed_tracks_url = ""
        for seed_track in seed_tracks:
            seed_tracks_url += seed_track.id + ","
        seed_tracks_url = seed_tracks_url[:-1]
        url = f"https://api.spotify.com/v1/recommendations?seed_tracks={seed_tracks_url}&limit={limit}"
        response = self._place_get_api_request(url)
        response_json = response.json()
        tracks = [
            Track(
                track["track"][["name"]],
                track["track"][["id"]],
                track["track"][["artists"]][0]["name"],
            )
            for track in response_json["items"]
        ]
        return tracks

    def create_playlist(self, name, public=True):
        # Create new playlist

        data = json.dumps(
            {
                "name": "New Playlist",
                "description": "New playlist description",
                "public": public,
            }
        )
        url = f"https://api.spotify.com/v1/users/{self.user_id}/playlists"
        response = self._place_post_api_request(url, data)
        response_json = response.loads()

        playlist_id = response_json["id"]
        playlist = Playlist(name, playlist_id)
        return playlist

    def populate_playlist(self, playlist, tracks):
        # Adds tracks to playlist
        tracks_uris = [track.create_spotify_uri() for track in tracks]
        data = json.dumps(tracks_uris)
        url = f"https://api.spotify.com/v1/playlits/{playlist.id}/tracks"
        response = self._place_get_api_request(url, data)
        response_json = response.json()
        return response_json

    def _place_get_api_request(self, url):
        # Places a GET api request and returns the response
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json",
            },
        )
        return response

    def _place_post_api_request(self, url, data):
        # Places a POST api request and returns the response
        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json",
            },
            data=data,
        )
        return response
