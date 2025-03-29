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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Mail, Twitter, Facebook } from 'lucide-react';
import { CalculationResult } from '@/lib/calculators';
import { generateShareableUrl, generateShareableText } from '@/lib/shareUtils';
import EmailCalculationForm from './EmailCalculationForm';

interface ShareCalculationProps {
  result: CalculationResult;
  size?: "default" | "sm" | "lg";
}

export default function ShareCalculation({ result, size = "default" }: ShareCalculationProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
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
    }).catch(err => {
      console.error('Failed to copy:', err);
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
  
  // Handle email form success
  const handleEmailSuccess = () => {
    setOpen(false);
    toast({
      title: 'Email sent successfully',
      description: 'Thank you for your interest. A consultant may contact you to discuss further options.',
    });
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
            Share these results with yourself or others
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="email">Email Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="pt-4">
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
          </TabsContent>
          
          <TabsContent value="email" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Get this calculation emailed to you and speak to a home loan consultant who can help with your application.
            </p>
            <EmailCalculationForm 
              result={result} 
              onSuccess={handleEmailSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}