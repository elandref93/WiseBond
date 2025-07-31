import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import GoogleMapsDiagnostic from '@/components/GoogleMapsDiagnostic';

interface DebugResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  data?: any;
}

export default function DebugPage() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDebugTests = async () => {
    setIsRunning(true);
    const debugResults: DebugResult[] = [];

    // Test 1: Environment Variables
    const viteApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const directApiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
    
    debugResults.push({
      test: 'Build-time Environment Variables',
      status: viteApiKey ? 'pass' : 'fail',
      message: viteApiKey ? 'VITE_GOOGLE_MAPS_API_KEY is set' : 'VITE_GOOGLE_MAPS_API_KEY is not set',
      details: 'This is needed for Vite to include the API key in the build',
      data: { hasViteKey: !!viteApiKey, hasDirectKey: !!directApiKey }
    });

    // Test 2: Server Health Endpoint
    try {
      const healthResponse = await fetch('/health');
      const healthData = await healthResponse.json();
      
      debugResults.push({
        test: 'Server Health Endpoint',
        status: healthResponse.ok ? 'pass' : 'fail',
        message: healthResponse.ok ? 'Health endpoint is working' : 'Health endpoint failed',
        details: `Status: ${healthResponse.status}`,
        data: healthData
      });
    } catch (error) {
      debugResults.push({
        test: 'Server Health Endpoint',
        status: 'fail',
        message: 'Failed to reach health endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Google Maps Config Endpoint
    try {
      const configResponse = await fetch('/api/google-maps-config');
      const configData = await configResponse.json();
      
      debugResults.push({
        test: 'Google Maps Config Endpoint',
        status: configResponse.ok ? 'pass' : 'fail',
        message: configResponse.ok ? 'Config endpoint is working' : 'Config endpoint failed',
        details: configResponse.ok ? 'API key available from server' : configData.message,
        data: configResponse.ok ? { hasApiKey: configData.hasApiKey } : configData
      });
    } catch (error) {
      debugResults.push({
        test: 'Google Maps Config Endpoint',
        status: 'fail',
        message: 'Failed to reach config endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Current Environment
    debugResults.push({
      test: 'Environment Information',
      status: 'info',
      message: `Environment: ${import.meta.env.MODE}`,
      details: `Hostname: ${window.location.hostname}, Protocol: ${window.location.protocol}`,
      data: {
        mode: import.meta.env.MODE,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent
      }
    });

    // Test 5: Azure Environment Variables
    if (window.location.hostname.includes('azurewebsites.net')) {
      debugResults.push({
        test: 'Azure Environment',
        status: 'info',
        message: 'Running on Azure Web App',
        details: 'Checking for Azure-specific environment variables'
      });
    }

    setResults(debugResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDebugTests();
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug Dashboard</h1>
        <Button 
          onClick={runDebugTests} 
          disabled={isRunning}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Refresh Tests'}
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This debug page helps diagnose Google Maps API issues in production. 
          Check the results below to identify configuration problems.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Debug Results */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
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
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">View Data</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Google Maps Diagnostic */}
        <GoogleMapsDiagnostic />
      </div>
    </div>
  );
} 