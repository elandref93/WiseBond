import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialTermTooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
  iconClass?: string;
  showIcon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * A tooltip component specifically designed for financial terms
 * Displays a definition when hovering over a financial term
 */
export function FinancialTermTooltip({
  term,
  definition,
  children,
  iconClass,
  showIcon = true,
  side = "top",
  align = "center",
}: FinancialTermTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center group cursor-help">
            {children || <span className="underline decoration-dotted">{term}</span>}
            {showIcon && (
              <InfoIcon
                className={cn(
                  "ml-1 h-4 w-4 text-blue-500 group-hover:text-blue-700 transition-colors",
                  iconClass
                )}
              />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{term}</p>
            <p className="text-xs">{definition}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}