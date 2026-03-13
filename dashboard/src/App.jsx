import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import OutreachPage from './OutreachPage';
import LeadGenSearch from './LeadGenSearch';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LeadGenSearch />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/outreach" element={<OutreachPage />} />
        <Route path="/search" element={<LeadGenSearch />} />
      </Routes>
    </Router>
  );
}

export default App;
