import React from 'react';
import DocumentManager from '@/components/documents/DocumentManager';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

const DocumentsPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Redirect to login if user is not authenticated
  if (!isLoading && !user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DocumentManager />
    </div>
  );
};

export default DocumentsPage;