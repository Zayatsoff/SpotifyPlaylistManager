import React from "react";
import { default as Logo } from "@/assets/spm_quick_logo_colour.svg?react";
import { default as Github } from "@/assets/github_logo.svg?react";
import ThemeToggler from "@/components/ui/ThemeToggler";
import { Settings, History } from "lucide-react";
import CustomTooltip from "../ui/CustomTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TopNavProps {
  history: string[];
}

const TopNav: React.FC<TopNavProps> = ({ history }) => {
  return (
    <div className="w-full h-30 p-4 flex flex-row justify-between items-center">
      <div className="w-96">
        <Logo className="text-foreground w-full drop-shadow-[0_2px_5px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="flex flex-row gap-3 items-center">
        <div className="h-5 flex items-center">
          <CustomTooltip
            children={
              <a
                href="https://github.com/Zayatsoff/SpotifyPlaylistManager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground rounded-full hover:bg-accent/30 w-8 h-8 flex items-center justify-center transition-all ease-out"
              >
                <Github className="w-5" />
              </a>
            }
            description={"Github"}
            time={400}
          />
        </div>
        <div className="h-5 flex items-center">
          <CustomTooltip
            children={
              <div className=" text-foreground rounded-full hover:bg-accent/30 w-8 h-8 flex items-center justify-center transition-all ease-out">
                <Settings className="w-5" />
              </div>
            }
            description={"Settings"}
            time={400}
          />
        </div>
        <Popover>
          <PopoverTrigger>
            <div className=" text-foreground rounded-full hover:bg-accent/30 w-8 h-8 flex items-center justify-center transition-all ease-out">
              <History className="w-5" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="max-w-md max-h-96 overflow-auto">
            <div className="p-4 w-full h-full sticky">
              <div className="font-bold text-lg">History</div>

              <ul className="list-disc pl-5">
                {history.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </Popover>
        <ThemeToggler />
      </div>
    </div>
  );
};

export default TopNav;
