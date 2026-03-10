import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
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
  History,
  Instagram,
  Facebook,
  Check,
  MessageCircle,
  Linkedin,
  Trash2
} from 'lucide-react';
import Chatbot from './Chatbot';

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [hideContacted, setHideContacted] = useState(false);
  const [newNiche, setNewNiche] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const startCloudScan = async () => {
    if (!newNiche || !newLocation) {
      alert("Please enter both Niche and Location.");
      return;
    }

    const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
    const REPO_OWNER = "akshat92008";
    const REPO_NAME = "email-outreach-agent";
    const WORKFLOW_ID = "scrape.yml";

    setIsScanning(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { niche: newNiche, location: newLocation }
        })
      });

      if (response.status === 204) {
        alert(`🚀 Scan launched successfully for ${newNiche} in ${newLocation}! Results will appear in the dashboard soon.`);
      } else {
        const errData = await response.json();
        throw new Error(errData.message || "GitHub API returned an error");
      }
    } catch (error) {
      console.error("Error triggering scan:", error);
      alert("Failed to start scan. Please check your GitHub token and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const deleteLead = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete lead: ${name}?`)) {
      try {
        await deleteDoc(doc(db, "leads", id));
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const clearAllContacted = async () => {
    const contactedLeads = leads.filter(l => l.contacted_status !== 'pending');
    if (contactedLeads.length === 0) return;

    if (window.confirm(`Permanently delete ALL ${contactedLeads.length} contacted leads? This cannot be undone.`)) {
      try {
        for (const lead of contactedLeads) {
          await deleteDoc(doc(db, "leads", lead.id));
        }
      } catch (error) {
        console.error("Error clearing leads:", error);
      }
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000);
  };


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

  const filteredLeads = leads.filter(l => {
    const matchesSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isHidden = hideContacted && l.contacted_status !== 'pending';
    return matchesSearch && !isHidden;
  });

  const contactedCount = leads.filter(l => l.contacted_status !== 'pending').length;
  const stats = {
    total: leads.length,
    highValue: leads.filter(l => (l.score || 0) >= 80).length,
    noWebsite: leads.filter(l => !l.has_website || l.has_website === 'No').length,
    conversion: contactedCount > 0 ? ((contactedCount / leads.length) * 100).toFixed(1) : 0,
    velocity: (leads.filter(l => {
      const created = new Date(l.created_at);
      const now = new Date();
      return (now - created) < 24 * 60 * 60 * 1000;
    }).length)
  };

  const getPriority = (score) => {
    if (score >= 80) return { label: 'HIGH VALUE', class: 'badge-priority-high' };
    if (score >= 50) return { label: 'MEDIUM VALUE', class: 'badge-priority-medium' };
    return { label: 'LOW VALUE', class: 'badge-priority-low' };
  };

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        contacted_status: newStatus,
        history: arrayUnion({
          event: `Lead status updated to ${newStatus}`,
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

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Lead Generation Machine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time lead intelligence & outreach automation</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hide Contacted</span>
            <label className="switch" style={{ scale: '0.8' }}>
              <input
                type="checkbox"
                checked={hideContacted}
                onChange={(e) => setHideContacted(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <button className="btn btn-outline" style={{ borderColor: '#fca5a5', color: '#dc2626' }} onClick={clearAllContacted}>
            <Trash2 size={18} /> Clear Contacted
          </button>
          <button className="btn btn-outline" onClick={exportLeads}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={20} /> Lead Discovery Engine (Cloud)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#1e3a8a', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
              Target new prospects globally using our AI-powered cloud scrapers.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e40af' }}>NICHE (E.G. COACH, DENTIST)</label>
            <input
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
              placeholder="Who are we looking for?"
              style={{ width: '100%', borderColor: '#60a5fa' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e40af' }}>LOCATION (E.G. NEW YORK, LONDON)</label>
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Where should we look?"
              style={{ width: '100%', borderColor: '#60a5fa' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={startCloudScan}
            disabled={isScanning}
            style={{ height: '42px', backgroundColor: '#2563eb', padding: '0 2rem' }}
          >
            {isScanning ? 'Initiating...' : 'Launch AI Scan'}
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card stat-card">
          <span className="label">Total Pipe</span>
          <span className="value">{stats.total}</span>
          <BarChart3 className="icon" size={24} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="card stat-card">
          <span className="label">High Value</span>
          <span className="value">{stats.highValue}</span>
          <Flame className="icon" size={24} style={{ color: '#f87171' }} />
        </div>
        <div className="card stat-card">
          <span className="label">No Website</span>
          <span className="value">{stats.noWebsite}</span>
          <ExternalLink className="icon" size={24} style={{ color: '#60a5fa' }} />
        </div>
        <div className="card stat-card">
          <span className="label">Conv. Rate</span>
          <span className="value">{stats.conversion}%</span>
          <TrendingUp className="icon" size={24} style={{ color: 'var(--success)' }} />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Active Prospects</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Business Name</th>
                <th>AI Score</th>
                <th>Location</th>
                <th>Outreach</th>
                <th>Pipeline Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const priority = getPriority(lead.score || 0);
                // Helper to check if a value is real or a placeholder
                const isReal = (val) => val && val !== 'Pending Verification' && val !== 'N/A';

                return (
                  <tr key={lead.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => setSelectedLead(lead)}
                        title="View History"
                      >
                        {lead.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {lead.niche}
                        {lead.has_website === false ? (
                          <span style={{ fontSize: '0.65rem', padding: '1px 4px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontWeight: 700 }}>NO WEBSITE</span>
                        ) : lead.original_website ? (
                          <span style={{ fontSize: '0.65rem', padding: '1px 4px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '4px', fontWeight: 700 }}>DIRECTORY ONLY</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${priority.class}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td>{lead.city}, {lead.country}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {isReal(lead.phone) ? (
                          <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} title="Call Lead">
                            <PhoneCall size={16} style={{ cursor: 'pointer', color: 'var(--primary)' }} />
                          </a>
                        ) : (
                          <span title="Phone Unavailable">
                            <PhoneCall size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}

                        {isReal(lead.email) ? (
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent('Partnership Inquiry')}&body=${encodeURIComponent(lead.outreach_message || 'Hi, I noticed your business...')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Email Lead via Gmail"
                          >
                            <Mail size={16} style={{ cursor: 'pointer', color: 'var(--primary)' }} />
                          </a>
                        ) : (
                          <span title="Email Unavailable">
                            <Mail size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}

                        {isReal(lead.facebook) ? (
                          <a
                            href={lead.facebook.includes('m.me') ? lead.facebook : `https://m.me/${lead.facebook.split('/').filter(Boolean).pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_message || '', 'Facebook'); }}
                            title="Message on FB (Auto-copy Message)"
                          >
                            <Facebook size={16} style={{ cursor: 'pointer', color: '#1877F2' }} />
                          </a>
                        ) : (
                          <span title="Facebook Unavailable">
                            <Facebook size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}

                        {isReal(lead.instagram) ? (
                          <a
                            href={lead.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_message || '', 'Instagram'); }}
                            title="Message on Instagram (Auto-copy Message)"
                          >
                            <Instagram size={16} style={{ cursor: 'pointer', color: '#E4405F' }} />
                          </a>
                        ) : (
                          <span title="Instagram Unavailable">
                            <Instagram size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}

                        {isReal(lead.linkedin) ? (
                          <a
                            href={lead.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_message || '', 'LinkedIn'); }}
                            title="Connect on LinkedIn (Auto-copy Message)"
                          >
                            <Linkedin size={16} style={{ cursor: 'pointer', color: '#0A66C2' }} />
                          </a>
                        ) : (
                          <span title="LinkedIn Unavailable">
                            <Linkedin size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}

                        {(isReal(lead.whatsapp) || lead.whatsapp_ready_number) ? (
                          <a
                            href={`https://wa.me/${lead.whatsapp || lead.whatsapp_ready_number}?text=${encodeURIComponent(lead.outreach_message || 'Hi!')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_message || '', 'WhatsApp'); }}
                            title="Message on WhatsApp (Auto-copy Message)"
                          >
                            <MessageCircle size={16} style={{ cursor: 'pointer', color: '#25D366' }} />
                          </a>
                        ) : (
                          <span title="WhatsApp Unavailable">
                            <MessageCircle size={16} style={{ color: 'var(--border)', opacity: 0.5 }} />
                          </span>
                        )}
                      </div>
                      {copyStatus && (
                        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--success)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', zIndex: 1001, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Check size={16} /> Outreach message copied for {copyStatus}!
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        value={lead.contacted_status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="pipeline-select"
                        style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="pending">New Lead</option>
                        <option value="qualified">Qualified</option>
                        <option value="contacted">Contacted</option>
                        <option value="replied">Replied</option>
                        <option value="demo_sent">Demo Sent</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ' + (lead.city || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline"
                          style={{ padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                          title="Search Business on Web"
                        >
                          <Search size={16} />
                        </a>
                        {lead.demo_url && (
                          <a
                            href={lead.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline"
                            style={{ padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                            title="View Demo Website"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          className="btn-outline"
                          style={{ padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', borderColor: '#fca5a5', color: '#ef4444' }}
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id, lead.name); }}
                          title="Delete Lead Permanently"
                        >
                          <Trash2 size={16} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{selectedLead.name}</h2>
              <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div className="grid-cols-2" style={{ marginBottom: '2rem', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <div className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NICHE</div>
                <div style={{ fontSize: '1rem' }}>{selectedLead.niche}</div>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <div className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STATUS</div>
                <div style={{ color: selectedLead.contacted_status === 'pending' ? 'var(--warning)' : 'var(--success)' }}>
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

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedLead(null)}>
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
