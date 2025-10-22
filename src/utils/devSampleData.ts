import { Playlist, Track } from "@/interfaces/PlaylistInterfaces";

// Local-first image paths for reliability; these live under public/dev-covers
const C = (name: string) => `/dev-covers/${name}`;

export const DEV_PLAYLISTS: Playlist[] = [
  {
    id: "dev_today_top_hits",
    name: "Today's Top Hits",
    images: [{ url: C("todays-top-hits.png") }],
    owner: { id: "spotify" },
    tracks: { total: 6 },
  },
  {
    id: "dev_rapcaviar",
    name: "RapCaviar",
    images: [{ url: C("rapcaviar.jpg") }],
    owner: { id: "spotify" },
    tracks: { total: 6 },
  },
  {
    id: "dev_rock_classics",
    name: "Rock Classics",
    images: [{ url: C("rock-classics.png") }],
    owner: { id: "spotify" },
    tracks: { total: 6 },
  },
  {
    id: "dev_lofi_beats",
    name: "lofi beats",
    images: [{ url: C("lofi-beats.png") }],
    owner: { id: "spotify" },
    tracks: { total: 6 },
  },
];

export const DEV_TRACKS_BY_PLAYLIST: Record<string, Track[]> = {
  dev_today_top_hits: [
    {
      id: "dev_tth_blinding_lights",
      name: "Blinding Lights",
      artists: [{ name: "The Weeknd" }],
      albumImage: C("tth_blinding_lights.png"),
      previewUrl: "",
    },
    {
      id: "dev_tth_levitating",
      name: "Levitating",
      artists: [{ name: "Dua Lipa" }],
      albumImage: C("tth_levitating.png"),
      previewUrl: "",
    },
    {
      id: "dev_tth_watermelon_sugar",
      name: "Watermelon Sugar",
      artists: [{ name: "Harry Styles" }],
      albumImage: C("tth_watermelon_sugar.png"),
      previewUrl: "",
    },
    {
      id: "dev_tth_good_4_u",
      name: "good 4 u",
      artists: [{ name: "Olivia Rodrigo" }],
      albumImage: C("tth_good_4_u.png"),
      previewUrl: "",
    },
    {
      id: "dev_tth_peaches",
      name: "Peaches",
      artists: [{ name: "Justin Bieber" }],
      albumImage: C("tth_peaches.png"),
      previewUrl: "",
    },
    {
      id: "dev_tth_save_your_tears",
      name: "Save Your Tears",
      artists: [{ name: "The Weeknd" }],
      albumImage: C("tth_save_your_tears.png"),
      previewUrl: "",
    },
  ],

  dev_rapcaviar: [
    {
      id: "dev_rc_gods_plan",
      name: "God's Plan",
      artists: [{ name: "Drake" }],
      albumImage: C("rap_gods_plan.jpg"),
      previewUrl: "",
    },
    {
      id: "dev_rc_humble",
      name: "HUMBLE.",
      artists: [{ name: "Kendrick Lamar" }],
      albumImage: C("rap_humble.png"),
      previewUrl: "",
    },
    {
      id: "dev_rc_sicko_mode",
      name: "SICKO MODE",
      artists: [{ name: "Travis Scott" }],
      albumImage: C("rap_sicko_mode.png"),
      previewUrl: "",
    },
    {
      id: "dev_rc_circles",
      name: "Circles",
      artists: [{ name: "Post Malone" }],
      albumImage: C("rap_circles.png"),
      previewUrl: "",
    },
    {
      id: "dev_rc_lose_yourself",
      name: "Lose Yourself",
      artists: [{ name: "Eminem" }],
      albumImage: C("rap_lose_yourself.jpg"),
      previewUrl: "",
    },
    {
      id: "dev_rc_stronger",
      name: "Stronger",
      artists: [{ name: "Kanye West" }],
      albumImage: C("rap_stronger.png"),
      previewUrl: "",
    },
  ],

  dev_rock_classics: [
    {
      id: "dev_rca_bohemian_rhapsody",
      name: "Bohemian Rhapsody",
      artists: [{ name: "Queen" }],
      albumImage: C("rock_bohemian_rhapsody.png"),
      previewUrl: "",
    },
    {
      id: "dev_rca_hotel_california",
      name: "Hotel California",
      artists: [{ name: "Eagles" }],
      albumImage: C("rock_hotel_california.jpg"),
      previewUrl: "",
    },
    {
      id: "dev_rca_sweet_child",
      name: "Sweet Child o' Mine",
      artists: [{ name: "Guns N' Roses" }],
      albumImage: C("rock_sweet_child.jpg"),
      previewUrl: "",
    },
    {
      id: "dev_rca_back_in_black",
      name: "Back in Black",
      artists: [{ name: "AC/DC" }],
      albumImage: C("rock_back_in_black.png"),
      previewUrl: "",
    },
    {
      id: "dev_rca_stairway",
      name: "Stairway to Heaven",
      artists: [{ name: "Led Zeppelin" }],
      albumImage: C("rock_stairway.jpg"),
      previewUrl: "",
    },
    {
      id: "dev_rca_smoke_on_the_water",
      name: "Smoke on the Water",
      artists: [{ name: "Deep Purple" }],
      albumImage: C("rock_smoke_on_the_water.jpg"),
      previewUrl: "",
    },
  ],

  dev_lofi_beats: [
    {
      id: "dev_lofi_less_i_know",
      name: "The Less I Know The Better",
      artists: [{ name: "Tame Impala" }],
      albumImage: C("lofi_less_i_know.png"),
      previewUrl: "",
    },
    {
      id: "dev_lofi_do_i_wanna_know",
      name: "Do I Wanna Know?",
      artists: [{ name: "Arctic Monkeys" }],
      albumImage: C("lofi_do_i_wanna_know.png"),
      previewUrl: "",
    },
    {
      id: "dev_lofi_electric_feel",
      name: "Electric Feel",
      artists: [{ name: "MGMT" }],
      albumImage: C("lofi_electric_feel.png"),
      previewUrl: "",
    },
    {
      id: "dev_lofi_the_sound",
      name: "The Sound",
      artists: [{ name: "The 1975" }],
      albumImage: C("lofi_the_sound.png"),
      previewUrl: "",
    },
    {
      id: "dev_lofi_mr_brightside",
      name: "Mr. Brightside",
      artists: [{ name: "The Killers" }],
      albumImage: C("lofi_mr_brightside.png"),
      previewUrl: "",
    },
    {
      id: "dev_lofi_dog_days",
      name: "Dog Days Are Over",
      artists: [{ name: "Florence + The Machine" }],
      albumImage: C("lofi_dog_days.png"),
      previewUrl: "",
    },
  ],
};
