import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, File, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentProps {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  isSubmitted: boolean;
  category: string;
  stage: "pre-offer" | "during-offer" | "accepted-offer";
}

const initialDocuments: DocumentProps[] = [
  // Pre-Offer Stage
  {
    id: "bank-statements",
    name: "Bank Statements",
    description: "3 months of statements from all accounts.",
    isRequired: true,
    isSubmitted: false,
    category: "Financial",
    stage: "pre-offer"
  },
  {
    id: "pay-slips",
    name: "Pay Slips",
    description: "3 months of pay slips from your employer.",
    isRequired: true,
    isSubmitted: false,
    category: "Financial",
    stage: "pre-offer"
  },
  {
    id: "id-document",
    name: "ID Document",
    description: "Valid South African ID or passport.",
    isRequired: true,
    isSubmitted: false,
    category: "Personal",
    stage: "pre-offer"
  },
  {
    id: "proof-of-address",
    name: "Proof of Address",
    description: "Not older than 3 months (utility bill, bank statement, etc).",
    isRequired: true,
    isSubmitted: false,
    category: "Personal",
    stage: "pre-offer"
  },
  {
    id: "bank-statement-analysis",
    name: "Bank Statement (AI Analysis)",
    description: "Bank statement for spending analysis and financial recommendations.",
    isRequired: false,
    isSubmitted: false,
    category: "Financial",
    stage: "pre-offer"
  },
  
  // During Offer Stage
  {
    id: "mortgage-offer-letter",
    name: "Mortgage Offer Letter",
    description: "The formal offer from your bank with all loan details.",
    isRequired: true,
    isSubmitted: false,
    category: "Property",
    stage: "during-offer"
  },
  {
    id: "sale-agreement",
    name: "Sale Agreement",
    description: "The signed agreement of sale for your property.",
    isRequired: true,
    isSubmitted: false,
    category: "Property",
    stage: "during-offer"
  },
  
  // Accepted Offer Stage
  {
    id: "marriage-certificate",
    name: "Marriage Certificate",
    description: "If applicable, copy of your marriage certificate.",
    isRequired: false,
    isSubmitted: false,
    category: "Personal",
    stage: "accepted-offer"
  },
  {
    id: "building-insurance",
    name: "Building Insurance",
    description: "Proof of building insurance required by your bank.",
    isRequired: true,
    isSubmitted: false,
    category: "Insurance",
    stage: "accepted-offer"
  },
  {
    id: "home-contents-insurance",
    name: "Home Contents Insurance",
    description: "Insurance for your household contents and belongings.",
    isRequired: false,
    isSubmitted: false,
    category: "Insurance",
    stage: "accepted-offer"
  },
  {
    id: "transfer-duty-receipt",
    name: "Transfer Duty Receipt",
    description: "Proof of payment for transfer duties to SARS.",
    isRequired: true,
    isSubmitted: false,
    category: "Financial",
    stage: "accepted-offer"
  },
];

const AgentDocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentProps[]>(initialDocuments);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "category">("timeline");

  // Calculate completion statistics
  const totalDocuments = documents.length;
  const requiredDocuments = documents.filter(doc => doc.isRequired).length;
  const submittedDocuments = documents.filter(doc => doc.isSubmitted).length;
  const requiredSubmitted = documents.filter(doc => doc.isRequired && doc.isSubmitted).length;
  const completionPercentage = Math.round((requiredSubmitted / requiredDocuments) * 100) || 0;

  const handleUpload = (documentId: string) => {
    setDocuments(
      documents.map(doc =>
        doc.id === documentId ? { ...doc, isSubmitted: true } : doc
      )
    );
  };

  const handleRemove = (documentId: string) => {
    setDocuments(
      documents.map(doc =>
        doc.id === documentId ? { ...doc, isSubmitted: false } : doc
      )
    );
  };

  // Group documents by their stages for timeline view
  const preOfferDocs = documents.filter(doc => doc.stage === "pre-offer");
  const duringOfferDocs = documents.filter(doc => doc.stage === "during-offer");
  const acceptedOfferDocs = documents.filter(doc => doc.stage === "accepted-offer");

  // Group documents by their categories for category view
  const categories = Array.from(new Set(documents.map(doc => doc.category)));
  const documentsByCategory = categories.map(category => ({
    category,
    docs: documents.filter(doc => doc.category === category),
  }));

  const DocumentUploadCard: React.FC<{
    document: DocumentProps;
    onUpload: (id: string) => void;
    onRemove: (id: string) => void;
  }> = ({ document, onUpload, onRemove }) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{document.name}</CardTitle>
            <CardDescription>{document.description}</CardDescription>
          </div>
          {document.isRequired ? (
            <Badge className="bg-blue-500 hover:bg-blue-600">Required</Badge>
          ) : (
            <Badge variant="outline">Optional</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {document.isSubmitted ? (
          <div className="flex flex-col items-center space-y-3 py-4 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <p className="font-medium">Document Uploaded</p>
              <p className="text-sm text-muted-foreground">
                This document has been successfully uploaded
              </p>
            </div>
            <Button variant="outline" onClick={() => onRemove(document.id)}>
              Remove Document
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 p-4 text-center border-2 border-dashed rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Drop your document here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOCX, and image files (up to 10MB)
            </p>
            <Button onClick={() => onUpload(document.id)}>Upload Document</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Manage client documents for their bond application
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Implement client selection functionality
                }}
              >
                Select Client
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Implement document download functionality
                }}
              >
                Download All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">
                Document Completion: {completionPercentage}%
              </p>
              <p className="text-sm text-muted-foreground">
                {requiredSubmitted} of {requiredDocuments} Required Documents
              </p>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <Tabs defaultValue="timeline" className="w-full">
            <div className="flex justify-end mb-4">
              <TabsList>
                <TabsTrigger value="timeline" onClick={() => setViewMode("timeline")}>
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="category" onClick={() => setViewMode("category")}>
                  Category
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pre-offer" className="border rounded-lg mb-4">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-semibold text-lg">Pre-Offer Stage</span>
                      <Badge className="ml-2 bg-gray-200 text-gray-700">
                        {preOfferDocs.filter(doc => doc.isSubmitted).length} / {preOfferDocs.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    {preOfferDocs.map(doc => (
                      <DocumentUploadCard
                        key={doc.id}
                        document={doc}
                        onUpload={handleUpload}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="during-offer" className="border rounded-lg mb-4">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-semibold text-lg">During Offer Stage</span>
                      <Badge className="ml-2 bg-gray-200 text-gray-700">
                        {duringOfferDocs.filter(doc => doc.isSubmitted).length} / {duringOfferDocs.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    {duringOfferDocs.map(doc => (
                      <DocumentUploadCard
                        key={doc.id}
                        document={doc}
                        onUpload={handleUpload}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="accepted-offer" className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-semibold text-lg">Accepted Offer Stage</span>
                      <Badge className="ml-2 bg-gray-200 text-gray-700">
                        {acceptedOfferDocs.filter(doc => doc.isSubmitted).length} / {acceptedOfferDocs.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    {acceptedOfferDocs.map(doc => (
                      <DocumentUploadCard
                        key={doc.id}
                        document={doc}
                        onUpload={handleUpload}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="category">
              <Accordion type="single" collapsible className="w-full">
                {documentsByCategory.map(({ category, docs }) => (
                  <AccordionItem key={category} value={category} className="border rounded-lg mb-4">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center">
                        <span className="font-semibold text-lg">{category} Documents</span>
                        <Badge className="ml-2 bg-gray-200 text-gray-700">
                          {docs.filter(doc => doc.isSubmitted).length} / {docs.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4">
                      {docs.map(doc => (
                        <DocumentUploadCard
                          key={doc.id}
                          document={doc}
                          onUpload={handleUpload}
                          onRemove={handleRemove}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDocumentManager;