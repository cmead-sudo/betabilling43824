import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/pages/Index';

export interface ExportLog {
  id: string;
  type: 'pdf' | 'csv';
  timestamp: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  consultant: string;
  budget: string;
  budgetAmount: number;
  milestones: {
    id: string;
    name: string;
    amount: number;
    status: string;
  }[];
  budgetConsumed: number;
  dataVerified: number;
}

export interface Consultant {
  id: string;
  name: string;
  specialty: string;
  rate: string;
  reliability: number;
  status: string;
}

let exportLogs: ExportLog[] = [];

export const getExportLogs = () => exportLogs;

export const addExportLog = (type: 'pdf' | 'csv', description: string) => {
  const log: ExportLog = {
    id: `export-${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    description,
  };
  exportLogs = [log, ...exportLogs];
  return log;
};

export const exportToPDF = (
  projects: Project[],
  transactions: Transaction[],
  consultants: Consultant[],
  walletBalance: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246);
  doc.text('Pharmaloom', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Complete Data Export Report', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 35, { align: 'center' });
  
  // Wallet Summary
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Wallet Summary', 14, 50);
  
  doc.setFontSize(12);
  doc.text(`Current Balance: $${walletBalance.toLocaleString()}`, 14, 58);
  
  // Projects Table
  doc.setFontSize(16);
  doc.text('Projects', 14, 72);
  
  autoTable(doc, {
    startY: 76,
    head: [['Name', 'Status', 'Progress', 'Consultant', 'Budget', 'Budget Consumed', 'Data Verified']],
    body: projects.map(p => [
      p.name,
      p.status,
      `${p.progress}%`,
      p.consultant,
      p.budget,
      `${p.budgetConsumed}%`,
      `${p.dataVerified}%`
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Get current Y position after table
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Milestones for each project
  doc.setFontSize(16);
  doc.text('Project Milestones', 14, currentY);
  currentY += 4;
  
  const allMilestones: string[][] = [];
  projects.forEach(project => {
    project.milestones.forEach(m => {
      allMilestones.push([
        project.name,
        m.name,
        `$${m.amount.toLocaleString()}`,
        m.status
      ]);
    });
  });
  
  autoTable(doc, {
    startY: currentY,
    head: [['Project', 'Milestone', 'Amount', 'Status']],
    body: allMilestones,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Transactions Table
  doc.setFontSize(16);
  doc.text('Transactions', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Description', 'Amount', 'Type', 'Date', 'Status']],
    body: transactions.map(t => [
      t.description,
      `$${t.amount.toLocaleString()}`,
      t.type,
      t.date,
      t.status
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Consultants Table
  doc.setFontSize(16);
  doc.text('Talent Pool', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Name', 'Specialty', 'Rate', 'Reliability', 'Status']],
    body: consultants.map(c => [
      c.name,
      c.specialty,
      c.rate,
      `${c.reliability}%`,
      c.status
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Export Logs
  doc.setFontSize(16);
  doc.text('Export History', 14, currentY);
  
  const logs = getExportLogs();
  if (logs.length > 0) {
    autoTable(doc, {
      startY: currentY + 4,
      head: [['Type', 'Timestamp', 'Description']],
      body: logs.map(l => [
        l.type.toUpperCase(),
        new Date(l.timestamp).toLocaleString(),
        l.description
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  } else {
    doc.setFontSize(10);
    doc.text('No previous exports recorded.', 14, currentY + 8);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Pharmaloom Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Log this export
  addExportLog('pdf', 'Full data export to PDF');
  
  // Save the PDF
  doc.save(`pharmaloom-export-${new Date().toISOString().split('T')[0]}.pdf`);
  
  return true;
};

export const exportToCSV = (
  projects: Project[],
  transactions: Transaction[],
  consultants: Consultant[],
  walletBalance: number
) => {
  const lines: string[] = [];
  
  // Header
  lines.push('PHARMALOOM DATA EXPORT');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Wallet Summary
  lines.push('=== WALLET SUMMARY ===');
  lines.push(`Current Balance,$${walletBalance.toLocaleString()}`);
  lines.push('');
  
  // Projects
  lines.push('=== PROJECTS ===');
  lines.push('Name,Status,Progress,Consultant,Budget,Budget Consumed,Data Verified');
  projects.forEach(p => {
    lines.push(`"${p.name}","${p.status}",${p.progress}%,"${p.consultant}","${p.budget}",${p.budgetConsumed}%,${p.dataVerified}%`);
  });
  lines.push('');
  
  // Milestones
  lines.push('=== PROJECT MILESTONES ===');
  lines.push('Project,Milestone,Amount,Status');
  projects.forEach(project => {
    project.milestones.forEach(m => {
      lines.push(`"${project.name}","${m.name}",$${m.amount.toLocaleString()},"${m.status}"`);
    });
  });
  lines.push('');
  
  // Transactions
  lines.push('=== TRANSACTIONS ===');
  lines.push('Description,Amount,Type,Date,Status');
  transactions.forEach(t => {
    lines.push(`"${t.description}",$${t.amount.toLocaleString()},"${t.type}","${t.date}","${t.status}"`);
  });
  lines.push('');
  
  // Consultants
  lines.push('=== TALENT POOL ===');
  lines.push('Name,Specialty,Rate,Reliability,Status');
  consultants.forEach(c => {
    lines.push(`"${c.name}","${c.specialty}","${c.rate}",${c.reliability}%,"${c.status}"`);
  });
  lines.push('');
  
  // Export Logs
  lines.push('=== EXPORT HISTORY ===');
  lines.push('Type,Timestamp,Description');
  const logs = getExportLogs();
  logs.forEach(l => {
    lines.push(`"${l.type.toUpperCase()}","${new Date(l.timestamp).toLocaleString()}","${l.description}"`);
  });
  
  // Log this export
  addExportLog('csv', 'Full data export to CSV');
  
  // Create and download file
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pharmaloom-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  
  return true;
};
