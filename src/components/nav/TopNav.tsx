import React from "react";
import { useNavigate } from "react-router-dom";
import { default as Logo } from "@/assets/spm_quick_logo_colour.svg?react";
import { default as Github } from "@/assets/github_logo.svg?react";
import ThemeToggler from "@/components/ui/ThemeToggler";
import { Search, History, PanelLeft, LogOut } from "lucide-react";
import CustomTooltip from "../ui/CustomTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";

interface TopNavProps {
  history: string[];
  onOpenCommand?: () => void;
  onToggleRail?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ history, onOpenCommand, onToggleRail }) => {
  const navigate = useNavigate();
  const { setToken } = useSpotifyAuth();

  const handleLogout = () => {
    setToken(null); // Clear token and storage
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <div className="h-14 flex flex-row justify-between items-center px-2 md:px-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleRail}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
          <Logo className="text-foreground h-8 w-auto" />
        </div>
        <div className="flex flex-row gap-1.5 items-center">
          <div className="h-5 flex items-center">
            <CustomTooltip
              children={
                <Button asChild variant="ghost" size="icon" aria-label="Open GitHub repository">
                  <a
                    href="https://github.com/Zayatsoff/SpotifyPlaylistManager"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-5 h-5 text-foreground" />
                  </a>
                </Button>
              }
              description={"Github"}
              time={400}
            />
          </div>
          <div className="h-5 flex items-center">
            <CustomTooltip
              children={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (onOpenCommand) onOpenCommand();
                    else {
                      const searchInput = document.querySelector<HTMLInputElement>("input[aria-label='Search']");
                      searchInput?.focus();
                    }
                  }}
                  aria-label="Open command palette (Cmd/Ctrl+K)"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </Button>
              }
              description={
                <span className="inline-flex items-center gap-1">
                  Command palette <kbd className="ml-1 rounded border border-border/60 bg-muted/20 px-1.5 py-0.5 text-[10px]">Cmd/Ctrl+K</kbd>
                </span>
              }
              time={400}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open history">
                <History className="w-5 h-5 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-md max-h-80 overflow-auto">
              <div className="p-3 w-full h-full">
                <div className="font-semibold text-base">History</div>
                <ul className="list-disc pl-5 text-sm">
                  {history.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
          <div className="h-5 flex items-center">
            <CustomTooltip
              children={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5 text-foreground" />
                </Button>
              }
              description="Logout"
              time={400}
            />
          </div>
          <ThemeToggler />
        </div>
      </div>
    </div>
  );
};

export default TopNav;
