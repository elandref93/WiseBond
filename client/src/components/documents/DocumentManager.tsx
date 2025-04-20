import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  isSubmitted: boolean;
  stage: 'pre-offer' | 'during-offer' | 'accepted-offer';
  category: string;
}

// Initial documents structure - would normally come from backend API
const initialDocuments: Document[] = [
  // Pre-Offer Stage
  {
    id: 'bank-statements',
    name: 'Bank Statements',
    description: '3 months of statements from all accounts.',
    isRequired: true,
    isSubmitted: false,
    stage: 'pre-offer',
    category: 'Financial'
  },
  {
    id: 'pay-slips',
    name: 'Pay Slips',
    description: '3 months of pay slips from your employer.',
    isRequired: true,
    isSubmitted: false,
    stage: 'pre-offer',
    category: 'Financial'
  },
  {
    id: 'id-document',
    name: 'ID Document',
    description: 'Valid South African ID or passport.',
    isRequired: true,
    isSubmitted: false,
    stage: 'pre-offer',
    category: 'Personal'
  },
  {
    id: 'proof-of-address',
    name: 'Proof of Address',
    description: 'Not older than 3 months (utility bill, bank statement, etc).',
    isRequired: true,
    isSubmitted: false,
    stage: 'pre-offer',
    category: 'Personal'
  },
  {
    id: 'bank-statement-analysis',
    name: 'Bank Statement (AI Analysis)',
    description: 'Bank statement for spending analysis and financial recommendations.',
    isRequired: false,
    isSubmitted: false,
    stage: 'pre-offer',
    category: 'Financial'
  },
  
  // During Offer Stage
  {
    id: 'mortgage-offer-letter',
    name: 'Mortgage Offer Letter',
    description: 'The formal offer from your bank with all loan details.',
    isRequired: true,
    isSubmitted: false,
    stage: 'during-offer',
    category: 'Property'
  },
  {
    id: 'sale-agreement',
    name: 'Sale Agreement',
    description: 'The signed agreement of sale for your property.',
    isRequired: true,
    isSubmitted: false,
    stage: 'during-offer',
    category: 'Property'
  },
  
  // Accepted Offer Stage
  {
    id: 'marriage-certificate',
    name: 'Marriage Certificate',
    description: 'If applicable, copy of your marriage certificate.',
    isRequired: false,
    isSubmitted: false,
    stage: 'accepted-offer',
    category: 'Personal'
  },
  {
    id: 'building-insurance',
    name: 'Building Insurance',
    description: 'Proof of building insurance required by your bank.',
    isRequired: true,
    isSubmitted: false,
    stage: 'accepted-offer',
    category: 'Insurance'
  },
  {
    id: 'home-contents-insurance',
    name: 'Home Contents Insurance',
    description: 'Insurance for your household contents and belongings.',
    isRequired: false,
    isSubmitted: false,
    stage: 'accepted-offer',
    category: 'Insurance'
  },
  {
    id: 'transfer-duty-receipt',
    name: 'Transfer Duty Receipt',
    description: 'Proof of payment for transfer duties to SARS.',
    isRequired: true,
    isSubmitted: false,
    stage: 'accepted-offer',
    category: 'Financial'
  },
];

const DocumentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'timeline' | 'category'>('timeline');
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  
  // Calculate completion statistics
  const totalRequired = documents.filter(doc => doc.isRequired).length;
  const completedRequired = documents.filter(doc => doc.isRequired && doc.isSubmitted).length;
  const completionPercentage = Math.round((completedRequired / totalRequired) * 100) || 0;
  
  // Group documents by stage for timeline view
  const preOfferDocs = documents.filter(doc => doc.stage === 'pre-offer');
  const duringOfferDocs = documents.filter(doc => doc.stage === 'during-offer');
  const acceptedOfferDocs = documents.filter(doc => doc.stage === 'accepted-offer');
  
  // Group documents by category for category view
  const categories = Array.from(new Set(documents.map(doc => doc.category)));
  const documentsByCategory = categories.map(category => ({
    category,
    docs: documents.filter(doc => doc.category === category)
  }));
  
  // In a real app, this would be an API call
  const handleFileUpload = (documentId: string) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, isSubmitted: true } 
          : doc
      )
    );
    
    toast({
      title: "Document uploaded",
      description: "Your document has been successfully uploaded",
    });
  };
  
  // Document Card Component
  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="mb-4 border-t-4 border-t-primary">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{document.name}</h3>
            <p className="text-sm text-muted-foreground">{document.description}</p>
          </div>
          {document.isRequired ? (
            <Badge className="bg-blue-500">Required</Badge>
          ) : (
            <Badge variant="outline">Optional</Badge>
          )}
        </div>
        
        {document.isSubmitted ? (
          <div className="flex items-center bg-green-50 p-4 rounded-md">
            <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
            <div>
              <p className="font-medium">Document Uploaded</p>
              <p className="text-sm text-muted-foreground">
                This document has been successfully uploaded
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center border-2 border-dashed rounded-md p-6 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-medium">Drop your document here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, and image files (up to 10MB)
            </p>
            <Button onClick={() => handleFileUpload(document.id)}>
              Upload Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and manage important documents for your home loan application.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="mb-2 flex justify-between items-center">
            <p className="font-medium">Document Completion</p>
            <p className="text-sm text-muted-foreground">
              {completedRequired} of {totalRequired} Required Documents
            </p>
          </div>
          <Progress value={completionPercentage} className="h-2.5 mb-1" />
          <p className="text-sm text-muted-foreground">{completionPercentage}% Complete</p>
        </CardContent>
      </Card>
      
      {/* Document tiles have been removed as requested */}
      
      <Tabs defaultValue="timeline" className="mb-8">
        <div className="flex justify-end mb-6">
          <TabsList>
            <TabsTrigger value="timeline" onClick={() => setViewMode('timeline')}>
              Timeline
            </TabsTrigger>
            <TabsTrigger value="category" onClick={() => setViewMode('category')}>
              Category
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="timeline">
          <Accordion type="single" collapsible className="w-full" defaultValue="pre-offer">
            <AccordionItem value="pre-offer" className="mb-4 border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center">
                  <span className="text-xl font-semibold">Pre-Offer Stage</span>
                  <Badge className="ml-3 bg-slate-100 text-slate-800">
                    {preOfferDocs.filter(doc => doc.isSubmitted).length} of {preOfferDocs.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                {preOfferDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="during-offer" className="mb-4 border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center">
                  <span className="text-xl font-semibold">During Offer Stage</span>
                  <Badge className="ml-3 bg-slate-100 text-slate-800">
                    {duringOfferDocs.filter(doc => doc.isSubmitted).length} of {duringOfferDocs.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                {duringOfferDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="accepted-offer" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center">
                  <span className="text-xl font-semibold">Accepted Offer Stage</span>
                  <Badge className="ml-3 bg-slate-100 text-slate-800">
                    {acceptedOfferDocs.filter(doc => doc.isSubmitted).length} of {acceptedOfferDocs.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pt-2 pb-6">
                {acceptedOfferDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        
        <TabsContent value="category">
          <Accordion type="single" collapsible className="w-full" defaultValue={categories[0]}>
            {documentsByCategory.map(({ category, docs }) => (
              <AccordionItem key={category} value={category} className="mb-4 border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center">
                    <span className="text-xl font-semibold">{category} Documents</span>
                    <Badge className="ml-3 bg-slate-100 text-slate-800">
                      {docs.filter(doc => doc.isSubmitted).length} of {docs.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-2 pb-6">
                  {docs.map(doc => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Documents you have already uploaded for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.filter(doc => doc.isSubmitted).length > 0 ? (
            <div className="space-y-4">
              {documents
                .filter(doc => doc.isSubmitted)
                .map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">Uploaded on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-1">No documents uploaded yet</h3>
              <p className="text-muted-foreground">
                Upload the required documents above to start your home loan application process.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;