import { CopyIcon } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1000); // Set timeout for 3 seconds (3000 milliseconds)
      })
      .catch((error) => {
        console.error("Error copying text to clipboard:", error);
      });
  };
  return (
    <div className={`cursor-pointer`} onClick={handleCopy}>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={copied}>
          <TooltipTrigger>
            {/* <Button variant="outline">Hover</Button> */}
            <p className="flex items-center text-sm">
              {address && `${address?.slice(0, 5)}...${address.slice(-4)}`}

              <CopyIcon className="ml-2 h-3 w-3" />
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copied</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default CopyAddress;
