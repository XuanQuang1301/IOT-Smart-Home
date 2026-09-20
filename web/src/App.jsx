import React, { useState, useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SensorHistory from './pages/SensorHistory';
import DeviceHistory from './pages/DeviceHistory';
import Profile from './pages/Profile';

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname || '/');

  useEffect(() => {
    setActiveTab(location.pathname || '/');
  }, [location.pathname]);

  const handleTabChange = (path) => {
    setActiveTab(path);
    navigate(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6fa]">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full w-full ${activeTab === '/' ? 'block' : 'hidden'}`}>
          <Dashboard />
        </div>
        <div className={`h-full w-full ${activeTab === '/sensor-history' ? 'block' : 'hidden'}`}>
          <SensorHistory />
        </div>
        <div className={`h-full w-full ${activeTab === '/device-history' ? 'block' : 'hidden'}`}>
          <DeviceHistory />
        </div>
        <div className={`h-full w-full ${activeTab === '/profile' ? 'block' : 'hidden'}`}>
          <Profile />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </DataProvider>
  );
}
