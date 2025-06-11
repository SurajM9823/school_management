import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, Calendar, Download, BarChart2, PieChart, TrendingUp, TrendingDown, DollarSign as LucideDollarSign, Users as LucideUsers, User as LucideUser } from 'lucide-react';
import { format } from 'date-fns';

interface ReportConfig {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  format: 'pdf' | 'csv' | 'xlsx';
  // Add other specific filters like class, fee type, expense category etc.
  filterCriteria?: Record<string, string>; 
}

const availableReportTypes = [
  { id: 'income_statement', name: 'Income Statement', icon: TrendingUp },
  { id: 'balance_sheet', name: 'Balance Sheet', icon: BarChart2 },
  { id: 'fee_collection', name: 'Fee Collection Report', icon: LucideDollarSign },
  { id: 'expense_report', name: 'Expense Report', icon: TrendingDown },
  { id: 'payroll_summary', name: 'Payroll Summary', icon: LucideUsers },
  { id: 'student_ledger', name: 'Student Ledger Report', icon: LucideUser },
  // Add more report types as needed
];

const Reports: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>(availableReportTypes[0].id);
  const [dateFrom, setDateFrom] = useState<string>(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const [generatedReport, setGeneratedReport] = useState<string | null>(null); // Placeholder for report data/preview

  const handleGenerateReport = () => {
    // Mock report generation
    const config: ReportConfig = {
      reportType: selectedReportType,
      dateFrom,
      dateTo,
      format: reportFormat,
    };
    console.log('Generating report with config:', config);
    setGeneratedReport(`Mock ${availableReportTypes.find(rt => rt.id === selectedReportType)?.name} generated for ${format(new Date(dateFrom), 'dd/MM/yyyy')} to ${format(new Date(dateTo), 'dd/MM/yyyy')} in ${reportFormat.toUpperCase()} format.`);
    // In a real app, this would trigger an API call and potentially display a preview or download link.
    alert(`Generating ${reportFormat.toUpperCase()} report: ${selectedReportType}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
      </div>

      <Card title="Generate Report">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {availableReportTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="reportFormat" className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              id="reportFormat"
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value as 'pdf' | 'csv' | 'xlsx')}
              className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>

          {/* Placeholder for additional filters based on report type */}
          {/* Example: If fee_collection, show class filter */}
          {selectedReportType === 'fee_collection' && (
            <div>
              <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Class (Optional)
              </label>
              <select id="classFilter" className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">All Classes</option>
                {/* Populate with actual classes */}
                <option value="10A">Class 10A</option>
                <option value="9B">Class 9B</option>
              </select>
            </div>
          )}

          <div className="lg:col-span-1 flex items-end">
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={handleGenerateReport}
              className="w-full"
            >
              Generate & Download
            </Button>
          </div>
        </div>
      </Card>

      {generatedReport && (
        <Card title="Generated Report Preview/Status">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <p className="text-sm text-blue-700">{generatedReport}</p>
            </div>
            {/* In a real app, you might show a preview or direct download link here */}
          </div>
        </Card>
      )}

      <Card title="Available Reports Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableReportTypes.map(rt => {
                const IconComponent = rt.icon;
                return (
                    <div key={rt.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReportType(rt.id)}>
                        <div className="flex items-center text-gray-700">
                            <IconComponent size={20} className="mr-3 text-blue-600"/>
                            <span className="font-medium">{rt.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Click to select and configure this report.</p>
                    </div>
                );
            })}
        </div>
      </Card>

      {/* TODO: Add section for previously generated reports history */}
    </div>
  );
};

export default Reports;