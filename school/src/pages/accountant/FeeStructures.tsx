import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';

interface FeeComponent {
  name: string; // e.g., Tuition, Transport, Library
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
}

interface Concession {
  name: string; // e.g., Sibling Discount, Staff Ward
  type: 'percentage' | 'fixed';
  value: number;
}

interface Fine {
  name: string; // e.g., Late Payment Fine
  type: 'percentage' | 'fixed';
  value: number;
  afterDays: number; // Fine applicable after how many days of due date
}

interface FeeStructure {
  id: string;
  name: string; // e.g., "Class 10 - General", "Class 5 - Sibling Discount"
  applicableTo: { // Criteria for applicability
    class?: string; // e.g., "Class 10", "All Primary"
    section?: string;
    ageMin?: number;
    ageMax?: number;
    category?: string; // e.g., General, SC/ST, OBC
    religion?: string;
    // Add more criteria as needed
  };
  components: FeeComponent[];
  concessions?: Concession[];
  fines?: Fine[];
  academicYear: string;
  isActive: boolean;
}

const mockFeeStructures: FeeStructure[] = [
  {
    id: 'fs1',
    name: 'Class 10 - Standard Fee 2024-25',
    applicableTo: { class: 'Class 10' },
    components: [
      { name: 'Tuition Fee', amount: 5000, frequency: 'monthly' },
      { name: 'Lab Fee', amount: 1000, frequency: 'quarterly' },
      { name: 'Exam Fee', amount: 500, frequency: 'one-time' },
    ],
    fines: [{ name: 'Late Fee', type: 'fixed', value: 100, afterDays: 7 }],
    academicYear: '2024-2025',
    isActive: true,
  },
  {
    id: 'fs2',
    name: 'Primary Section - Sibling Discount 2024-25',
    applicableTo: { class: 'Class 1-5', category: 'Sibling Discount' },
    components: [
      { name: 'Tuition Fee', amount: 3000, frequency: 'monthly' },
    ],
    concessions: [{ name: 'Sibling Discount', type: 'percentage', value: 10 }],
    academicYear: '2024-2025',
    isActive: true,
  },
];

const FeeStructures: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructure[]>(mockFeeStructures);
  const [showForm, setShowForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  // Basic form state, can be expanded
  const [formState, setFormState] = useState<Partial<FeeStructure>>({});

  const handleSave = () => {
    // TODO: Implement save logic (add new or update existing)
    // Add validation before saving
    if (editingStructure) {
      setStructures(structures.map(s => s.id === editingStructure.id ? {...s, ...formState} as FeeStructure : s));
      alert('Fee structure updated (mock)!');
    } else {
      const newId = `fs${Date.now()}`;
      setStructures([...structures, { ...formState, id: newId, isActive: true } as FeeStructure]);
      alert('Fee structure added (mock)!');
    }
    setShowForm(false);
    setEditingStructure(null);
    setFormState({});
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormState(structure);
    setShowForm(true);
  };
  
  const handleDelete = (id: string) => {
    setStructures(structures.filter(s => s.id !== id));
    // TODO: API call for deletion
    alert('Fee structure deleted (mock)!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Fee Structures Management</h1>
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => { setShowForm(true); setEditingStructure(null); setFormState({}); }}>
          Define New Structure
        </Button>
      </div>

      {showForm && (
        <Card title={editingStructure ? "Edit Fee Structure" : "Define New Fee Structure"}>
          {/* Form fields will go here. This is a simplified version. */}
          <div className="space-y-4">
            <div>
              <label htmlFor="fs-name" className="block text-sm font-medium text-gray-700">Structure Name</label>
              <input type="text" id="fs-name" value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., Class 10 General Fee"/>
            </div>
            <div>
              <label htmlFor="fs-year" className="block text-sm font-medium text-gray-700">Academic Year</label>
              <input type="text" id="fs-year" value={formState.academicYear || ''} onChange={e => setFormState({...formState, academicYear: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 2024-2025"/>
            </div>
            {/* TODO: Add fields for applicableTo, components, concessions, fines */}
            <p className="text-sm text-gray-500">Detailed fields for applicability criteria, fee components, concessions, and fines would be added here.</p>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editingStructure ? "Save Changes" : "Create Structure"}</Button>
          </div>
        </Card>
      )}

      <Card title="Existing Fee Structures">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable To (Class)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {structures.map((structure) => (
                <tr key={structure.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{structure.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{structure.applicableTo.class || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{structure.academicYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${structure.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="sm" onClick={() => alert(`Viewing ${structure.name}`)} title="View Details"><Eye size={16} className="text-blue-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleEdit(structure)} title="Edit"><Edit size={16} className="text-yellow-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDelete(structure.id)} title="Delete"><Trash2 size={16} className="text-red-600"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {structures.length === 0 && <p className="text-center py-4 text-gray-500">No fee structures defined yet.</p>}
      </Card>
      {/* TODO: Add filtering, pagination, and detailed view for structures */}
    </div>
  );
};

export default FeeStructures;