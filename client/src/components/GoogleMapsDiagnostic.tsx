import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function GoogleMapsDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Check if API key exists
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      diagnosticResults.push({
        test: 'API Key Configuration',
        status: 'fail',
        message: 'Google Maps API key is missing',
        details: 'VITE_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY environment variable is not set'
      });
    } else if (!apiKey.startsWith('AIza')) {
      diagnosticResults.push({
        test: 'API Key Format',
        status: 'warning',
        message: 'API key format may be invalid',
        details: 'Google Maps API keys typically start with "AIza"'
      });
    } else {
      diagnosticResults.push({
        test: 'API Key Configuration',
        status: 'pass',
        message: 'API key is configured'
      });
    }

    // Test 2: Check if Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps) {
      diagnosticResults.push({
        test: 'Google Maps API Loaded',
        status: 'pass',
        message: 'Google Maps API is loaded successfully'
      });
    } else {
      diagnosticResults.push({
        test: 'Google Maps API Loaded',
        status: 'fail',
        message: 'Google Maps API is not loaded',
        details: 'The API may have failed to load or is not available'
      });
    }

    // Test 3: Check if Places API is available
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      diagnosticResults.push({
        test: 'Places API Available',
        status: 'pass',
        message: 'Places API is available'
      });
    } else {
      diagnosticResults.push({
        test: 'Places API Available',
        status: 'fail',
        message: 'Places API is not available',
        details: 'The Places library may not be loaded or enabled'
      });
    }

    // Test 4: Check network connectivity
    try {
      const response = await fetch('https://maps.googleapis.com/maps/api/js?libraries=places', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      diagnosticResults.push({
        test: 'Network Connectivity',
        status: 'pass',
        message: 'Can reach Google Maps servers'
      });
    } catch (error) {
      diagnosticResults.push({
        test: 'Network Connectivity',
        status: 'fail',
        message: 'Cannot reach Google Maps servers',
        details: 'Check your internet connection or firewall settings'
      });
    }

    // Test 5: Check current domain
    const currentDomain = window.location.hostname;
    diagnosticResults.push({
      test: 'Current Domain',
      status: 'info',
      message: `Current domain: ${currentDomain}`,
      details: 'Ensure this domain is allowed in your API key restrictions'
    });

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Google Maps API Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{result.test}</span>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-gray-600">{result.message}</p>
                {result.details && (
                  <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 