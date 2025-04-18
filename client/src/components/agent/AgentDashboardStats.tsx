import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ClientApplication {
  id: number;
  clientId: number;
  status: string;
  loanAmount?: number;
  commissionEarned?: number;
  commissionPaidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentDashboardStatsProps {
  applications?: ClientApplication[];
}

const AgentDashboardStats: React.FC<AgentDashboardStatsProps> = ({ applications = [] }) => {
  // Calculate various statistics from the applications data
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const approvedApplications = applications.filter(app => app.status === 'approved').length;
  const declinedApplications = applications.filter(app => app.status === 'declined').length;
  
  // Calculate unique clients (using Set to get unique clientIds)
  const uniqueClients = new Set(applications.map(app => app.clientId)).size;
  
  // Calculate total commission
  const totalCommission = applications
    .filter(app => app.commissionEarned)
    .reduce((sum, app) => sum + (app.commissionEarned || 0), 0);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{totalApplications}</div>
          <p className="text-sm text-muted-foreground">Total Applications</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{uniqueClients}</div>
          <p className="text-sm text-muted-foreground">Active Clients</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{pendingApplications}</div>
          <p className="text-sm text-muted-foreground">Pending Applications</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">R{totalCommission.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Commission</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{approvedApplications}</div>
          <p className="text-sm text-muted-foreground">Approved Applications</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{declinedApplications}</div>
          <p className="text-sm text-muted-foreground">Declined Applications</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">
            {totalApplications > 0 
              ? `${Math.round((approvedApplications / totalApplications) * 100)}%` 
              : '0%'}
          </div>
          <p className="text-sm text-muted-foreground">Approval Rate</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">
            {applications.length > 0 
              ? `${Math.round(applications.filter(app => 
                  new Date().getTime() - new Date(app.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
                ).length / applications.length * 100)}%` 
              : '0%'}
          </div>
          <p className="text-sm text-muted-foreground">Last 7 Days Activity</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboardStats;