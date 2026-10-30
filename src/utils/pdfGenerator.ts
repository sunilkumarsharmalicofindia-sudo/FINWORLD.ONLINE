import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Agent, LoanFile, FinancialTransaction, MonthlyReconciliation, ProductSlabConfig } from '../types';
import { formatINR, formatDate } from './formatters';
import { DEFAULT_PRODUCT_SLABS } from '../components/AgentCommissionCalculator';

// Format plain number for PDF table (jsPDF default fonts can struggle with the Rupee symbol, so Rs. is standard and crystal clear)
const formatPDFCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + amount.toLocaleString('en-IN');
};

/**
 * Generates an executive-grade, standalone PDF document for an Agent Account Statement
 * Includes Configured Multi-Product Commission Slabs, Disbursals, and Remittances
 */
export const generateAgentStatementPDF = (
  agent: Agent,
  loanFiles: LoanFile[],
  transactions: FinancialTransaction[],
  customSlabs?: ProductSlabConfig[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Theme Colors (Fintech Emerald & Navy)
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const accentNavy: [number, number, number] = [30, 58, 138]; // Blue 900

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Accent Line
  doc.setFillColor(...emeraldColor);
  doc.rect(0, 75, pageWidth, 4, 'F');

  // Title & Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DSA MITRA FINANCIAL NETWORK', 40, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Pan-India Channel Partner Finance & Commission Distribution Desk', 40, 50);
  doc.text('GSTIN: 27AABCS1429K1ZX | CIN: U67190MH2024PTC11234', 40, 63);

  // Document Type Header Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('COMMISSION STATEMENT', pageWidth - 40, 35, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`DATE: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 40, 50, { align: 'right' });
  doc.text(`REF: STM-${agent.code}-${Date.now().toString().slice(-4)}`, pageWidth - 40, 63, { align: 'right' });

  // Agent Profile Summary Box
  let currentY = 100;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, currentY, pageWidth - 80, 75, 4, 4, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${agent.name} (${agent.agencyName})`, 52, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Agent Code: ${agent.code} | City: ${agent.city}`, 52, currentY + 35);
  doc.text(`Mobile: ${agent.mobile} | Email: ${agent.email}`, 52, currentY + 49);
  doc.text(`Default Slab Rate: ${agent.defaultCommissionRate}%`, 52, currentY + 63);

  // Bank Account & Tax info on right side of profile box
  doc.text(`Bank A/C: ${agent.bankAccountNo || 'N/A'}`, pageWidth / 2 + 30, currentY + 20);
  doc.text(`IFSC: ${agent.ifsc || 'N/A'}`, pageWidth / 2 + 30, currentY + 35);
  doc.text(`PAN: ${agent.panNumber || 'N/A'}`, pageWidth / 2 + 30, currentY + 49);
  doc.text(`Status: ${agent.status} Channel Partner`, pageWidth / 2 + 30, currentY + 63);

  // Calculations
  const agentFiles = loanFiles.filter(f => f.agentId === agent.id && f.status === 'Disbursed');
  const agentTx = transactions.filter(t => t.agentId === agent.id && t.type === 'Outflow');

  const totalVolume = agentFiles.reduce((s, f) => s + (f.loanAmount || 0), 0);
  const totalCommissionEarned = agentFiles.reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
  const totalCommissionPaid = agentFiles.reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);
  const balanceDue = Math.max(0, totalCommissionEarned - totalCommissionPaid);

  currentY = 190;

  // 4 KPI Summary Metric Boxes
  const boxWidth = (pageWidth - 80 - 30) / 4;

  const kpis = [
    { label: 'DISBURSED VOLUME', val: formatPDFCurrency(totalVolume), color: [15, 23, 42] },
    { label: 'GROSS COMMISSION', val: formatPDFCurrency(totalCommissionEarned), color: [30, 58, 138] },
    { label: 'COMMISSION SETTLED', val: formatPDFCurrency(totalCommissionPaid), color: [5, 150, 105] },
    { label: 'NET BALANCE DUE', val: formatPDFCurrency(balanceDue), color: balanceDue > 0 ? [217, 119, 6] : [5, 150, 105] }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 40 + idx * (boxWidth + 10);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, 42, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 8, currentY + 14);

    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 8, currentY + 30);
  });

  currentY = 250;

  // Table 1: Loan Files & Sourcing Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. SOURCED LOAN FILES & COMMISSION DETAILS', 40, currentY);

  const fileRows = agentFiles.map(f => [
    f.fileNo,
    f.borrowerName,
    f.bankName,
    formatDate(f.disbursedDate),
    formatPDFCurrency(f.loanAmount),
    `${f.agentPayoutRate}%`,
    formatPDFCurrency(f.agentPayoutAmount),
    formatPDFCurrency(f.agentPayoutPaid || 0),
    f.agentPayoutStatus
  ]);

  autoTable(doc, {
    startY: currentY + 8,
    head: [['File No', 'Borrower', 'Bank', 'Disbursed', 'Loan Amount', 'Rate', 'Commission', 'Paid', 'Status']],
    body: fileRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'right' },
      8: { halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  // Next section after autoTable
  let finalY = (doc as any).lastAutoTable.finalY + 25;

  // Check if we need page break
  if (finalY > pageHeight - 160) {
    doc.addPage();
    finalY = 50;
  }

  // Table 2: Settlement & Remittance History
  if (agentTx.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('2. COMMISSION REMITTANCE & BANK SETTLEMENT HISTORY', 40, finalY);

    const txRows = agentTx.map(t => [
      formatDate(t.date),
      t.paymentMode,
      t.referenceNo,
      t.description,
      formatPDFCurrency(t.amount)
    ]);

    autoTable(doc, {
      startY: finalY + 8,
      head: [['Date', 'Mode', 'Bank Reference / UTR', 'Particulars', 'Amount Settled']],
      body: txRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
      },
      margin: { left: 40, right: 40 }
    });

    finalY = (doc as any).lastAutoTable.finalY + 25;
  }

  // Table 3: Configured Multi-Product Commission Slab Schedule
  const activeSlabs: ProductSlabConfig[] = customSlabs && customSlabs.length > 0 
    ? customSlabs 
    : (() => {
        try {
          const s = localStorage.getItem('dsa_product_slabs');
          return s ? JSON.parse(s) : DEFAULT_PRODUCT_SLABS;
        } catch {
          return DEFAULT_PRODUCT_SLABS;
        }
      })();

  if (activeSlabs && activeSlabs.length > 0) {
    if (finalY > pageHeight - 160) {
      doc.addPage();
      finalY = 50;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('3. APPROVED MULTI-PRODUCT COMMISSION SLAB SCHEDULE (EDITABLE SCHEDULE)', 40, finalY);

    const slabRows = activeSlabs.map(s => [
      s.product,
      `${s.baseRate}%`,
      s.tierBonusRate > 0 ? `+${s.tierBonusRate}%` : 'Standard',
      s.tierThreshold > 0 ? formatPDFCurrency(s.tierThreshold) : 'Base Slab',
      s.notes || 'Configured slab'
    ]);

    autoTable(doc, {
      startY: finalY + 8,
      head: [['Loan Product', 'Base Commission %', 'Volume Tier Bonus', 'Bonus Threshold', 'Notes / Remarks']],
      body: slabRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold', textColor: [30, 58, 138] },
        2: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
        3: { halign: 'right' }
      },
      margin: { left: 40, right: 40 }
    });

    finalY = (doc as any).lastAutoTable.finalY + 30;
  }

  // Check page bottom for footer
  if (finalY > pageHeight - 110) {
    doc.addPage();
    finalY = 50;
  }

  // Legal Declaration & Signature Area
  doc.setDrawColor(203, 213, 225);
  doc.line(40, finalY, pageWidth - 40, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This is a certified financial document generated by DSA Mitra Channel Network. Applicable TDS is deducted in compliance with Section 194H of the Income Tax Act 1961. Multi-product slabs above reflect active contractual payout agreement.',
    40,
    finalY + 16,
    { maxWidth: pageWidth - 190 }
  );

  // Digital Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('FOR DSA MITRA CHANNEL NETWORK', pageWidth - 40, finalY + 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Finance Signatory', pageWidth - 40, finalY + 28, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.text('[Digitally Verified & Locked]', pageWidth - 40, finalY + 45, { align: 'right' });

  // Save the PDF
  doc.save(`${agent.code}_Commission_Statement_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generates an executive-grade standalone PDF Rate Card for Multi-Product Slabs
 */
export const generateProductSlabsRateCardPDF = (
  slabs: ProductSlabConfig[],
  agent?: Agent
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [15, 23, 42];
  const emeraldColor: [number, number, number] = [16, 185, 129];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setFillColor(...emeraldColor);
  doc.rect(0, 75, pageWidth, 4, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DSA MITRA FINANCIAL NETWORK', 40, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Official Multi-Product Commission Slab Schedule & Channel Rate Card', 40, 50);
  doc.text('GSTIN: 27AABCS1429K1ZX | CIR-NO: 2026/FIN-SLAB/09', 40, 63);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RATE CARD SCHEDULE', pageWidth - 40, 35, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`EFFECTIVE: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 40, 50, { align: 'right' });
  doc.text(agent ? `ASSIGNED: ${agent.name} (${agent.code})` : 'ALL ACTIVE CHANNELS', pageWidth - 40, 63, { align: 'right' });

  let currentY = 100;

  // Overview Note Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, currentY, pageWidth - 80, 50, 4, 4, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Channel Partner Commission Policy & Volume Bonus Terms', 52, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Commissions are disbursed on monthly net file realizations. Files exceeding the Tier Threshold qualify for the additional Volume Tier Bonus (+%). Payouts are subject to 5% TDS under Section 194H.',
    52,
    currentY + 34,
    { maxWidth: pageWidth - 104 }
  );

  currentY = 165;

  // Table
  const rows = slabs.map(s => [
    s.product,
    `${s.baseRate}%`,
    s.tierBonusRate > 0 ? `+${s.tierBonusRate}%` : 'Standard',
    s.tierThreshold > 0 ? formatPDFCurrency(s.tierThreshold) : 'Base Slab',
    `${(s.baseRate + s.tierBonusRate).toFixed(2)}%`,
    s.notes || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Loan Product Vertical', 'Base Slab %', 'Tier Bonus (+%)', 'Volume Threshold', 'Max Slab %', 'Remarks']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold', textColor: [30, 58, 138] },
      2: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 35;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(40, finalY, pageWidth - 40, finalY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('DSA CHANNEL ACCEPTANCE', 40, finalY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(agent ? `${agent.name} (${agent.agencyName})` : 'Authorized Sourcing Sub-DSA', 40, finalY + 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FOR DSA MITRA FINANCIAL NETWORK', pageWidth - 40, finalY + 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Finance Signatory', pageWidth - 40, finalY + 32, { align: 'right' });

  doc.save(`Multi_Product_Commission_Slabs_RateCard_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generates an executive-grade, standalone PDF document for Monthly Bank Channel Reconciliation
 */
export const generateMonthlyReconciliationPDF = (
  monthYear: string,
  bankFilter: string,
  reconciliations: MonthlyReconciliation[],
  monthFiles: LoanFile[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const tealColor: [number, number, number] = [13, 148, 136]; // Teal 600

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Accent Line
  doc.setFillColor(...tealColor);
  doc.rect(0, 75, pageWidth, 4, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DSA MITRA - MONTHLY RECONCILIATION AUDIT', 40, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('3-Way Disbursal vs Inflow Remittance vs Sub-Agent Commission Audit', 40, 50);
  doc.text(`Audit Period: ${monthYear} | Target Scope: ${bankFilter === 'all' ? 'All Partner Banks' : bankFilter}`, 40, 63);

  // Document Type Header Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CERTIFIED AUDIT REPORT', pageWidth - 40, 35, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`AUDIT COMPLETED: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 40, 50, { align: 'right' });
  doc.text(`AUDIT ID: AUD-REC-${monthYear.replace('-', '')}`, pageWidth - 40, 63, { align: 'right' });

  // Aggregates
  const totalVolume = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.loanAmount || 0), 0);
  const expectedBankPayout = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.bankPayoutAmount || 0), 0);
  const actualBankReceived = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.bankPayoutReceived || 0), 0);
  const netVariance = actualBankReceived - expectedBankPayout;
  const agentCommissionPaid = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);

  // 4 KPI Summary Metric Boxes
  let currentY = 95;
  const boxWidth = (pageWidth - 80 - 30) / 4;

  const kpis = [
    { label: 'TOTAL DISBURSED', val: formatPDFCurrency(totalVolume), color: [15, 23, 42] },
    { label: 'EXPECTED BANK INFLOW', val: formatPDFCurrency(expectedBankPayout), color: [30, 58, 138] },
    { label: 'ACTUAL BANK REMITTANCE', val: formatPDFCurrency(actualBankReceived), color: [13, 148, 136] },
    { label: 'VARIANCE SHORTFALL', val: formatPDFCurrency(netVariance), color: netVariance < 0 ? [225, 29, 72] : [13, 148, 136] }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 40 + idx * (boxWidth + 10);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, 42, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 8, currentY + 14);

    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 8, currentY + 30);
  });

  currentY = 155;

  // Table 1: Bank Channel Reconciliation Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. BANK CHANNEL RECONCILIATION SUMMARY MATRIX', 40, currentY);

  const matrixRows = reconciliations.map(r => [
    r.bankName,
    formatPDFCurrency(r.totalDisbursedVolume),
    formatPDFCurrency(r.expectedBankPayout),
    formatPDFCurrency(r.receivedBankPayout),
    formatPDFCurrency(r.variance),
    formatPDFCurrency(r.agentCommissionPaid),
    `${r.reconciledFilesCount} / ${r.reconciledFilesCount + r.unreconciledFilesCount}`,
    r.status
  ]);

  autoTable(doc, {
    startY: currentY + 8,
    head: [['Bank Name', 'Disbursed Volume', 'Expected Inflow', 'Actual Remittance', 'Variance', 'Sub-DSA Paid', 'Files', 'Status']],
    body: matrixRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 25;

  if (finalY > pageHeight - 160) {
    doc.addPage();
    finalY = 50;
  }

  // Table 2: Detailed File Disbursal Audit
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. AUDITED DISBURSED FILES & VARIANCE STATUS', 40, finalY);

  const fileAuditRows = monthFiles.map(f => [
    f.fileNo,
    f.borrowerName,
    f.bankName,
    formatPDFCurrency(f.loanAmount),
    `${f.bankPayoutRate}%`,
    formatPDFCurrency(f.bankPayoutAmount),
    formatPDFCurrency(f.bankPayoutReceived || 0),
    formatPDFCurrency((f.bankPayoutReceived || 0) - f.bankPayoutAmount),
    f.isReconciled ? 'RECONCILED' : 'DISCREPANCY'
  ]);

  autoTable(doc, {
    startY: finalY + 8,
    head: [['File No', 'Borrower', 'Bank', 'Loan Amount', 'Bank %', 'Expected (Rs)', 'Actual (Rs)', 'Variance', 'Audit Status']],
    body: fileAuditRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  finalY = (doc as any).lastAutoTable.finalY + 30;

  if (finalY > pageHeight - 100) {
    doc.addPage();
    finalY = 50;
  }

  // Sign off & declaration
  doc.setDrawColor(203, 213, 225);
  doc.line(40, finalY, pageWidth - 40, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This reconciliation report is authorized under internal control protocols. Variances due to 5% TDS deductions under Section 194H or slab cuts have been highlighted for accounting ledger reconciliation.',
    40,
    finalY + 16,
    { maxWidth: pageWidth - 190 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('AUDITED & VERIFIED BY CHIEF ACCOUNTANT', pageWidth - 40, finalY + 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DSA Mitra Corporate Finance Desk', pageWidth - 40, finalY + 28, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.text('[Certificate Hash: REC-OCT-2026-OK]', pageWidth - 40, finalY + 45, { align: 'right' });

  // Save the PDF
  doc.save(`Monthly_Reconciliation_Audit_${monthYear}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
