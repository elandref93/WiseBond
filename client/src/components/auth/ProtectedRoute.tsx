import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Route, Redirect } from "wouter";
import Loading from "@/components/Loading";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  path, 
  component: Component 
}) => {
  const { user, isLoading } = useAuth();

  return (
    <Route
      path={path}
      component={(params) => {
        // Show loading while checking authentication
        if (isLoading) {
          return <Loading />;
        }
        
        // Redirect to login if not authenticated
        if (!user) {
          console.log("User not authenticated, redirecting to login");
          return <Redirect to="/login" />;
        }
        
        // Render the protected component
        return <Component {...params} />;
      }}
    />
  );
};

export default ProtectedRoute;