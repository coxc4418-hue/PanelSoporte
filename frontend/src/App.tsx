import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Stats from './pages/Stats';
import SitesManager from './pages/SitesManager';
import LiveConversations from './pages/LiveConversations';
import WidgetIframe from './pages/WidgetIframe';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Login />} />

        {/* Floating Chat widget inside iframe */}
        <Route path="/widget-iframe" element={<WidgetIframe />} />

        {/* Protected Admin Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/stats" replace />} />
          <Route path="stats" element={<Stats />} />
          <Route path="sites" element={<SitesManager />} />
          <Route path="conversations" element={<LiveConversations />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
