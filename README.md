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

## Disclaimer

- You'll need to login using Spotify. None of your credentials are accessible to me.
- Inpired by [Playlist Manager](https://github.com/eduardolima93/playlist-manager). I loved the app, but it wasn't getting updated and has some bugs.

## Todo

- [ ] Add feature: Settings
- [ ] ~~Add feature: Replace album cover~~ (Need proper backend to store album cover; will come back to in the future)
