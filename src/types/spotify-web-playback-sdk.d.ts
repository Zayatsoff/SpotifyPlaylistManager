/**
 * Type definitions for Spotify Web Playback SDK
 * https://developer.spotify.com/documentation/web-playback-sdk/reference
 */

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(
      event: 'ready' | 'not_ready',
      callback: (data: { device_id: string }) => void
    ): boolean;
    addListener(
      event: 'player_state_changed',
      callback: (state: PlaybackState | null) => void
    ): boolean;
    addListener(
      event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
      callback: (error: Error) => void
    ): boolean;
    addListener(event: 'autoplay_failed', callback: () => void): boolean;
    removeListener(
      event: string,
      callback?: (data: any) => void
    ): boolean;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    context: {
      uri: string | null;
      metadata: Record<string, any>;
    };
    disallows: {
      pausing?: boolean;
      peeking_next?: boolean;
      peeking_prev?: boolean;
      resuming?: boolean;
      seeking?: boolean;
      skipping_next?: boolean;
      skipping_prev?: boolean;
    };
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
    duration: number;
    restrictions: {
      disallow_resuming_reasons?: string[];
      disallow_skipping_prev_reasons?: string[];
    };
  }

  interface Track {
    id: string | null;
    uri: string;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: Array<{ url: string; height?: number; width?: number }>;
    };
    artists: Array<{
      uri: string;
      name: string;
    }>;
    duration_ms: number;
  }

  interface Error {
    message: string;
  }

  interface PlayerConstructor {
    new (options: PlayerOptions): Player;
  }

  const Player: PlayerConstructor;
}

interface Window {
  Spotify: typeof Spotify;
  onSpotifyWebPlaybackSDKReady: () => void;
}

