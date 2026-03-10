import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import db from './firebase';
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
import Chatbot from './Chatbot';

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'emailed' : 'pending';
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        contacted_status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
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
                      {lead.phone && lead.phone !== 'N/A' && (
                        <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} title="Call Lead">
                          <PhoneCall size={16} className="text-muted" style={{cursor: 'pointer'}} />
                        </a>
                      )}
                      {lead.email && lead.email !== 'Pending Verification' && (
                        <a 
                          href={`mailto:${lead.email}?subject=Partnership Inquiry - ${lead.name}&body=${encodeURIComponent(lead.outreach_message || 'Hi, I noticed your business and would like to connect.')}`}
                          title="Email Lead"
                        >
                          <Mail size={16} className="text-muted" style={{cursor: 'pointer'}} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <a 
                        href={lead.facebook && lead.facebook !== 'Pending Verification' ? lead.facebook : `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ' + (lead.city || ''))}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline" 
                        style={{padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        title="View Web Presence"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        className={`btn ${lead.contacted_status === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                        style={{padding: '0.4rem'}}
                        onClick={() => toggleStatus(lead.id, lead.contacted_status)}
                        title={lead.contacted_status === 'pending' ? "Mark as Contacted" : "Mark as Pending"}
                      >
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
      <Chatbot />
    </div>
  );
}

export default Dashboard;
