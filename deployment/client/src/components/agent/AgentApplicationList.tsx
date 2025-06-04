import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface ClientApplication {
  id: number;
  clientId: number;
  clientName?: string;
  status: string;
  loanAmount?: number;
  commissionEarned?: number;
  commissionPaidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  propertyAddress?: string;
  loanTerm?: number;
  interestRate?: number;
  bankName?: string;
}

interface AgentApplicationListProps {
  applications?: ClientApplication[];
  isLoading?: boolean;
}

const AgentApplicationList: React.FC<AgentApplicationListProps> = ({
  applications = [],
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Apply filters
  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }
    
    // Search filter (search by client name, property address, or bank)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const clientNameMatch = app.clientName?.toLowerCase().includes(searchLower);
      const propertyMatch = app.propertyAddress?.toLowerCase().includes(searchLower);
      const bankMatch = app.bankName?.toLowerCase().includes(searchLower);
      
      if (!(clientNameMatch || propertyMatch || bankMatch)) {
        return false;
      }
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case "declined":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Declined</Badge>;
      case "in_review":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">In Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export initiated",
      description: "Your application data is being exported...",
    });
    // Implement actual export functionality here
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle>Applications</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportData}>
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.clientName || `Client #${application.clientId}`}
                    </TableCell>
                    <TableCell>
                      {application.propertyAddress || "No address"}
                    </TableCell>
                    <TableCell>
                      {application.loanAmount
                        ? `R${application.loanAmount.toLocaleString()}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell>
                      {application.bankName || "N/A"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/agent/applications/${application.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10">
            {searchTerm || statusFilter !== "all" ? (
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold text-xl">No matching applications</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold text-xl">No applications yet</h3>
                <p className="text-muted-foreground">
                  When you start managing applications, they will appear here
                </p>
                <Link href="/agent/applications/new">
                  <Button className="mt-2">
                    Add Application
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentApplicationList;