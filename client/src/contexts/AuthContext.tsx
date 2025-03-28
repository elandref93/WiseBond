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
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    onError: () => {
      // Do nothing on 401 - it's expected if user is not logged in
      return null;
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
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
      const response = await apiRequest("POST", "/api/auth/register", userData);
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
      await apiRequest("POST", "/api/auth/logout", {});
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

  return (
    <AuthContext.Provider value={{ 
      user: user?.user || null, 
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
