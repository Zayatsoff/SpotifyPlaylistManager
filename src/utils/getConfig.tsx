export const getConfig = async () => {
  console.log("Environment Mode:", import.meta.env.MODE); // Debug log
  if (import.meta.env.MODE === "development") {
    return {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    };
  } else {
    const response = await fetch(
      "https://us-central1-spotifymanager-liorrozin-co.cloudfunctions.net/api/config"
    );

    const config = await response.json();
    console.log("Responce:", config);
    return config;
  }
};
