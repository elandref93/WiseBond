import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Clock, CheckCircle, UserPlus, FileText } from "lucide-react";

// Define the type for the applications
interface Application {
  id: number;
  status: string;
  clientId: number;
  applicationDate: string;
  [key: string]: any;
}

interface AgentDashboardStatsProps {
  applications?: Application[];
}

const AgentDashboardStats: React.FC<AgentDashboardStatsProps> = ({ applications = [] }) => {
  // Calculate statistics
  const activeClients = applications
    ? [...new Set(applications.map(app => app.clientId))].length
    : 0;
    
  const pendingApplications = applications
    ? applications.filter(app => 
        ['new_lead', 'in_progress', 'submitted', 'under_review'].includes(app.status)
      ).length
    : 0;
    
  const approvalsThisMonth = applications
    ? applications.filter(app => {
        const approvedInThisMonth = app.status === 'approved';
        if (!approvedInThisMonth) return false;
        
        // Check if approved in current month
        const now = new Date();
        const approvedDate = app.decisionDate ? new Date(app.decisionDate) : null;
        return approvedDate && 
               approvedDate.getMonth() === now.getMonth() && 
               approvedDate.getFullYear() === now.getFullYear();
      }).length
    : 0;
    
  const avgProcessingDays = applications && applications.length > 0
    ? applications
        .filter(app => app.submissionDate && app.decisionDate)
        .reduce((acc, app) => {
          const submissionDate = new Date(app.submissionDate);
          const decisionDate = new Date(app.decisionDate);
          const differenceInDays = Math.floor((decisionDate.getTime() - submissionDate.getTime()) / (1000 * 3600 * 24));
          return acc + differenceInDays;
        }, 0) / applications.filter(app => app.submissionDate && app.decisionDate).length || 0
    : 0;
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
              <h3 className="text-2xl font-bold">{activeClients}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
              <h3 className="text-2xl font-bold">{pendingApplications}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approvals This Month</p>
              <h3 className="text-2xl font-bold">{approvalsThisMonth}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Processing Days</p>
              <h3 className="text-2xl font-bold">{avgProcessingDays.toFixed(1)}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboardStats;