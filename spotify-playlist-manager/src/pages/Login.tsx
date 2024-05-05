import { Button } from "@/components/ui/button";
import { default as Logo } from "@/assets/spm_quick_logo.svg?react";
import { default as SpotifyLogo } from "@/assets/spotify.svg?react";

export default function Login() {
  const stateKey = "spotify_auth_state";
  const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirect_uri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const scope =
    "user-read-private playlist-read-collaborative playlist-read-private playlist-modify-private playlist-modify-public";

  const generateRandomString = (length: number) => {
    var text = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const generateAuthUrl = () => {
    const state = generateRandomString(16);
    localStorage.setItem(stateKey, state);

    var url = "https://accounts.spotify.com/authorize";
    url += "?response_type=token";
    url += "&client_id=" + encodeURIComponent(client_id);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    url += "&state=" + encodeURIComponent(state);

    return url;
  };

  const handleLoginClick = () => {
    const spotifyAuthUrl = generateAuthUrl();
    window.location.href = spotifyAuthUrl;
  };

  return (
    <div className="w-screen h-screen bg-background">
      <div className="w-full h-2/3 flex flex-col items-center justify-center gap-20 xl:gap-35 2xl:gap-40 text-2xl">
        <Logo className="text-foreground w-3/4 xl:w-2/3" />
        <Button
          onClick={handleLoginClick}
          className="h-16 w-64 rounded-full text-xl bg-primary/10 shadow-md hover:bg-primary/30"
        >
          <SpotifyLogo className="mr-3" />
          Sign in with Spotify
        </Button>
      </div>
      <div className="absolute bottom-3 right-3 text-lg">
        made by <span className="underline decoration-accent">lior</span>
      </div>
    </div>
  );
}
