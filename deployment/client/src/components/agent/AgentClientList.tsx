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
import { Loader2, Search, Filter, Users, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

interface ClientApplication {
  id: number;
  clientId: number;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  status: string;
  loanAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientData {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  applicationCount: number;
  latestApplication?: Date;
  status: string;
}

interface AgentClientListProps {
  applications?: ClientApplication[];
  isLoading?: boolean;
}

const AgentClientList: React.FC<AgentClientListProps> = ({
  applications = [],
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Process applications to get client data
  const clientsMap = new Map<number, ClientData>();
  
  applications.forEach(app => {
    if (!clientsMap.has(app.clientId)) {
      clientsMap.set(app.clientId, {
        id: app.clientId,
        name: app.clientName || `Client #${app.clientId}`,
        phone: app.clientPhone,
        email: app.clientEmail,
        applicationCount: 1,
        latestApplication: new Date(app.createdAt),
        status: app.status
      });
    } else {
      const clientData = clientsMap.get(app.clientId)!;
      clientData.applicationCount += 1;
      
      // Update latest application date if this one is newer
      const appDate = new Date(app.createdAt);
      if (appDate > clientData.latestApplication!) {
        clientData.latestApplication = appDate;
        clientData.status = app.status;
      }
    }
  });

  const clients = Array.from(clientsMap.values());

  // Apply filters
  const filteredClients = clients.filter((client) => {
    // Status filter
    if (statusFilter !== "all" && client.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = client.name.toLowerCase().includes(searchLower);
      const emailMatch = client.email?.toLowerCase().includes(searchLower);
      const phoneMatch = client.phone?.toLowerCase().includes(searchLower);
      
      if (!(nameMatch || emailMatch || phoneMatch)) {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
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
        <CardTitle>Clients</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Latest Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {client.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3 w-3" />
                            <span className="truncate max-w-[180px]">
                              {client.email}
                            </span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="mr-2 h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{client.applicationCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell>
                      {client.latestApplication 
                        ? new Date(client.latestApplication).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/agent/clients/${client.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
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
                <h3 className="font-semibold text-xl">No matching clients</h3>
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
                <Users className="h-8 w-8 text-muted-foreground" />
                <h3 className="font-semibold text-xl">No clients yet</h3>
                <p className="text-muted-foreground">
                  When you start adding clients, they will appear here
                </p>
                <Link href="/agent/clients/new">
                  <Button className="mt-2">
                    Add Client
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

export default AgentClientList;