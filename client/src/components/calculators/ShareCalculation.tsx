import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Twitter, Facebook } from 'lucide-react';
import { CalculationResult } from '@/lib/calculators';
import { generateShareableUrl, generateShareableText } from '@/lib/shareUtils';

interface ShareCalculationProps {
  result: CalculationResult;
  size?: "default" | "sm" | "lg";
}

export default function ShareCalculation({ result, size = "default" }: ShareCalculationProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate shareable URL and text
  const shareableUrl = generateShareableUrl(result);
  const shareableText = generateShareableText(result);
  
  // Handle copy link button
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({ 
        title: 'Link copied',
        description: 'Shareable link copied to clipboard',
      });
    }).catch(() => {
      toast({ 
        title: 'Copy failed',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    });
  };
  
  // Handle social media sharing
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareableText)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(twitterUrl, '_blank');
  };
  
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`;
    window.open(facebookUrl, '_blank');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size === "default" ? "default" : size} className="ml-2">
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Calculation</DialogTitle>
          <DialogDescription>
            Share these results with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4">
          <div className="flex items-center space-x-2 pb-4">
            <Input 
              value={shareableUrl} 
              readOnly
              className="flex-1"
            />
            <Button size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={handleTwitterShare}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button variant="outline" onClick={handleFacebookShare}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
