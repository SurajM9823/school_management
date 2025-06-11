import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Award, BookOpen, BarChart2, Filter, Download, TrendingUp, TrendingDown, Percent, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExamResult {
  id: string;
  examName: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string;
  resultDate: string; // YYYY-MM-DD
  remarks?: string;
}

interface TermSummary {
    termName: string;
    overallPercentage: number;
    overallGrade?: string;
    rankInClass?: number; // Student's perspective might not always show rank
    results: ExamResult[];
    reportCardLink?: string;
}

// Mock data - For the logged-in student
const mockStudentResultsData: TermSummary[] = [
  {
    termName: 'Term 1 Examination (2023-24)',
    overallPercentage: 88.5, // Slightly different for student view example
    overallGrade: 'A+',
    // rankInClass: 5, // May or may not be shown to student directly
    reportCardLink: '/path/to/my_term1_report_card.pdf',
    results: [
      { id: 'sres1_1', examName: 'Term 1 Examination', subject: 'Mathematics', marksObtained: 90, totalMarks: 100, percentage: 90, grade: 'A+', resultDate: '2023-08-15' },
      { id: 'sres1_2', examName: 'Term 1 Examination', subject: 'Science', marksObtained: 85, totalMarks: 100, percentage: 85, grade: 'A', resultDate: '2023-08-15' },
      { id: 'sres1_3', examName: 'Term 1 Examination', subject: 'English', marksObtained: 92, totalMarks: 100, percentage: 92, grade: 'A+', resultDate: '2023-08-15' },
      { id: 'sres1_4', examName: 'Term 1 Examination', subject: 'History', marksObtained: 82, totalMarks: 100, percentage: 82, grade: 'A-', resultDate: '2023-08-15' },
      { id: 'sres1_5', examName: 'Term 1 Examination', subject: 'Computer Science', marksObtained: 94, totalMarks: 100, percentage: 94, grade: 'A+', resultDate: '2023-08-15', remarks: 'Good job!' },
    ],
  },
  {
    termName: 'Mid-Term Test (2023-24)',
    overallPercentage: 81.0,
    overallGrade: 'A-',
    results: [
      { id: 'sres2_1', examName: 'Mid-Term Test', subject: 'Mathematics', marksObtained: 78, totalMarks: 100, percentage: 78, grade: 'B+', resultDate: '2023-11-05' },
      { id: 'sres2_2', examName: 'Mid-Term Test', subject: 'Science', marksObtained: 82, totalMarks: 100, percentage: 82, grade: 'A-', resultDate: '2023-11-05' },
      { id: 'sres2_3', examName: 'Mid-Term Test', subject: 'English', marksObtained: 83, totalMarks: 100, percentage: 83, grade: 'A-', resultDate: '2023-11-05' },
    ],
  },
];

const examTerms = mockStudentResultsData.map(term => term.termName);

const Results: React.FC = () => {
  const [resultsData, setResultsData] = useState<TermSummary[]>(mockStudentResultsData);
  const [selectedTerm, setSelectedTerm] = useState<string>(examTerms[0] || 'all');

  const displayData = useMemo(() => {
    if (selectedTerm === 'all') return resultsData;
    return resultsData.filter(term => term.termName === selectedTerm);
  }, [resultsData, selectedTerm]);

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-gray-700';
    if (grade.includes('A')) return 'text-green-600';
    if (grade.includes('B')) return 'text-blue-600';
    if (grade.includes('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Award size={28} className="mr-3 text-yellow-500"/> My Exams & Results
      </h1>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="termFilter" className="block text-sm font-medium text-gray-700">Select Exam/Term:</label>
            <select id="termFilter" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
              <option value="all">All Terms</option>
              {examTerms.map(term => (<option key={term} value={term}>{term}</option>))}
            </select>
        </div>
      </Card>

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
            <div className="mb-4 p-3 bg-gray-50 rounded-md grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                <div>
                    <p className="text-xs text-gray-500">Overall Percentage</p>
                    <p className={`text-xl font-bold ${getGradeColor(termSummary.overallGrade)}`}>{termSummary.overallPercentage.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Overall Grade</p>
                    <p className={`text-xl font-bold ${getGradeColor(termSummary.overallGrade)}`}>{termSummary.overallGrade || 'N/A'}</p>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Marks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Percentage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {termSummary.results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{result.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{result.marksObtained} / {result.totalMarks}</td>
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
        <Card><div className="text-center py-10"><Info className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Results Found</h3><p className="mt-1 text-sm text-gray-500">Your exam results are not available yet or do not match the filter.</p></div></Card>
      )}
    </div>
  );
};

export default Results;