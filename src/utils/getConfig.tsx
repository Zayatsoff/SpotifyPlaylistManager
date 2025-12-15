export const getConfig = async () => {
  console.log("Environment Mode:", import.meta.env.MODE); // Debug log
  
  let config;
  
  if (import.meta.env.MODE === "development") {
    config = {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || "",
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "",
    };
  } else {
    const response = await fetch(
      "https://us-central1-spotifymanager-liorrozin-co.cloudfunctions.net/api/config"
    );
    config = await response.json();
  }

  // Log the redirect URI being used
  console.log("Redirect URI:", config.redirectUri);

  // Validate redirect URI according to Spotify's requirements (as of April 2025)
  // - Production: MUST use HTTPS
  // - Development: MUST use explicit loopback IP (127.0.0.1 or [::1]), NOT "localhost"
  // See: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
  if (!config.redirectUri) {
    console.error("ERROR: VITE_SPOTIFY_REDIRECT_URI is not set!");
    throw new Error("VITE_SPOTIFY_REDIRECT_URI environment variable is required");
  }

  const isLoopback = config.redirectUri.startsWith("http://127.0.0.1") || 
                     config.redirectUri.startsWith("http://[::1]");
  const isHttps = config.redirectUri.startsWith("https://");

  if (!isHttps && !isLoopback) {
    console.error("ERROR: Redirect URI must use HTTPS or loopback IP (http://127.0.0.1 or http://[::1])");
    console.error("Current value:", config.redirectUri);
    console.error("Note: 'localhost' is NOT allowed by Spotify. Use 127.0.0.1 instead.");
    throw new Error("Invalid redirect URI. Must use HTTPS or explicit loopback IP (127.0.0.1 or [::1])");
  }

  // Warn if using localhost (not allowed by Spotify as of April 2025)
  if (config.redirectUri.includes("localhost")) {
    console.error("❌ ERROR: 'localhost' is NOT allowed as redirect URI!");
    console.error("   Use http://127.0.0.1:PORT instead");
    console.error("   See: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri");
    throw new Error("'localhost' is not allowed. Use http://127.0.0.1:PORT instead");
  }

  return config;
};
