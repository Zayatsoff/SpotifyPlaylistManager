import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Callback from "./pages/CallbackPage";
import PlaylistsPage from "./pages/PlaylistsPage";

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
