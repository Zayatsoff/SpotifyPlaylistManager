import os
from client import SpotifyClient
import json


def main():
    # Variables
    key = json.loads(key.json)
    print(key["user_id"])
    # Instantiate Spotify client
    spotify_client = SpotifyClient(key["auth_token"]), key["user_id"]
