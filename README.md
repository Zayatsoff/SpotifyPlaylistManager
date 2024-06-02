<p float="left">
  <img src="/assets/logo_shadow.png" width="100%" />
</p>

## Features

- Consolidates selected playlists, presenting all their songs in a single view
- Seamlessly add or remove songs across multiple playlists

## Dependancies

- React
- Typescript
- ShadCN
- Lucide

## Disclaimer

- You'll need to login using Spotify. None of your credentials are accessible to me.
- Inpired by [Playlist Manager](https://github.com/eduardolima93/playlist-manager). I loved the app, but it wasn't getting updated and has some bugs.

## Todo

- [x] Add feature: Search within playlist
- [x] Bug: Keep titles to 2 lines (set height)
- [x] Bug: Add limit to selected playlist
- [x] Add feature: Sort by
- [x] Add feature: Song preview
- [x] Add feature: Option to rename and delete playlists
- [x] Bug: `PlaylistPage` ~~no longer fetches from spotify, uses cached data instead~~ The playlist page was only displayuing 100 tracks.
- [x] Add feature: "Other playlist" tab
- [x] Add feature: Basic session history
- [ ] Bug: `PlaylistPage` lags when there are too many tracks/playlists, need to only load tracks based on scrolling.
- [ ] Bug: Add loading when loading
- [ ] Add feature: Combine playlists
- [ ] Add feature: Undo button
- [ ] Add feature: Optional pagination
- [ ] Add feature: Add new songs to list
- [ ] Add feature: Duplicate button
- [ ] Add feature: Statistics page
- [ ] Add feature: Settings
- [ ] Add feature: Responsiveness
- [ ] ~~Add feature: Replace album cover~~ (Need proper backend to store album cover; will come back to in the future)
