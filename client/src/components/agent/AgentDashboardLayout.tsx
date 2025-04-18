import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AgentApplicationList from "./AgentApplicationList";
import AgentDashboardStats from "./AgentDashboardStats";
import AgentClientList from "./AgentClientList";
import { useQuery } from "@tanstack/react-query";

const AgentDashboardLayout: React.FC = () => {
  const { user } = useAuth();
  
  const { data: agentProfile, isLoading: isAgentLoading } = useQuery({
    queryKey: ["/api/agent/profile"],
    enabled: !!user,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: ["/api/agent/applications"],
    enabled: !!agentProfile?.agent,
  });

  if (isAgentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agentProfile?.agent) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Agent Profile Required</CardTitle>
          <CardDescription>
            You need to create an agent profile to access the agent portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please complete your agent profile to continue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <h1 className="mb-6 text-3xl font-bold">Agent Dashboard</h1>
      
      <AgentDashboardStats applications={applications?.applications} />
      
      <Tabs defaultValue="applications" className="w-full mt-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="mt-6">
          <AgentApplicationList applications={applications?.applications} isLoading={isApplicationsLoading} />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-6">
          <AgentClientList applications={applications?.applications} isLoading={isApplicationsLoading} />
        </TabsContent>
        
        <TabsContent value="commission" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracker</CardTitle>
              <CardDescription>Track your commission earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {applications?.applications && applications.applications.length > 0 ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Commission</h3>
                      <p className="text-2xl font-bold">
                        R{applications.applications
                          .filter(app => app.commissionEarned)
                          .reduce((sum, app) => sum + (app.commissionEarned || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                      <p className="text-2xl font-bold">
                        R{applications.applications
                          .filter(app => app.commissionEarned && !app.commissionPaidDate)
                          .reduce((sum, app) => sum + (app.commissionEarned || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground">Paid</h3>
                      <p className="text-2xl font-bold">
                        R{applications.applications
                          .filter(app => app.commissionEarned && app.commissionPaidDate)
                          .reduce((sum, app) => sum + (app.commissionEarned || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground">Potential</h3>
                      <p className="text-2xl font-bold">
                        R{applications.applications
                          .filter(app => app.status !== 'declined' && !app.commissionEarned)
                          .reduce((sum, app) => {
                            // Estimate commission at 1% of loan amount if available
                            const potentialCommission = app.loanAmount ? app.loanAmount * 0.01 : 0;
                            return sum + potentialCommission;
                          }, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No commission data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDashboardLayout;