import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';

export const useSpotifyPlayer = () => {
  const { token } = useSpotifyAuth();
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scriptLoadedRef = useRef(false);
  const playerInitializedRef = useRef(false);

  // Dynamically load Spotify SDK script
  const loadSpotifySDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (scriptLoadedRef.current || document.getElementById('spotify-player-sdk')) {
        setSdkLoaded(true);
        resolve();
        return;
      }

      // Check if Spotify SDK is already available
      if (window.Spotify) {
        scriptLoadedRef.current = true;
        setSdkLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'spotify-player-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        setSdkLoaded(true);
        resolve();
      };

      script.onerror = () => {
        console.error('Failed to load Spotify SDK');
        reject(new Error('Failed to load Spotify SDK'));
      };

      document.body.appendChild(script);
    });
  }, []);

  // Initialize player only when SDK is loaded and token is available
  const initializePlayer = useCallback(() => {
    if (!token || !sdkLoaded || playerInitializedRef.current || !window.Spotify) {
      return;
    }

    setIsLoading(true);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spotify Playlist Manager Player',
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
        setIsLoading(false);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
        setIsLoading(false);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account Error:', message);
        setIsLoading(false);
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setIsLoading(false);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      // Player state changes
      spotifyPlayer.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setPosition(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      });

      // Connect to the player
      spotifyPlayer.connect().then((success) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
          playerInitializedRef.current = true;
        }
      });

      setPlayer(spotifyPlayer);
    };

    // Trigger the callback if Spotify is already loaded
    if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady();
    }
  }, [token, sdkLoaded]);

  // Initialize player when SDK is loaded
  useEffect(() => {
    if (sdkLoaded && token && !playerInitializedRef.current) {
      initializePlayer();
    }
  }, [sdkLoaded, token, initializePlayer]);

  // Play a specific track
  const playTrack = useCallback(
    async (trackUri: string) => {
      if (!token || !deviceId || !isReady) {
        console.warn('Player not ready or missing token/deviceId');
        return false;
      }

      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({
            uris: [trackUri],
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to start playback:', error);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error playing track:', error);
        return false;
      }
    },
    [token, deviceId, isReady]
  );

  // Pause playback
  const pause = useCallback(async () => {
    if (player) {
      await player.pause();
    }
  }, [player]);

  // Resume playback
  const resume = useCallback(async () => {
    if (player) {
      await player.resume();
    }
  }, [player]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (player) {
      await player.togglePlay();
    }
  }, [player]);

  // Seek to position
  const seek = useCallback(
    async (position_ms: number) => {
      if (player) {
        await player.seek(position_ms);
      }
    },
    [player]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [player]);

  return {
    player,
    deviceId,
    isReady,
    isPlaying,
    currentTrack,
    position,
    duration,
    playTrack,
    pause,
    resume,
    togglePlay,
    seek,
    loadSpotifySDK,
    isLoading,
    sdkLoaded,
  };
};

