import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface OAuthProvider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

interface OAuthProvidersResponse {
  providers: Record<string, OAuthProvider>;
}

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const signInWithProvider = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);

      const response = await fetch(`/api/auth/signin/${provider}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${provider} OAuth URL`);
      }

      const data = await response.json();
      
      if (data.url) {
        // Store current location for post-auth redirect
        localStorage.setItem('oauth_redirect', window.location.pathname);
        
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL received');
      }

    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      toast({
        title: "Authentication Error",
        description: `Failed to connect with ${provider.charAt(0).toUpperCase() + provider.slice(1)}. Please try again.`,
        variant: "destructive",
      });
      
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const signOut = async (callbackUrl = '/') => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callbackUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      const data = await response.json();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Redirect to callback URL
      window.location.href = data.url;

    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
  };

  const getProviders = async (): Promise<OAuthProvidersResponse | null> => {
    try {
      const response = await fetch('/api/auth/providers');
      
      if (!response.ok) {
        throw new Error('Failed to get OAuth providers');
      }

      return await response.json();
    } catch (error) {
      console.error('Get providers error:', error);
      return null;
    }
  };

  return {
    signInWithProvider,
    signOut,
    getProviders,
    isLoading,
    loadingProvider,
  };
}