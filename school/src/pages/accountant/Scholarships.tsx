import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PlusCircle, Edit, Trash2, Filter, Award, Users, DollarSign, Calendar, Percent, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ScholarshipConcession {
  id: string;
  name: string; // e.g., Merit Scholarship, Sibling Concession, Sports Scholarship
  type: 'scholarship' | 'concession';
  description?: string;
  amount?: number; // Fixed amount for scholarship or concession
  percentage?: number; // Percentage for concession
  criteria: string; // Eligibility criteria description
  academicYear: string;
  status: 'active' | 'inactive' | 'expired';
  applicationStartDate?: string;
  applicationEndDate?: string;
}

interface AwardedScholarship {
    id: string;
    scholarshipId: string; // Links to ScholarshipConcession
    scholarshipName: string;
    studentId: string;
    studentName: string;
    class: string;
    awardedDate: string;
    effectiveFrom: string;
    effectiveTo?: string;
    awardedAmount?: number; // If fixed
    awardedPercentage?: number; // If percentage based on some fee component
    notes?: string;
}

const mockScholarships: ScholarshipConcession[] = [
  {
    id: 'sch001',
    name: 'Merit Scholarship - Grade 10 Toppers',
    type: 'scholarship',
    amount: 10000,
    criteria: 'Top 3 students in Grade 10 final exams.',
    academicYear: '2024-2025',
    status: 'active',
    applicationStartDate: '2024-07-01',
    applicationEndDate: '2024-07-31',
  },
  {
    id: 'con001',
    name: 'Sibling Concession',
    type: 'concession',
    percentage: 15, // 15% on tuition fee
    criteria: 'Applicable if two or more siblings are studying in the school.',
    academicYear: '2024-2025',
    status: 'active',
  },
  {
    id: 'sch002',
    name: 'Sports Excellence Scholarship',
    type: 'scholarship',
    amount: 5000,
    criteria: 'National level sports participants.',
    academicYear: '2024-2025',
    status: 'inactive',
  },
];

const mockAwarded: AwardedScholarship[] = [
    { id: 'awd01', scholarshipId: 'sch001', scholarshipName: 'Merit Scholarship - Grade 10 Toppers', studentId: 'S1023', studentName: 'Alice Wonderland', class: '11-A', awardedDate: '2024-06-15', effectiveFrom: '2024-07-01', awardedAmount: 10000},
    { id: 'awd02', scholarshipId: 'con001', scholarshipName: 'Sibling Concession', studentId: 'S0856', studentName: 'Bob The Builder', class: '8-B', awardedDate: '2024-06-20', effectiveFrom: '2024-07-01', awardedPercentage: 15, notes: 'Applied on tuition fee.'},
];


const scholarshipTypes = ['scholarship', 'concession'];
const scholarshipStatuses = ['active', 'inactive', 'expired'];

const Scholarships: React.FC = () => {
  const [scholarships, setScholarships] = useState<ScholarshipConcession[]>(mockScholarships);
  const [awardedList, setAwardedList] = useState<AwardedScholarship[]>(mockAwarded);
  const [showForm, setShowForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<ScholarshipConcession | null>(null);
  const [formState, setFormState] = useState<Partial<ScholarshipConcession>>({ type: 'scholarship', status: 'active', academicYear: '2024-2025' });

  // TODO: Add form and state for awarding scholarships to students

  const handleSave = () => {
    // Basic validation
    if (!formState.name || !formState.criteria || !formState.academicYear) {
        alert('Please fill Name, Criteria, and Academic Year.');
        return;
    }
    if (formState.type === 'scholarship' && !formState.amount) {
        alert('Please provide an amount for the scholarship.');
        return;
    }
    if (formState.type === 'concession' && !formState.percentage) {
        alert('Please provide a percentage for the concession.');
        return;
    }

    if (editingScholarship) {
      setScholarships(scholarships.map(s => s.id === editingScholarship.id ? { ...s, ...formState } as ScholarshipConcession : s));
      alert('Scholarship/Concession updated (mock)!');
    } else {
      const newId = `${formState.type === 'scholarship' ? 'sch' : 'con'}${Date.now()}`;
      setScholarships([...scholarships, { ...formState, id: newId } as ScholarshipConcession]);
      alert('Scholarship/Concession added (mock)!');
    }
    setShowForm(false);
    setEditingScholarship(null);
    setFormState({ type: 'scholarship', status: 'active', academicYear: '2024-2025' });
  };

  const handleEdit = (scholarship: ScholarshipConcession) => {
    setEditingScholarship(scholarship);
    setFormState(scholarship);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item? This might affect awarded records.')) {
        setScholarships(scholarships.filter(s => s.id !== id));
        // Optionally, handle awarded records (e.g., mark as invalid or remove)
        alert('Scholarship/Concession deleted (mock)!');
    }
  };
  
  // TODO: Filtering logic for scholarships and awarded list

  const totalScholarshipValue = awardedList.reduce((sum, item) => sum + (item.awardedAmount || 0), 0); // Simplified
  const totalBeneficiaries = new Set(awardedList.map(item => item.studentId)).size;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Scholarships & Concessions</h1>
        <div className="flex space-x-3">
            <Button variant="outline" size="sm" icon={<Download size={16}/>}>Export Data</Button>
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => { setShowForm(true); setEditingScholarship(null); setFormState({ type: 'scholarship', status: 'active', academicYear: '2024-2025' }); }}>
                Define New
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600"><DollarSign size={24} /></div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Awarded Value</p>
                    <p className="text-xl font-semibold text-gray-900">₹{totalScholarshipValue.toLocaleString()}</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users size={24} /></div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Beneficiaries</p>
                    <p className="text-xl font-semibold text-gray-900">{totalBeneficiaries}</p>
                </div>
            </div>
        </Card>
         {/* Add more relevant stats cards if needed */}
      </div>

      {showForm && (
        <Card title={editingScholarship ? "Edit Scholarship/Concession" : "Define New Scholarship/Concession"}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="sc-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="sc-name" value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
            </div>
            <div>
              <label htmlFor="sc-type" className="block text-sm font-medium text-gray-700">Type</label>
              <select id="sc-type" value={formState.type || 'scholarship'} onChange={e => setFormState({...formState, type: e.target.value as 'scholarship' | 'concession'})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                <option value="scholarship">Scholarship</option>
                <option value="concession">Concession</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sc-description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea id="sc-description" value={formState.description || ''} onChange={e => setFormState({...formState, description: e.target.value})} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            {formState.type === 'scholarship' && (
              <div>
                <label htmlFor="sc-amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input type="number" id="sc-amount" value={formState.amount || ''} onChange={e => setFormState({...formState, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Fixed amount"/>
              </div>
            )}
            {formState.type === 'concession' && (
              <div>
                <label htmlFor="sc-percentage" className="block text-sm font-medium text-gray-700">Percentage (%)</label>
                <input type="number" id="sc-percentage" value={formState.percentage || ''} onChange={e => setFormState({...formState, percentage: parseFloat(e.target.value) || 0})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 10 for 10%"/>
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="sc-criteria" className="block text-sm font-medium text-gray-700">Eligibility Criteria</label>
              <textarea id="sc-criteria" value={formState.criteria || ''} onChange={e => setFormState({...formState, criteria: e.target.value})} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
            </div>
            <div>
              <label htmlFor="sc-academicYear" className="block text-sm font-medium text-gray-700">Academic Year</label>
              <input type="text" id="sc-academicYear" value={formState.academicYear || '2024-2025'} onChange={e => setFormState({...formState, academicYear: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 2024-2025" required/>
            </div>
            <div>
              <label htmlFor="sc-status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="sc-status" value={formState.status || 'active'} onChange={e => setFormState({...formState, status: e.target.value as ScholarshipConcession['status']})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                {scholarshipStatuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sc-app-start" className="block text-sm font-medium text-gray-700">Application Start Date (Optional)</label>
              <input type="date" id="sc-app-start" value={formState.applicationStartDate || ''} onChange={e => setFormState({...formState, applicationStartDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="sc-app-end" className="block text-sm font-medium text-gray-700">Application End Date (Optional)</label>
              <input type="date" id="sc-app-end" value={formState.applicationEndDate || ''} onChange={e => setFormState({...formState, applicationEndDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingScholarship(null); setFormState({ type: 'scholarship', status: 'active', academicYear: '2024-2025' }); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editingScholarship ? "Save Changes" : "Define"}</Button>
          </div>
        </Card>
      )}

      {/* TODO: Add Filters for scholarship list */}

      <Card title="Defined Scholarships & Concessions">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scholarships.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type === 'scholarship' ? `₹${item.amount?.toLocaleString()}` : `${item.percentage}%`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.academicYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="sm" onClick={() => handleEdit(item)} title="Edit"><Edit size={16} className="text-yellow-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDelete(item.id)} title="Delete"><Trash2 size={16} className="text-red-600"/></Button>
                    <Button variant="outline" size="sm" onClick={() => alert(`Awarding ${item.name} to a student...`)}>Award to Student</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {scholarships.length === 0 && <p className="text-center py-4 text-gray-500">No scholarships or concessions defined yet.</p>}
      </Card>
      
      {/* TODO: Add Filters for awarded list */}
      <Card title="Awarded Scholarships & Concessions to Students">
        {/* This section would list students who have received scholarships/concessions */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name (ID)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholarship/Concession</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awarded Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awarded Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {awardedList.map(award => (
                    <tr key={award.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{award.studentName} ({award.studentId})</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{award.scholarshipName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {award.awardedAmount ? `₹${award.awardedAmount.toLocaleString()}` : `${award.awardedPercentage}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(award.awardedDate), 'dd MMM, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="icon" size="sm" onClick={() => alert(`Editing award ${award.id}`)} title="Edit Award"><Edit size={16} className="text-yellow-600"/></Button>
                            <Button variant="icon" size="sm" onClick={() => alert(`Revoking award ${award.id}`)} title="Revoke Award"><Trash2 size={16} className="text-red-600"/></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
        {awardedList.length === 0 && <p className="text-center py-4 text-gray-500">No scholarships or concessions awarded to students yet.</p>}
      </Card>
    </div>
  );
};

export default Scholarships;