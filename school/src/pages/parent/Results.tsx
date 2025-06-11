import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Award, BookOpen, BarChart2, Filter, Download, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExamResult {
  id: string;
  examName: string; // e.g., "Term 1 Examination", "Mid-Term Test"
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string; // e.g., A+, B, C
  resultDate: string; // YYYY-MM-DD
  remarks?: string;
  rank?: number; // Optional
}

interface TermSummary {
    termName: string;
    overallPercentage: number;
    overallGrade?: string;
    rankInClass?: number;
    results: ExamResult[];
    reportCardLink?: string; // Link to a detailed PDF report card
}

// Mock data - In a real app, this would come from an API for the selected child
const mockResultsData: TermSummary[] = [
  {
    termName: 'Term 1 Examination (2023-24)',
    overallPercentage: 85.5,
    overallGrade: 'A',
    rankInClass: 5,
    reportCardLink: '/path/to/term1_report_card.pdf',
    results: [
      { id: 'res1_1', examName: 'Term 1 Examination', subject: 'Mathematics', marksObtained: 88, totalMarks: 100, percentage: 88, grade: 'A', resultDate: '2023-08-15' },
      { id: 'res1_2', examName: 'Term 1 Examination', subject: 'Science', marksObtained: 82, totalMarks: 100, percentage: 82, grade: 'A-', resultDate: '2023-08-15' },
      { id: 'res1_3', examName: 'Term 1 Examination', subject: 'English', marksObtained: 90, totalMarks: 100, percentage: 90, grade: 'A+', resultDate: '2023-08-15' },
      { id: 'res1_4', examName: 'Term 1 Examination', subject: 'History', marksObtained: 78, totalMarks: 100, percentage: 78, grade: 'B+', resultDate: '2023-08-15' },
      { id: 'res1_5', examName: 'Term 1 Examination', subject: 'Computer Science', marksObtained: 92, totalMarks: 100, percentage: 92, grade: 'A+', resultDate: '2023-08-15', remarks: 'Excellent practical work.' },
    ],
  },
  {
    termName: 'Mid-Term Test (2023-24)',
    overallPercentage: 78.0,
    overallGrade: 'B+',
    results: [
      { id: 'res2_1', examName: 'Mid-Term Test', subject: 'Mathematics', marksObtained: 75, totalMarks: 100, percentage: 75, grade: 'B', resultDate: '2023-11-05' },
      { id: 'res2_2', examName: 'Mid-Term Test', subject: 'Science', marksObtained: 80, totalMarks: 100, percentage: 80, grade: 'A-', resultDate: '2023-11-05' },
      { id: 'res2_3', examName: 'Mid-Term Test', subject: 'English', marksObtained: 85, totalMarks: 100, percentage: 85, grade: 'A', resultDate: '2023-11-05' },
    ],
  },
   {
    termName: 'Term 2 Examination (2023-24)',
    overallPercentage: 88.2,
    overallGrade: 'A+',
    rankInClass: 3,
    reportCardLink: '/path/to/term2_report_card.pdf',
    results: [
      { id: 'res3_1', examName: 'Term 2 Examination', subject: 'Mathematics', marksObtained: 92, totalMarks: 100, percentage: 92, grade: 'A+', resultDate: '2024-02-20' },
      { id: 'res3_2', examName: 'Term 2 Examination', subject: 'Science', marksObtained: 85, totalMarks: 100, percentage: 85, grade: 'A', resultDate: '2024-02-20' },
      { id: 'res3_3', examName: 'Term 2 Examination', subject: 'English', marksObtained: 91, totalMarks: 100, percentage: 91, grade: 'A+', resultDate: '2024-02-20' },
      { id: 'res3_4', examName: 'Term 2 Examination', subject: 'History', marksObtained: 80, totalMarks: 100, percentage: 80, grade: 'A-', resultDate: '2024-02-20' },
      { id: 'res3_5', examName: 'Term 2 Examination', subject: 'Computer Science', marksObtained: 95, totalMarks: 100, percentage: 95, grade: 'A+', resultDate: '2024-02-20', remarks: 'Top scorer in practicals.' },
    ],
  },
];

const examTerms = mockResultsData.map(term => term.termName);

const Results: React.FC = () => {
  const [resultsData, setResultsData] = useState<TermSummary[]>(mockResultsData);
  const [selectedTerm, setSelectedTerm] = useState<string>(examTerms[examTerms.length -1] || 'all'); // Default to latest term or all

  const displayData = useMemo(() => {
    if (selectedTerm === 'all') return resultsData;
    return resultsData.filter(term => term.termName === selectedTerm);
  }, [resultsData, selectedTerm]);

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-gray-700';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600'; // For F or lower
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Award size={28} className="mr-3 text-yellow-500"/> Child's Exams & Results
        </h1>
        {/* Child selector would go here if not handled globally */}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="termFilter" className="block text-sm font-medium text-gray-700">Select Exam/Term:</label>
            <select
              id="termFilter"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Terms</option>
              {examTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
        </div>
      </Card>

      {/* Results Display */}
      {displayData.length > 0 ? (
        displayData.map(termSummary => (
          <Card key={termSummary.termName} title={
            <div className="flex justify-between items-center">
                <span className="flex items-center"><BookOpen className="mr-2 text-blue-600"/>{termSummary.termName}</span>
                {termSummary.reportCardLink && (
                    <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => window.open(termSummary.reportCardLink, '_blank')}>
                        Download Report Card
                    </Button>
                )}
            </div>
          }>
            <div className="mb-4 p-3 bg-gray-50 rounded-md grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                    <p className="text-xs text-gray-500">Overall Percentage</p>
                    <p className={`text-xl font-bold ${getGradeColor(termSummary.overallGrade)}`}>{termSummary.overallPercentage.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Overall Grade</p>
                    <p className={`text-xl font-bold ${getGradeColor(termSummary.overallGrade)}`}>{termSummary.overallGrade || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Rank in Class</p>
                    <p className="text-xl font-bold text-gray-700">{termSummary.rankInClass ? `#${termSummary.rankInClass}` : 'N/A'}</p>
                </div>
                 <div>
                    <p className="text-xs text-gray-500">Subjects Appeared</p>
                    <p className="text-xl font-bold text-gray-700">{termSummary.results.length}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Marks Obtained</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total Marks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Percentage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {termSummary.results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{result.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{result.marksObtained}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{result.totalMarks}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{result.percentage.toFixed(1)}%</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${getGradeColor(result.grade)}`}>{result.grade || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 italic">{result.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <div className="text-center py-10">
            <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Results Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Exam results for the selected term/child are not available yet or do not match the filter.
            </p>
          </div>
        </Card>
      )}
      {/* TODO: Add graphical representation of performance over time */}
    </div>
  );
};

export default Results;