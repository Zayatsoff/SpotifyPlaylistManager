import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomTooltipProps {
  children: React.ReactNode;
  description: string;
  time: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  children,
  description,
  time,
}) => {
  return (
    <TooltipProvider delayDuration={time}>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent className="bg-background text-foreground">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CustomTooltip;
