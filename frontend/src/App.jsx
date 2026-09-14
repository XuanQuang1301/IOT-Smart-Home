import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SensorHistory from './pages/SensorHistory';
import DeviceHistory from './pages/DeviceHistory';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sensor-history" element={<SensorHistory />} />
          <Route path="/device-history" element={<DeviceHistory />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
