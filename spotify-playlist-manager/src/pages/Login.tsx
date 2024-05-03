export default function Login() {
  const stateKey = "spotify_auth_state";
  const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirect_uri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const scope =
    "user-read-private playlist-read-collaborative playlist-read-private ";

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
    <div className=" bg-red-500">
      <button onClick={handleLoginClick}>Login with Spotify</button>
    </div>
  );
}
