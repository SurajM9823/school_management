import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { UserCircle, ArrowRight, Users } from 'lucide-react'; // UserCircle for placeholder photo

// Mock children data - In a real app, this would come from an API
// This could be the same data source used by ParentDashboard's switcher
const mockChildrenData = [
  { 
    id: 'child1', 
    name: 'Sarah Smith', 
    grade: '10A', 
    roll: '1024', 
    photoUrl: '', // Placeholder for actual photo URL
    schoolName: 'Greenwood High', // Example detail
    lastLogin: '2024-06-04 10:00 AM' // Example detail
  },
  { 
    id: 'child2', 
    name: 'Michael Smith', 
    grade: '7B', 
    roll: '2045', 
    photoUrl: '',
    schoolName: 'Greenwood High',
    lastLogin: '2024-06-03 03:30 PM'
  },
  { 
    id: 'child3', 
    name: 'Olivia Smith', 
    grade: '3C', 
    roll: '3011', 
    photoUrl: '',
    schoolName: 'Greenwood Junior School', // Different school example
    lastLogin: '2024-06-05 08:15 AM'
  }
];

interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  roll: string;
  photoUrl?: string;
  schoolName?: string;
  lastLogin?: string;
}

const Children: React.FC = () => {
  // This state would ideally come from a shared context (e.g., AuthContext or a dedicated ParentContext)
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(mockChildrenData);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(mockChildrenData[0]?.id || null);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    // In a real app, this would also update the shared context
    // and potentially navigate to the main dashboard for that child or refresh data.
    alert(`Switched to ${childrenList.find(c => c.id === childId)?.name}'s profile. (Mock action)`);
    // Example: navigate(`/parent/dashboard?childId=${childId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users size={28} className="mr-3 text-blue-600"/> My Children
        </h1>
        {/* Optionally, an "Add Child" button if parents can link new children, though usually done by admin */}
      </div>

      {childrenList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {childrenList.map((child) => (
            <Card 
              key={child.id} 
              className={`transition-all duration-300 ease-in-out transform hover:scale-105 ${selectedChildId === child.id ? 'border-2 border-blue-500 shadow-xl' : 'shadow-md'}`}
            >
              <div className="p-2"> {/* Reduced padding for Card content */}
                <div className="flex flex-col items-center text-center">
                  {child.photoUrl ? (
                    <img src={child.photoUrl} alt={child.name} className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-gray-200" />
                  ) : (
                    <UserCircle size={80} className="mb-3 text-gray-400" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800">{child.name}</h2>
                  <p className="text-sm text-gray-600">
                    {child.grade} - Roll #{child.roll}
                  </p>
                  {child.schoolName && <p className="text-xs text-gray-500 mt-1">{child.schoolName}</p>}
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  {/* Example additional info - can be customized */}
                  {/* <p className="text-xs text-gray-500">Last activity: {child.lastLogin || 'N/A'}</p> */}
                  <Button
                    variant={selectedChildId === child.id ? "primary" : "outline"}
                    className="w-full mt-2 flex items-center justify-center"
                    onClick={() => handleSelectChild(child.id)}
                    icon={selectedChildId === child.id ? undefined : <ArrowRight size={16} />}
                  >
                    {selectedChildId === child.id ? "Currently Viewing" : `View ${child.name.split(' ')[0]}'s Details`}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Children Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no children linked to your account. Please contact administration if this is an error.
            </p>
          </div>
        </Card>
      )}
      {/* TODO: Add functionality to link to a more detailed profile page for each child if needed */}
    </div>
  );
};

export default Children;