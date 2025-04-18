import React, { useState } from "react";
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
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  XCircle,
  FileText,
  FileCheck
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: number;
  clientId: number;
  status: string;
  lender?: string;
  propertyValue?: number;
  loanAmount?: number;
  urgency: string;
  applicationDate: string;
  propertyAddress?: string;
  propertyType?: string;
  [key: string]: any;
}

interface AgentApplicationListProps {
  applications?: Application[];
  isLoading: boolean;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "new_lead":
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">New Lead</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">In Progress</Badge>;
    case "submitted":
      return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Submitted</Badge>;
    case "under_review":
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">Under Review</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Approved</Badge>;
    case "funded":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Funded</Badge>;
    case "declined":
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  switch (urgency) {
    case "high":
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">High</Badge>;
    case "normal":
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Normal</Badge>;
    case "low":
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Low</Badge>;
    default:
      return <Badge variant="outline">{urgency}</Badge>;
  }
};

const AgentApplicationList: React.FC<AgentApplicationListProps> = ({ applications = [], isLoading }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      search === "" || 
      app.propertyAddress?.toLowerCase().includes(search.toLowerCase()) ||
      app.propertyType?.toLowerCase().includes(search.toLowerCase()) ||
      app.lender?.toLowerCase().includes(search.toLowerCase()) ||
      app.id.toString().includes(search);
    
    const matchesStatus = !statusFilter || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort applications by date, with most recent first
  const sortedApplications = [...filteredApplications].sort((a, b) => 
    new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusOptions = [
    { value: null, label: "All Status" },
    { value: "new_lead", label: "New Lead" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "approved", label: "Approved" },
    { value: "funded", label: "Funded" },
    { value: "declined", label: "Declined" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <CardDescription>Manage your client applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <div className="w-full sm:w-1/3">
            <Input
              placeholder="Search by address, property type, lender or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(option => (
              <Button
                key={option.label}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {sortedApplications.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No applications found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {applications.length === 0
                ? "Start by creating your first application"
                : "Try adjusting your search or filters"}
            </p>
            {applications.length === 0 && (
              <Button 
                className="mt-4"
                onClick={() => setLocation("/agent/applications/new")}
              >
                Create Application
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.id}</TableCell>
                    <TableCell>
                      {application.propertyAddress ? (
                        <div>
                          <p className="font-medium">{application.propertyAddress}</p>
                          <p className="text-xs text-muted-foreground">{application.propertyType || "Not specified"}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {application.loanAmount ? (
                        <div>
                          <p className="font-medium">R{application.loanAmount.toLocaleString()}</p>
                          {application.propertyValue && (
                            <p className="text-xs text-muted-foreground">
                              LTV: {Math.round((application.loanAmount / application.propertyValue) * 100)}%
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={application.urgency} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistance(new Date(application.applicationDate), new Date(), { 
                          addSuffix: true 
                        })}
                      </div>
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
                            onClick={() => setLocation(`/agent/applications/${application.id}`)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setLocation(`/agent/applications/${application.id}/edit`)}
                          >
                            Edit Application
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
                            Generate Report
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

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => setLocation("/agent/applications/new")}
          >
            Create Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentApplicationList;