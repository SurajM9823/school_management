import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumbs from './Breadcrumbs';
import LiveChatWidget from '../common/LiveChatWidget'; // Import the chat widget

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6">
          <div className="py-6">
            <Breadcrumbs />
            <div className="mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
      <LiveChatWidget /> {/* Add the chat widget here */}
    </div>
  );
};

export default Layout;