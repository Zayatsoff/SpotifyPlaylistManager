class Track:
    def __init__(self, name, id, artists):
        self.name = name
        self.id = id
        self.artists = artists

    def create_spotify_uri(self):
        return f"spotify:track:{self.id}"

    def __str__(self):
        return f"{self.name}"
