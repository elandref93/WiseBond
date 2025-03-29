import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  X, 
  Link2, 
  Twitter, 
  Facebook, 
  Mail, 
  Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalculationResult } from '@/lib/calculators';
import { generateShareableUrl, generateShareableText } from '@/lib/shareUtils';

interface ShareCalculationProps {
  result: CalculationResult;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export default function ShareCalculation({ 
  result, 
  variant = 'button',
  size = 'md'
}: ShareCalculationProps) {
  const { toast } = useToast();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate the shareable URL
  const shareableUrl = window.location.origin + generateShareableUrl(result);
  
  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        
        toast({
          title: "Link copied!",
          description: "The calculation link has been copied to your clipboard.",
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Failed to copy",
          description: "Please try again or copy the link manually.",
          variant: "destructive",
        });
      });
  };
  
  // Share via social media platforms
  const shareVia = (platform: 'twitter' | 'facebook' | 'email') => {
    const text = generateShareableText(result);
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=My Financial Calculation&body=${encodeURIComponent(text + '\n\n' + shareableUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      setIsPopoverOpen(false);
    }
  };
  
  // Button sizes
  const sizeClasses = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-4',
  };
  
  // Icon sizes
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };
  
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share calculation</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share this calculation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            variant="outline" 
            className={sizeClasses[size]}
          >
            <Share2 className={`mr-2 h-${iconSizes[size]/4} w-${iconSizes[size]/4}`} />
            Share
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h3 className="font-medium">Share Calculation</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsPopoverOpen(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 overflow-hidden">
              <p className="text-sm truncate">{shareableUrl}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className={`h-8 w-8 ${isCopied ? 'text-green-500' : ''}`}
              onClick={copyToClipboard}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shareVia('twitter')}>
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Share on Twitter</span>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shareVia('facebook')}>
              <Facebook className="h-4 w-4" />
              <span className="sr-only">Share on Facebook</span>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shareVia('email')}>
              <Mail className="h-4 w-4" />
              <span className="sr-only">Share via Email</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}