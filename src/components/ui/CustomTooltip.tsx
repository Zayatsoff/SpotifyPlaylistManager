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
  const isElement = React.isValidElement(children);
  return (
    <TooltipProvider delayDuration={time}>
      <Tooltip>
        {isElement ? (
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        ) : (
          <TooltipTrigger>
            <span>{children}</span>
          </TooltipTrigger>
        )}
        <TooltipContent className="bg-background text-foreground">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CustomTooltip;
