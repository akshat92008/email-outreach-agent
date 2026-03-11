import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import OutreachPage from './OutreachPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/outreach" element={<OutreachPage />} />
      </Routes>
    </Router>
  );
}

export default App;
