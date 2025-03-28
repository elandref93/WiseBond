import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, InsertUser } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: Omit<InsertUser, "password"> & { password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [error, setError] = useState<Error | null>(null);

  // Query for getting the current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Auth query error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      setError(error);
      throw error;
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      setError(error);
      throw error;
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/logout", {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.setQueryData(['/api/auth/me'], null);
    },
    onError: (error: Error) => {
      setError(error);
      throw error;
    }
  });

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    try {
      const result = await loginMutation.mutateAsync({ username, password });
      return result.user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An error occurred during login");
    }
  };

  // Register function
  const register = async (userData: Omit<InsertUser, "password"> & { password: string }): Promise<User> => {
    try {
      const result = await registerMutation.mutateAsync(userData as InsertUser);
      return result.user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An error occurred during registration");
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An error occurred during logout");
    }
  };

  // Clear error on component unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  const userValue = userData && 'user' in userData ? userData.user : null;

  return (
    <AuthContext.Provider value={{ 
      user: userValue, 
      isLoading, 
      error, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
