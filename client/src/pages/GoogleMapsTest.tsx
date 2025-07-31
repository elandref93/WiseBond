import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '@/lib/loadGoogleMapsAPI';

export default function GoogleMapsTest() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'available' | 'missing'>('checking');

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/google-maps-config');
        if (response.ok) {
          const data = await response.json();
          setApiKeyStatus(data.hasApiKey ? 'available' : 'missing');
        } else {
          setApiKeyStatus('missing');
        }
      } catch (error) {
        setApiKeyStatus('missing');
      }
    };

    checkApiKey();
  }, []);

  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await loadGoogleMapsAPI();
        setIsLoaded(true);
        
        // Initialize autocomplete
        if (window.google && window.google.maps && window.google.maps.places) {
          const input = document.getElementById('address-input') as HTMLInputElement;
          if (input) {
            const autocompleteInstance = new window.google.maps.places.Autocomplete(input, {
              types: ['address'],
              componentRestrictions: { country: 'ZA' }
            });
            
            autocompleteInstance.addListener('place_changed', () => {
              const place = autocompleteInstance.getPlace();
              if (place.formatted_address) {
                setAddress(place.formatted_address);
              }
            });
            
            setAutocomplete(autocompleteInstance);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps API');
      } finally {
        setIsLoading(false);
      }
    };

    initGoogleMaps();
  }, []);

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getApiKeyStatusText = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return '🔄 Checking...';
      case 'available':
        return '✅ Available';
      case 'missing':
        return '❌ Missing';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5" />
        <h1 className="text-3xl font-bold">Google Maps API Test</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This page tests the Google Maps API integration. Try typing an address to test autocomplete functionality.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(isLoading ? 'loading' : error ? 'error' : 'success')}
                <div>
                  <p className="font-medium">
                    {isLoading ? 'Loading Google Maps API...' : 
                     error ? 'Failed to load Google Maps API' : 
                     'Google Maps API loaded successfully'}
                  </p>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• API Key: {getApiKeyStatusText()}</p>
                <p>• Places API: {isGoogleMapsLoaded() ? '✅ Available' : '❌ Not available'}</p>
                <p>• Autocomplete: {autocomplete ? '✅ Initialized' : '❌ Not initialized'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Address Autocomplete Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address-input">Enter an address:</Label>
                <Input
                  id="address-input"
                  placeholder="Start typing an address..."
                  className="mt-2"
                  disabled={!isLoaded || !!error}
                />
              </div>
              
              {address && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Selected Address:</p>
                  <p className="text-sm text-green-700">{address}</p>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <p>💡 Try typing: "Cape Town" or "Johannesburg" to test autocomplete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
              <p><strong>API Key Status:</strong> {getApiKeyStatusText()}</p>
              <p><strong>Hostname:</strong> {window.location.hostname}</p>
              <p><strong>Protocol:</strong> {window.location.protocol}</p>
              <p><strong>Google Maps Loaded:</strong> {isGoogleMapsLoaded() ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 