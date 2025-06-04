import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import AgentDashboardLayout from "@/components/agent/AgentDashboardLayout";

const AgentDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  // If user is not logged in, redirect to login
  if (!isLoading && !user) {
    return <Redirect to="/login" />;
  }

  return <AgentDashboardLayout />;
};

export default AgentDashboard;