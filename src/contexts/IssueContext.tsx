import React, { createContext, useContext, useState } from 'react';
import { CivicIssue, IssueStatus } from '@/types/issue';
import { mockIssues } from '@/data/mockIssues';

interface IssueContextType {
  issues: CivicIssue[];
  addIssue: (issue: Omit<CivicIssue, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  getUserIssues: (userId: string) => CivicIssue[];
  getIssuesByStatus: (userId: string, status: IssueStatus | IssueStatus[]) => CivicIssue[];
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

export function IssueProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<CivicIssue[]>(mockIssues);

  const addIssue = (issue: Omit<CivicIssue, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newIssue: CivicIssue = {
      ...issue,
      id: `issue_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setIssues(prev => [newIssue, ...prev]);
  };

  const updateIssueStatus = (id: string, status: IssueStatus) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id 
        ? { ...issue, status, updatedAt: new Date(), resolvedAt: status === 'completed' ? new Date() : issue.resolvedAt }
        : issue
    ));
  };

  const getUserIssues = (userId: string) => {
    return issues.filter(issue => issue.userId === userId);
  };

  const getIssuesByStatus = (userId: string, status: IssueStatus | IssueStatus[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return issues.filter(issue => issue.userId === userId && statuses.includes(issue.status));
  };

  return (
    <IssueContext.Provider value={{
      issues,
      addIssue,
      updateIssueStatus,
      getUserIssues,
      getIssuesByStatus,
    }}>
      {children}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssueContext);
  if (context === undefined) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
}
