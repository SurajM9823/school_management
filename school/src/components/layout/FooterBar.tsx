
// src/components/Footer.tsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, Globe, MapPinned } from 'lucide-react';
import api from '../../api';
// Define backend base URL
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface SchoolData {
  name: string;
  email: string;
  phone: string;
  website: string;
}

const Footer: React.FC = () => {
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/school/settings');
        const data = response.data;
        setSchoolData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          website: data.website,
        }); // eslint-disable-next-line
      } catch (err: any) {
        console.error('Fetch school data error:', err);
        setError('Failed to load school data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, []);

  return (
    <footer className=" mt-auto position-fixed bottom-0 left-0 w-full border-t" style={{background: '#167F92'}}>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center h-10">
          <span className="text-white text-sm text-center sm:text-left">
            © {new Date().getFullYear()} {isLoading ? 'Loading...' : schoolData?.name || 'School Management System'}. All rights reserved.
          </span>
          <div className="flex flex-wrap justify-center sm:justify-end items-center space-x-3 text-gray-300 text-sm mt-3 sm:mt-0">
            <div className="flex items-center">
              <MapPinned className="h-4 w-4 text-gray-300 mr-1" />
              <a
                href={`mailto:${schoolData?.email || 'info@sms.edu'}`}
                className="text-sm hover:underline"
              >
                {schoolData?.email || 'info@sms.edu'}
              </a>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-300 mr-1" />
              <a
                href={`mailto:${schoolData?.email || 'info@sms.edu'}`}
                className="text-sm text-gary-100 hover:underline"
              >
                {schoolData?.email || 'info@sms.edu'}
              </a>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-300 mr-1" />
              <a
                href={`tel:${schoolData?.phone || '+123-456-7890'}`}
                className="ext-sm text-gary-100  hover:underline"
              >
                {schoolData?.phone || ''}
              </a>
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-gray-300 mr-1" />
              <a
                href={schoolData?.website || 'https://sms.edu'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white-100 hover:underline"
              >
                {schoolData?.website || 'https://sms.edu'}
              </a>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;