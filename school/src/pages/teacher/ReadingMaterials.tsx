import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { UploadCloud, Link as LinkIcon, FileText, PlusCircle, Trash2, Download } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  type: 'file' | 'link'; // Type of material
  url?: string; // URL for links or path for files (mocked)
  fileName?: string; // For file type
  description?: string;
  uploadedDate: string;
  assignedClass?: string; // e.g., "Class 8A"
  subject?: string; // e.g., "Mathematics"
}

const mockMaterials: Material[] = [
  {
    id: 'mat1',
    title: 'Introduction to Algebra',
    type: 'file',
    fileName: 'algebra_intro.pdf',
    url: '/path/to/algebra_intro.pdf', // Mock path
    description: 'Basic concepts of algebra for beginners.',
    uploadedDate: '2024-05-20',
    assignedClass: 'Class 8A',
    subject: 'Mathematics',
  },
  {
    id: 'mat2',
    title: 'Photosynthesis Explained',
    type: 'link',
    url: 'https://example.com/photosynthesis',
    description: 'An interactive guide to understanding photosynthesis.',
    uploadedDate: '2024-05-18',
    assignedClass: 'Class 8A',
    subject: 'Science',
  },
  {
    id: 'mat3',
    title: 'Shakespearean Sonnets Collection',
    type: 'file',
    fileName: 'sonnets.pdf',
    url: '/path/to/sonnets.pdf', // Mock path
    uploadedDate: '2024-05-15',
    assignedClass: 'Class 9B',
    subject: 'English Literature',
  },
];

const ReadingMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({ type: 'file' });

  const handleAddMaterial = () => {
    if (newMaterial.title && (newMaterial.url || newMaterial.fileName)) {
      const materialToAdd: Material = {
        id: `mat${materials.length + 1}`,
        title: newMaterial.title!,
        type: newMaterial.type!,
        url: newMaterial.url,
        fileName: newMaterial.fileName,
        description: newMaterial.description,
        uploadedDate: new Date().toISOString().split('T')[0], // Today's date
        assignedClass: newMaterial.assignedClass,
        subject: newMaterial.subject,
      };
      setMaterials(prev => [materialToAdd, ...prev]);
      setShowAddForm(false);
      setNewMaterial({ type: 'file' });
      // TODO: Implement actual file upload and API call
      alert('Material added (mock)!');
    } else {
      alert('Please provide a title and a URL/file.');
    }
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    // TODO: Implement API call to delete material
    alert('Material deleted (mock)!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reading Materials</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => setShowAddForm(true)}
        >
          Add Material
        </Button>
      </div>

      {showAddForm && (
        <Card title="Add New Reading Material">
          <div className="space-y-4">
            <div>
              <label htmlFor="mat-title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="mat-title"
                value={newMaterial.title || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="mat-type" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="mat-type"
                value={newMaterial.type}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value as 'file' | 'link' }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="file">File Upload</option>
                <option value="link">Link</option>
              </select>
            </div>
            {newMaterial.type === 'file' ? (
              <div>
                <label htmlFor="mat-file" className="block text-sm font-medium text-gray-700">File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setNewMaterial(prev => ({...prev, fileName: e.target.files?.[0]?.name}))} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX, PPTX up to 10MB</p>
                    {newMaterial.fileName && <p className="text-sm text-gray-700 mt-1">Selected: {newMaterial.fileName}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="mat-url" className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  id="mat-url"
                  value={newMaterial.url || ''}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://example.com/resource"
                />
              </div>
            )}
            <div>
              <label htmlFor="mat-desc" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                id="mat-desc"
                rows={3}
                value={newMaterial.description || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="mat-class" className="block text-sm font-medium text-gray-700">Assign to Class (Optional)</label>
              <input
                type="text"
                id="mat-class"
                value={newMaterial.assignedClass || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, assignedClass: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Class 8A"
              />
            </div>
            <div>
              <label htmlFor="mat-subject" className="block text-sm font-medium text-gray-700">Subject (Optional)</label>
              <input
                type="text"
                id="mat-subject"
                value={newMaterial.subject || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Mathematics"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => { setShowAddForm(false); setNewMaterial({ type: 'file' }); }}>
              Cancel
            </Button>
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={handleAddMaterial}>
              Add Material
            </Button>
          </div>
        </Card>
      )}

      {materials.length === 0 && !showAddForm ? (
        <Card>
          <p className="text-gray-600 text-center py-4">No reading materials uploaded yet. Click "Add Material" to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <Card key={material.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {material.type === 'file' ? <FileText size={20} /> : <LinkIcon size={20} />}
                  </div>
                  <Button variant="icon" size="sm" icon={<Trash2 size={16} />} onClick={() => handleDeleteMaterial(material.id)} className="text-red-500 hover:text-red-700">
                      {/* Delete */}
                  </Button>
              </div>
                <h3 className="text-lg font-semibold text-gray-800 truncate" title={material.title}>{material.title}</h3>
                {material.fileName && <p className="text-sm text-gray-500 truncate">File: {material.fileName}</p>}
                {material.url && material.type === 'link' && (
                  <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate block">
                    {material.url}
                  </a>
                )}
                {material.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{material.description}</p>}
                <p className="text-xs text-gray-400 mt-2">Uploaded: {material.uploadedDate}</p>
                {material.assignedClass && <p className="text-xs text-gray-500">Class: {material.assignedClass}</p>}
                {material.subject && <p className="text-xs text-gray-500">Subject: {material.subject}</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                {material.type === 'file' && (
                  <Button variant="outline" size="sm" icon={<Download size={16} />} className="w-full" onClick={() => alert(`Downloading ${material.fileName} (mock)`)}>
                    Download File
                  </Button>
                )}
                {material.type === 'link' && (
                  <a href={material.url} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" size="sm" icon={<LinkIcon size={16} />} className="w-full">
                      Open Link
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* TODO: Implement actual file upload/linking and API integration */}
      {/* TODO: Add filtering and searching for materials */}
    </div>
  );
};

export default ReadingMaterials;