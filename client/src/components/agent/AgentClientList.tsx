import React, { useState, useMemo } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Link, 
  useLocation 
} from "wouter";
import { 
  MoreHorizontal,
  FileText,
  Phone,
  Mail,
  User
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Application {
  id: number;
  clientId: number;
  status: string;
  applicationDate: string;
  [key: string]: any;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface AgentClientListProps {
  applications?: Application[];
  isLoading: boolean;
}

const AgentClientList: React.FC<AgentClientListProps> = ({ applications = [], isLoading }) => {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract unique clients from applications
  const uniqueClientIds = useMemo(() => {
    const ids = new Set<number>();
    applications.forEach(app => ids.add(app.clientId));
    return Array.from(ids);
  }, [applications]);

  // Get clients information using useMemo to create the selector function
  const clientQueries = useMemo(() => 
    uniqueClientIds.map(clientId => useQuery({
      queryKey: ["/api/users", clientId],
      queryFn: async () => {
        try {
          const res = await fetch(`/api/users/${clientId}`);
          if (!res.ok) throw new Error("Failed to fetch client");
          return await res.json();
        } catch (error) {
          console.error(`Error fetching client ${clientId}:`, error);
          return { user: null };
        }
      },
      enabled: uniqueClientIds.length > 0,
    }))
  , [uniqueClientIds]);

  const isClientsLoading = clientQueries.some(query => query.isLoading);
  const clientsData = clientQueries.map(query => query.data?.user).filter(Boolean);

  // Create a map of clientId to client data
  const clientMap = useMemo(() => {
    const map = new Map<number, User>();
    clientsData.forEach(client => {
      if (client) map.set(client.id, client);
    });
    return map;
  }, [clientsData]);

  // Create a client summary with application counts and last activity
  const clientSummaries = useMemo(() => {
    return uniqueClientIds.map(clientId => {
      const client = clientMap.get(clientId);
      const clientApps = applications.filter(app => app.clientId === clientId);
      
      // Calculate application counts
      const totalApps = clientApps.length;
      const activeApps = clientApps.filter(app => 
        ['new_lead', 'in_progress', 'submitted', 'under_review'].includes(app.status)
      ).length;
      const approvedApps = clientApps.filter(app => app.status === 'approved' || app.status === 'funded').length;
      const declinedApps = clientApps.filter(app => app.status === 'declined').length;
      
      // Get last activity date
      const sortedApps = [...clientApps].sort((a, b) => 
        new Date(b.updatedAt || b.applicationDate).getTime() - 
        new Date(a.updatedAt || a.applicationDate).getTime()
      );
      const lastActivity = sortedApps.length > 0 ? sortedApps[0].updatedAt || sortedApps[0].applicationDate : null;
      
      return {
        clientId,
        client,
        totalApps,
        activeApps,
        approvedApps,
        declinedApps,
        lastActivity
      };
    });
  }, [uniqueClientIds, clientMap, applications]);
  
  // Filter client summaries based on search
  const filteredClients = useMemo(() => {
    return clientSummaries.filter(summary => {
      if (!summary.client) return false;
      
      const client = summary.client;
      const searchLowerCase = search.toLowerCase();
      
      return (
        client.firstName.toLowerCase().includes(searchLowerCase) ||
        client.lastName.toLowerCase().includes(searchLowerCase) ||
        client.email.toLowerCase().includes(searchLowerCase) ||
        (client.phone && client.phone.includes(search))
      );
    });
  }, [clientSummaries, search]);

  // Sort clients by last activity
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }, [filteredClients]);

  if (isLoading || isClientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>Manage your clients and prospects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <div className="w-full sm:w-1/3">
            <Input
              placeholder="Search by name, email or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            onClick={() => setLocation("/agent/clients/new")}
          >
            Add New Client
          </Button>
        </div>

        {sortedClients.length === 0 ? (
          <div className="text-center py-10">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No clients found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {applications.length === 0
                ? "Start by adding your first client"
                : "Try adjusting your search"}
            </p>
            {applications.length === 0 && (
              <Button 
                className="mt-4"
                onClick={() => setLocation("/agent/clients/new")}
              >
                Add New Client
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((summary) => (
                  <TableRow key={summary.clientId}>
                    <TableCell className="font-medium">
                      {summary.client ? (
                        `${summary.client.firstName} ${summary.client.lastName}`
                      ) : (
                        "Loading client data..."
                      )}
                    </TableCell>
                    <TableCell>
                      {summary.client && (
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-xs">
                            <Mail className="mr-1 h-3 w-3" />
                            <span className="text-muted-foreground">{summary.client.email}</span>
                          </div>
                          {summary.client.phone && (
                            <div className="flex items-center text-xs">
                              <Phone className="mr-1 h-3 w-3" />
                              <span className="text-muted-foreground">{summary.client.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm">{summary.totalApps} total</span>
                        <div className="flex space-x-1">
                          {summary.activeApps > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                              {summary.activeApps} active
                            </Badge>
                          )}
                          {summary.approvedApps > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                              {summary.approvedApps} approved
                            </Badge>
                          )}
                          {summary.declinedApps > 0 && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                              {summary.declinedApps} declined
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        summary.activeApps > 0 
                          ? "outline" 
                          : summary.approvedApps > 0 
                            ? "secondary" 
                            : "destructive"
                      }>
                        {summary.activeApps > 0 
                          ? "Active" 
                          : summary.approvedApps > 0 
                            ? "Approved" 
                            : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {summary.lastActivity && (
                        <div className="text-sm">
                          {formatDistance(new Date(summary.lastActivity), new Date(), { 
                            addSuffix: true 
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setLocation(`/agent/clients/${summary.clientId}`)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setLocation(`/agent/applications/new?clientId=${summary.clientId}`);
                            }}
                          >
                            Create Application
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "This feature will be available soon",
                              });
                            }}
                          >
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentClientList;