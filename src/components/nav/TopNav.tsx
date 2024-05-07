import { default as Logo } from "@/assets/spm_quick_logo_colour.svg?react";
import { default as Github } from "@/assets/github_logo.svg?react";
import ThemeToggler from "@/components/ui/ThemeToggler";
import { Settings } from "lucide-react";
import CustomTooltip from "../ui/CustomTooltip";

export default function TopNav() {
  return (
    <div className="w-full h-full p-4 flex flex-row justify-between items-center">
      <div className="w-96 ">
        <Logo className="text-foreground w-full drop-shadow-[0_2px_5px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="flex flex-row gap-3 items-center ">
        <div className="h-5 flex items-center">
          <CustomTooltip
            children={
              <a
                href="https://github.com/Zayatsoff/SpotifyPlaylistManager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground rounded-full hover:bg-primary/30 w-8 h-8 flex items-center justify-center"
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
              <div className=" text-foreground rounded-full hover:bg-primary/30 w-8 h-8 flex items-center justify-center">
                <Settings className="w-5" />
              </div>
            }
            description={"Settings"}
            time={400}
          />
        </div>

        <ThemeToggler />
      </div>
    </div>
  );
}
