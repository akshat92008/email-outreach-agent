import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Send, 
  Flame, 
  PhoneCall, 
  ExternalLink, 
  Mail, 
  MessageCircle,
  BarChart3,
  Search
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/leads`);
      setLeads(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.score >= 5).length,
    contacted: leads.filter(l => l.contacted_status !== 'pending').length,
    emails: leads.filter(l => l.contacted_status === 'emailed').length
  };

  if (loading) return <div style={{padding: '4rem', textAlign: 'center'}}>Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Lead Generation Admin</h1>
        <div style={{display: 'flex', gap: '1rem', width: '400px'}}>
          <div style={{position: 'relative', width: '100%'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)'}} />
            <input 
              style={{paddingLeft: '2.5rem'}}
              placeholder="Search leads by name or city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card stat-card">
          <span className="label">Total Leads</span>
          <span className="value">{stats.total}</span>
          <BarChart3 className="icon" size={24} style={{color: 'var(--primary)'}} />
        </div>
        <div className="card stat-card">
          <span className="label">Hot Leads</span>
          <span className="value">{stats.hot}</span>
          <Flame className="icon" size={24} style={{color: '#f87171'}} />
        </div>
        <div className="card stat-card">
          <span className="label">Contacted</span>
          <span className="value">{stats.contacted}</span>
          <Users className="icon" size={24} style={{color: 'var(--success)'}} />
        </div>
        <div className="card stat-card">
          <span className="label">Emails Sent</span>
          <span className="value">{stats.emails}</span>
          <Send className="icon" size={24} style={{color: 'var(--accent)'}} />
        </div>
      </div>

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2>Recent Leads</h2>
          <button className="btn btn-outline" onClick={fetchLeads}>Refresh Data</button>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Business Name</th>
                <th>City / Country</th>
                <th>Score</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{fontWeight: 600}}>{lead.name}</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{lead.niche}</div>
                  </td>
                  <td>{lead.city}, {lead.country}</td>
                  <td>
                    {lead.score >= 5 ? <span className="badge badge-hot"><Flame size={12} style={{marginRight: 4}} /> HOT</span> : lead.score}
                  </td>
                  <td>
                    <span style={{
                      textTransform: 'capitalize',
                      color: lead.contacted_status === 'pending' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {lead.contacted_status}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      {lead.phone && <PhoneCall size={16} className="text-muted" />}
                      {lead.email && <Mail size={16} className="text-muted" />}
                    </div>
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button className="btn btn-outline" style={{padding: '0.4rem'}}>
                        <ExternalLink size={16} />
                      </button>
                      <button className="btn btn-primary" style={{padding: '0.4rem'}}>
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
