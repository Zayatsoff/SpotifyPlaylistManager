<p float="left">
  <img src="/assets/logo_shadow.png" width="100%" />
</p>

## Features

- Consolidates selected playlists, presenting all their songs in a single view
- Seamlessly add or remove songs across multiple playlists
- Full track playback using Spotify Web Playback SDK (Premium users)
  - Lazy-loaded SDK - only initializes when play button is pressed for optimal performance
  - Automatic fallback to 30-second preview clips for non-Premium users
  - Interactive progress bar with seek functionality
  - Real-time playback controls

## Dependancies

- React
- Typescript
- ShadCN
- Lucide

## Development Setup

### Option 1: Run Backend Locally (Best for development/testing)

In a separate terminal, run:

```bash
cd functions
npm run serve
```

This starts the Firebase Functions emulator on `http://127.0.0.1:5001`.

### Option 2: Use Production Backend

If you prefer to use the production backend during development, add this to your `.env` file:

```
VITE_API_BASE_URL=https://us-central1-spotifymanager-liorrozin-co.cloudfunctions.net/api
```

### Environment Variables

Create a `.env` file in the root directory with:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5175/callback
```

**Note:** For localhost development, Spotify requires `http://localhost` (not `https://`). Production domains must use `https://`.

## Disclaimer

- You'll need to login using Spotify. None of your credentials are accessible to me.
- Inpired by [Playlist Manager](https://github.com/eduardolima93/playlist-manager). I loved the app, but it wasn't getting updated and has some bugs.

## Todo

- [ ] Add feature: Settings
- [ ] ~~Add feature: Replace album cover~~ (Need proper backend to store album cover; will come back to in the future)
