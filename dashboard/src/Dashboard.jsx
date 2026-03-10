import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import db from './firebase';
import { 
  Users, 
  Send, 
  Flame, 
  PhoneCall, 
  ExternalLink, 
  Mail, 
  Download,
  BarChart3,
  Search,
  TrendingUp,
  Clock,
  ArrowUpRight,
  TrendingDown,
  X,
  History
} from 'lucide-react';
import Chatbot from './Chatbot';

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

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
    (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contactedCount = leads.filter(l => l.contacted_status !== 'pending').length;
  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.score >= 7).length,
    conversion: contactedCount > 0 ? ((contactedCount / leads.length) * 100).toFixed(1) : 0,
    velocity: (leads.filter(l => {
        const created = new Date(l.created_at);
        const now = new Date();
        return (now - created) < 24 * 60 * 60 * 1000;
    }).length)
  };

  const getPriority = (score) => {
    if (score >= 8) return { label: 'HIGH', class: 'badge-priority-high' };
    if (score >= 5) return { label: 'MED', class: 'badge-priority-medium' };
    return { label: 'LOW', class: 'badge-priority-low' };
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'emailed' : 'pending';
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        contacted_status: newStatus,
        history: arrayUnion({
            event: `Lead marked as ${newStatus}`,
            timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const exportLeads = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,Phone,Score,Status"].join(",") + "\n"
      + leads.map(l => `${l.name},${l.email},${l.phone},${l.score},${l.contacted_status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{padding: '4rem', textAlign: 'center'}}>Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 style={{marginBottom: '0.25rem'}}>Lead Generation Command Center</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Real-time lead intelligence & outreach automation</p>
        </div>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div style={{position: 'relative', width: '300px'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)'}} />
            <input 
              style={{paddingLeft: '2.5rem'}}
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={exportLeads}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card stat-card">
          <span className="label">Total Pipe</span>
          <span className="value">{stats.total}</span>
          <BarChart3 className="icon" size={24} style={{color: 'var(--primary)'}} />
        </div>
        <div className="card stat-card">
          <span className="label">High Intent</span>
          <span className="value">{stats.hot}</span>
          <Flame className="icon" size={24} style={{color: '#f87171'}} />
        </div>
        <div className="card stat-card">
          <span className="label">Conv. Rate</span>
          <span className="value">{stats.conversion}%</span>
          <TrendingUp className="icon" size={24} style={{color: 'var(--success)'}} />
        </div>
        <div className="card stat-card">
          <span className="label">24h Velocity</span>
          <span className="value">+{stats.velocity}</span>
          <Clock className="icon" size={24} style={{color: 'var(--accent)'}} />
        </div>
      </div>

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2>Active Prospects</h2>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Priority</th>
                <th>City / Country</th>
                <th>Contact</th>
                <th>Contacted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const priority = getPriority(lead.score || 0);
                return (
                  <tr key={lead.id}>
                    <td>
                      <div 
                        style={{fontWeight: 600, cursor: 'pointer', color: 'var(--primary)'}}
                        onClick={() => setSelectedLead(lead)}
                        title="View History"
                      >
                        {lead.name}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{lead.niche}</div>
                    </td>
                    <td>
                      <span className={`badge ${priority.class}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td>{lead.city}, {lead.country}</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        {lead.phone && lead.phone !== 'N/A' ? (
                          <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} title="Call Lead">
                            <PhoneCall size={16} style={{cursor: 'pointer', color: 'var(--primary)'}} />
                          </a>
                        ) : (
                          <span title="Phone Unavailable">
                            <PhoneCall size={16} style={{color: 'var(--border)', opacity: 0.5}} />
                          </span>
                        )}
                        {lead.email ? (
                          <a 
                            href={`mailto:${lead.email}?subject=Partnership Inquiry&body=${encodeURIComponent(lead.outreach_message || 'Hi, I noticed your business...')}`}
                            title="Email Lead"
                          >
                            <Mail size={16} style={{cursor: 'pointer', color: 'var(--primary)'}} />
                          </a>
                        ) : (
                          <span title="Email Unavailable">
                            <Mail size={16} style={{color: 'var(--border)', opacity: 0.5}} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <label className="switch" title="Toggle Contacted Status">
                        <input 
                          type="checkbox" 
                          checked={lead.contacted_status !== 'pending'}
                          onChange={() => toggleStatus(lead.id, lead.contacted_status)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <a 
                          href={lead.facebook || `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ' + (lead.city || ''))}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-outline" 
                          style={{padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center'}}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                            className="btn-outline"
                            style={{padding: '0.4rem', borderRadius: '4px'}}
                            onClick={() => setSelectedLead(lead)}
                        >
                            <History size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead History Modal */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
              <h2 style={{margin: 0}}>{selectedLead.name}</h2>
              <button onClick={() => setSelectedLead(null)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <div className="grid-cols-2" style={{marginBottom: '2rem', gap: '1rem'}}>
                <div className="glass-card" style={{padding: '1rem'}}>
                    <div className="label" style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>NICHE</div>
                    <div style={{fontSize: '1rem'}}>{selectedLead.niche}</div>
                </div>
                <div className="glass-card" style={{padding: '1rem'}}>
                    <div className="label" style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>STATUS</div>
                    <div style={{color: selectedLead.contacted_status === 'pending' ? 'var(--warning)' : 'var(--success)'}}>
                        {selectedLead.contacted_status.toUpperCase()}
                    </div>
                </div>
            </div>

            <h3>Activity Timeline</h3>
            <div className="timeline">
              {(selectedLead.history || [
                { event: 'Lead Discovered', timestamp: selectedLead.created_at }
              ]).map((entry, idx) => (
                <div className="timeline-item" key={idx}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-date">{new Date(entry.timestamp).toLocaleString()}</div>
                  <div className="timeline-event">{entry.event}</div>
                </div>
              ))}
            </div>
            
            <button className="btn btn-primary" style={{width: '100%'}} onClick={() => setSelectedLead(null)}>
                Close Insights
            </button>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
}

export default Dashboard;
