import { Button } from "@/components/ui/button";
import { ArrowLeft, HomeIcon } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <span className="text-4xl font-bold text-red-500">404</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold">Page Not Found</h1>
        
        <p className="text-gray-600">
          Sorry, we couldn't find the page you're looking for. The page might have been removed, 
          had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Link href="/">
            <Button className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}