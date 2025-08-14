import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
  dashboardStats: {
    totalMembers: number;
    activeMembers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalClasses: number;
    averageAttendance: number;
  };
  paymentAnalytics: {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    monthlyTrend: Array<{ month: string; amount: number; count: number }>;
  };
  attendanceData: Array<{ date: string; count: number }>;
  membershipData: Array<{ planName: string; count: number; revenue: number }>;
  dateRange: { from: Date; to: Date };
}

class ExportService {
  async exportToPDF(data: ExportData, elementId?: string): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Gym Analytics Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const dateRange = `${data.dateRange.from.toLocaleDateString()} - ${data.dateRange.to.toLocaleDateString()}`;
      pdf.text(`Report Period: ${dateRange}`, 20, 40);
      
      let yPosition = 60;
      
      // Key Metrics Section
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Key Metrics', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      const metrics = [
        ['Total Members', data.dashboardStats.totalMembers.toString()],
        ['Active Members', data.dashboardStats.activeMembers.toString()],
        ['Total Revenue', `${data.dashboardStats.totalRevenue.toLocaleString()} ETB`],
        ['Monthly Revenue', `${data.dashboardStats.monthlyRevenue.toLocaleString()} ETB`],
        ['Total Classes', data.dashboardStats.totalClasses.toString()],
        ['Average Attendance', data.dashboardStats.averageAttendance.toString()]
      ];
      
      metrics.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Payment Analytics Section
      pdf.setFontSize(16);
      pdf.text('Payment Analytics', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      const paymentStats = [
        ['Total Payments', data.paymentAnalytics.totalPayments.toString()],
        ['Completed Payments', data.paymentAnalytics.completedPayments.toString()],
        ['Pending Payments', data.paymentAnalytics.pendingPayments.toString()],
        ['Failed Payments', data.paymentAnalytics.failedPayments.toString()]
      ];
      
      paymentStats.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 8;
      });
      
      // Add new page if needed
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      yPosition += 10;
      
      // Membership Distribution
      pdf.setFontSize(16);
      pdf.text('Membership Distribution', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      data.membershipData.forEach(plan => {
        pdf.text(`${plan.planName}: ${plan.count} members (${plan.revenue.toLocaleString()} ETB)`, 20, yPosition);
        yPosition += 8;
      });
      
      // If charts element is provided, capture and add it
      if (elementId) {
        try {
          const element = document.getElementById(elementId);
          if (element) {
            const canvas = await html2canvas(element, {
              scale: 2,
              logging: false,
              useCORS: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            if (yPosition + imgHeight > 250) {
              pdf.addPage();
              yPosition = 30;
            }
            
            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          }
        } catch (error) {
          console.warn('Could not capture charts:', error);
        }
      }
      
      // Footer
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`, 20, 280);
      }
      
      pdf.save(`gym-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF');
    }
  }
  
  async exportToExcel(data: ExportData): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Gym Analytics Report'],
        ['Report Period', `${data.dateRange.from.toLocaleDateString()} - ${data.dateRange.to.toLocaleDateString()}`],
        [''],
        ['Key Metrics'],
        ['Total Members', data.dashboardStats.totalMembers],
        ['Active Members', data.dashboardStats.activeMembers],
        ['Total Revenue (ETB)', data.dashboardStats.totalRevenue],
        ['Monthly Revenue (ETB)', data.dashboardStats.monthlyRevenue],
        ['Total Classes', data.dashboardStats.totalClasses],
        ['Average Attendance', data.dashboardStats.averageAttendance],
        [''],
        ['Payment Analytics'],
        ['Total Payments', data.paymentAnalytics.totalPayments],
        ['Completed Payments', data.paymentAnalytics.completedPayments],
        ['Pending Payments', data.paymentAnalytics.pendingPayments],
        ['Failed Payments', data.paymentAnalytics.failedPayments]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Payment Trends Sheet
      if (data.paymentAnalytics.monthlyTrend.length > 0) {
        const paymentTrendSheet = XLSX.utils.json_to_sheet(data.paymentAnalytics.monthlyTrend);
        XLSX.utils.book_append_sheet(workbook, paymentTrendSheet, 'Payment Trends');
      }
      
      // Attendance Data Sheet
      if (data.attendanceData.length > 0) {
        const attendanceSheet = XLSX.utils.json_to_sheet(data.attendanceData);
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance Data');
      }
      
      // Membership Distribution Sheet
      if (data.membershipData.length > 0) {
        const membershipSheet = XLSX.utils.json_to_sheet(
          data.membershipData.map(({ planName, count, revenue }) => ({
            'Plan Name': planName,
            'Member Count': count,
            'Revenue (ETB)': revenue
          }))
        );
        XLSX.utils.book_append_sheet(workbook, membershipSheet, 'Membership Distribution');
      }
      
      // Write file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `gym-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error('Failed to export Excel');
    }
  }
  
  async exportToCSV(data: ExportData): Promise<void> {
    try {
      // Combine all data into a single CSV
      const csvData = [
        ['Gym Analytics Report'],
        ['Report Period', `${data.dateRange.from.toLocaleDateString()} - ${data.dateRange.to.toLocaleDateString()}`],
        [''],
        ['Key Metrics'],
        ['Metric', 'Value'],
        ['Total Members', data.dashboardStats.totalMembers],
        ['Active Members', data.dashboardStats.activeMembers],
        ['Total Revenue (ETB)', data.dashboardStats.totalRevenue],
        ['Monthly Revenue (ETB)', data.dashboardStats.monthlyRevenue],
        ['Total Classes', data.dashboardStats.totalClasses],
        ['Average Attendance', data.dashboardStats.averageAttendance],
        [''],
        ['Payment Analytics'],
        ['Payment Status', 'Count'],
        ['Total Payments', data.paymentAnalytics.totalPayments],
        ['Completed Payments', data.paymentAnalytics.completedPayments],
        ['Pending Payments', data.paymentAnalytics.pendingPayments],
        ['Failed Payments', data.paymentAnalytics.failedPayments],
        [''],
        ['Monthly Payment Trends'],
        ['Month', 'Amount (ETB)', 'Payment Count'],
        ...data.paymentAnalytics.monthlyTrend.map(item => [item.month, item.amount, item.count]),
        [''],
        ['Attendance Data'],
        ['Date', 'Count'],
        ...data.attendanceData.map(item => [item.date, item.count]),
        [''],
        ['Membership Distribution'],
        ['Plan Name', 'Member Count', 'Revenue (ETB)'],
        ...data.membershipData.map(item => [item.planName, item.count, item.revenue])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `gym-report-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('CSV export failed:', error);
      throw new Error('Failed to export CSV');
    }
  }
}

export const exportService = new ExportService();