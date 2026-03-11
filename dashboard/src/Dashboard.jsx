// Build Trigger: Updated GitHub Token Diagnostics
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import db from './firebase';
import {
  Users, Send, Flame, PhoneCall, ExternalLink, Mail, Download, BarChart3, Search,
  TrendingUp, Clock, ArrowUpRight, TrendingDown, X, History, Instagram, Facebook,
  Check, MessageCircle, Linkedin, Trash2, LayoutGrid, List, Activity, XOctagon,
  Zap, Shield, Globe, Cpu, Copy
} from 'lucide-react';
import Chatbot from './Chatbot';
import PipelineBoard from './PipelineBoard';
import AnalyticsBoard from './AnalyticsBoard';
import OpportunityHeatmap from './OpportunityHeatmap';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [hideContacted, setHideContacted] = useState(false);
  const [newNiche, setNewNiche] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' or 'list'
  const [activeFilter, setActiveFilter] = useState('all');

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
      if (!GITHUB_TOKEN) {
        throw new Error("Missing GitHub Token. Please set VITE_GITHUB_TOKEN in GitHub Secrets (REPO SETTINGS > SECRETS > ACTIONS) and REDEPLOY.");
      }

      // GitHub's modern API preference is 'Bearer' for both classic and fine-grained tokens
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
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
        const msg = errData.message || "GitHub API returned an error";

        // Detailed diagnostic for Bad Credentials
        if (msg === "Bad credentials") {
          const tokenStatus = GITHUB_TOKEN ? `Present (Starts with: ${GITHUB_TOKEN.substring(0, 7)}... | Length: ${GITHUB_TOKEN.length})` : "MISSING";
          throw new Error(
            `GitHub Token rejected (Bad credentials).\n\n` +
            `DIAGNOSTICS:\n` +
            `- Token Status: ${tokenStatus}\n` +
            `- Action: Please ensure your token at GitHub.com/settings/tokens has 'workflow' and 'repo' scopes, then update the secret VITE_GITHUB_TOKEN in your repo settings and wait for the "Deploy Frontend" build to finish (approx 2 mins).`
          );
        }
        throw new Error(msg);
      }
    } catch (error) {
      console.error("Error triggering scan:", error);
      alert(`⚠️ Error: ${error.message}`);
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

  const clearAllLeads = async () => {
    if (leads.length === 0) return;
    if (window.confirm(`⚠️ DANGER: Permanently delete ALL ${leads.length} leads in the database? This cannot be undone.`)) {
      try {
        setLoading(true);
        // Delete in batches to avoid timeout issues if database is large
        const batchSize = 100;
        for (let i = 0; i < leads.length; i += batchSize) {
          const chunk = leads.slice(i, i + batchSize);
          await Promise.all(chunk.map(lead => deleteDoc(doc(db, "leads", lead.id))));
        }
        alert("Database wiped successfully. Dashboard is now empty.");
      } catch (error) {
        console.error("Error wiping database:", error);
        alert("Error wiping database. See console for details.");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearAllContacted = async () => {
    const contactedLeads = leads.filter(l => l.status !== 'new' && l.status !== 'pending');
    if (contactedLeads.length === 0) {
      alert("No contacted leads to delete.");
      return;
    }
    if (window.confirm(`Permanently delete ALL ${contactedLeads.length} contacted leads? This cannot be undone.`)) {
      try {
        for (const lead of contactedLeads) {
          await deleteDoc(doc(db, "leads", lead.id));
        }
      } catch (error) {
        console.error("Error clearing contacted leads:", error);
      }
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text || '');
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000);
  };


  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Harmonize status: if status is missing but contacted_status exists, use that
          status: data.status || data.contacted_status || 'new'
        };
      });
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLeads = leads.filter(l => {
    const nameStr = (l.name || '').toLowerCase();
    const cityStr = (l.city || '').toLowerCase();
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = nameStr.includes(searchLow) || cityStr.includes(searchLow);

    // contacted status detection
    const isContacted = l.status !== 'new' && l.status !== 'pending';
    const isHidden = hideContacted && isContacted;

    let matchesFilter = true;
    if (activeFilter === 'high_value') matchesFilter = (l.score || 0) >= 75;
    if (activeFilter === 'no_website') matchesFilter = !l.has_website || l.has_website === 'No';

    return matchesSearch && !isHidden && matchesFilter;
  });

  const contactedCount = leads.filter(l => l.status !== 'new' && l.status !== 'pending').length;

  const stats = {
    total: leads.length,
    highValue: leads.filter(l => (l.score || 0) >= 80).length,
    noWebsite: leads.filter(l => !l.has_website || l.has_website === 'No').length,
    conversion: leads.length > 0 ? ((leads.filter(l => l.status !== 'new').length / leads.length) * 100).toFixed(1) : 0,
    velocity: (leads.filter(l => {
      if (!l.created_at) return false;
      const created = l.created_at.toDate ? l.created_at.toDate() : new Date(l.created_at);
      const now = new Date();
      return (now - created) < 24 * 60 * 60 * 1000;
    }).length)
  };

  const getPriority = (score) => {
    if (score >= 80) return { label: 'HIGH OPPORTUNITY', class: 'badge-priority-high' };
    if (score >= 50) return { label: 'MEDIUM OPPORTUNITY', class: 'badge-priority-medium' };
    return { label: 'LOW OPPORTUNITY', class: 'badge-priority-low' };
  };

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        status: newStatus,
        contacted_status: newStatus, // Sync old schema
        history: arrayUnion({
          event: `Moved to ${newStatus.toUpperCase()}`,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const exportLeads = () => {
    // Escape quotes to prevent CSV breaking on commas inside outreach drafts
    const escapeCsv = (str) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Name", "Email", "Phone", "Score", "Stage", "Niche", "City", "Email Draft"].join(",") + "\n"
      + leads.map(l =>
        `${escapeCsv(l.name)},${escapeCsv(l.email)},${escapeCsv(l.phone)},${l.score || 0},${escapeCsv(l.status || 'new')},${escapeCsv(l.niche)},${escapeCsv(l.city)},${escapeCsv(l.outreach_email || l.outreach_message)}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '8rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: '1.2rem' }}>
    <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.8 }} className="animate-pulse" />
    <div style={{ letterSpacing: '0.1em' }}>INITIALIZING COMMAND CENTER...</div>
  </div>;

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary)', borderRadius: '12px', boxShadow: '0 0 20px var(--primary-glow)' }}>
              <Users size={24} color="white" />
            </div>
            <h1 style={{ margin: 0 }}>Lead Gen Pro <span style={{ color: 'var(--primary)', fontWeight: 400, opacity: 0.7 }}>V3.0</span></h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            Unified Intelligence & Multi-Channel Outreach Pipeline <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '1rem' }}>(Build: Mar 11, 4:40 PM)</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)', opacity: 0.6 }} />
            <input
              className="input-glow"
              style={{ paddingLeft: '2.75rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px' }}
              placeholder="Search prospects or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>MUTE CONTACTED</span>
            <label className="switch" style={{ scale: '0.75' }}>
              <input
                type="checkbox"
                checked={hideContacted}
                onChange={(e) => setHideContacted(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <button
            className="btn btn-outline"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', borderRadius: '14px' }}
            onClick={clearAllLeads}
            title="Wipe Entire Database"
          >
            <XOctagon size={18} /> Reset Database
          </button>
          <button
            className="btn btn-outline"
            style={{ color: 'var(--danger)', borderRadius: '14px' }}
            onClick={clearAllContacted}
            title="Delete Contacted Leads"
          >
            <Trash2 size={18} />
          </button>
          <button className="btn btn-outline" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '14px' }} onClick={() => navigate('/outreach')}>
            <Send size={18} /> Launch Outreach
          </button>
          <button className="btn btn-primary" style={{ borderRadius: '14px' }} onClick={exportLeads}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Discovery Engine & Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card discovery-engine" style={{ padding: '2rem' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.4rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                <Search size={18} color="var(--accent)" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Cloud Discovery Engine</h3>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TARGET NICHE</label>
                <input
                  className="input-glow"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  placeholder="e.g. Luxury Real Estate"
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.5)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>GEO LOCATION</label>
                <input
                  className="input-glow"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Dubai, UAE"
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.5)' }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={startCloudScan}
                disabled={isScanning}
                style={{ height: '48px', padding: '0 2.5rem', borderRadius: '12px' }}
              >
                {isScanning ? (
                  <>
                    <Activity size={18} className="animate-spin" /> Launching...
                  </>
                ) : 'Execute Scan'}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
          <div className="stat-card">
            <span className="label">Pipeline Size</span>
            <span className="value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="label">Conversion</span>
            <span className="value">{stats.conversion}<span style={{ fontSize: '1rem', opacity: 0.6 }}>%</span></span>
          </div>
          <div className="stat-card">
            <span className="label">Growth (24h)</span>
            <span className="value" style={{ color: 'var(--success)', background: 'none', WebkitTextFillColor: 'unset' }}>+{stats.velocity}</span>
          </div>
          <div className="stat-card">
            <span className="label">High Intent</span>
            <span className="value" style={{ color: 'var(--accent)', background: 'none', WebkitTextFillColor: 'unset' }}>{stats.highValue}</span>
          </div>
        </div>
      </div>

      {/* V3.0 Automation Features & Live Engine Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Zap size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Automation Features</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {[
              { icon: <Globe size={16} />, label: "Multi-Channel Discovery", status: "Active" },
              { icon: <Cpu size={16} />, label: "AI Opportunity Scoring", status: "Active" },
              { icon: <Mail size={16} />, label: "Auto-Email Sequences", status: "Running" },
              { icon: <Instagram size={16} />, label: "Instagram Lead Mining", status: "Active" },
              { icon: <MessageCircle size={16} />, label: "SMS Outreach Engine", status: "Ready" },
              { icon: <Shield size={16} />, label: "Intent-Based Auto-Stop", status: "Active" }
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <span style={{ opacity: 0.7 }}>{feat.icon}</span>
                  <span>{feat.label}</span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: feat.status === 'Running' ? 'var(--success)' : 'var(--primary)', opacity: 0.8, letterSpacing: '0.05em' }}>{feat.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Activity size={20} color="var(--success)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Automation Engine Status</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{leads.filter(l => l.status === 'contacted').length}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Emails Sent</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{leads.filter(l => l.status === 'replied').length}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>AI Responses</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{leads.filter(l => l.status === 'demo_booked').length}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Bookings</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0) 100%)', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.4rem' }}>Engine Log: v3.0_Sequence_Active</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: 1.4 }}>
              System is currently monitoring {leads.filter(l => l.status === 'contacted').length} active threads.
              Follow-up sequences for day 3, 7, and 14 are automated and will pause instantly upon receipt of intent-positive replies.
            </div>
          </div>
        </div>
      </div>

      {/* Global Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', alignItems: 'center' }}>
        <TrendingUp size={18} color="var(--primary)" />
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => setActiveFilter('all')} className={`btn btn-outline ${activeFilter === 'all' ? 'active-view' : ''}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '30px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Master List
          </button>
          <button onClick={() => setActiveFilter('high_value')} className={`btn btn-outline ${activeFilter === 'high_value' ? 'active-view' : ''}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '30px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            High Intent Only
          </button>
          <button onClick={() => setActiveFilter('no_website')} className={`btn btn-outline ${activeFilter === 'no_website' ? 'active-view' : ''}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '30px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gap Analysis (No Web)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
        <AnalyticsBoard leads={leads} />
        <OpportunityHeatmap leads={leads} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>CRM Pipeline</h2>

          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.25rem', borderRadius: '8px' }}>
            <button
              className={`btn-outline ${viewMode === 'pipeline' ? 'active-view' : ''}`}
              onClick={() => setViewMode('pipeline')}
              style={{ border: 'none', backgroundColor: viewMode === 'pipeline' ? 'var(--card-bg)' : 'transparent', boxShadow: viewMode === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              <LayoutGrid size={18} /> Board
            </button>
            <button
              className={`btn-outline ${viewMode === 'list' ? 'active-view' : ''}`}
              onClick={() => setViewMode('list')}
              style={{ border: 'none', backgroundColor: viewMode === 'list' ? 'var(--card-bg)' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              <List size={18} /> List
            </button>
          </div>
        </div>

        {viewMode === 'pipeline' ? (
          <PipelineBoard
            leads={filteredLeads}
            updateLeadStatus={updateLeadStatus}
            setSelectedLead={setSelectedLead}
          />
        ) : (
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>AI: {lead.primary_gap || 'Analyzing...'}</span>
                          {lead.lost_customers && <span style={{ opacity: 0.6 }}>• Potential Loss: {lead.lost_customers}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className={`badge ${priority.class}`}>
                            {priority.label}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '4px' }}>
                            CORE SCORE: {lead.score || 0}%
                          </span>
                        </div>
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
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent('Partnership Inquiry')}&body=${encodeURIComponent(lead.outreach_email || 'Hi, I noticed your business...')}`}
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
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_email || '', 'Facebook'); }}
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
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_email || '', 'Instagram'); }}
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
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_email || '', 'LinkedIn'); }}
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
                              href={`https://wa.me/${(lead.whatsapp || lead.whatsapp_ready_number).replace(/[^\d]/g, '')}?text=${encodeURIComponent(lead.outreach_email || 'Hi!')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.outreach_email || '', 'WhatsApp'); }}
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
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="pipeline-select"
                          style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                        >
                          <option value="new">New Lead</option>
                          <option value="contacted">Contacted</option>
                          <option value="replied">Replied</option>
                          <option value="demo_booked">Demo Booked</option>
                          <option value="closed">Closed</option>
                          <option value="lost">Lost</option>
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
                          {lead.original_website && (
                            <a
                              href={lead.original_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-outline"
                              style={{ padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                              title="Visit Website"
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
        )}
      </div>

      {/* Lead History Modal */}
      {
        selectedLead && (
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
                  <div className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRIMARY GAP</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 700 }}>{selectedLead.primary_gap || 'No Gap Detected'}</div>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                  <div className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OPPORTUNITY SCORE</div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--success)', fontWeight: 700 }}>{selectedLead.opportunity_score || 0}%</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary-glow)' }}>
                <div className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AI INSIGHT</div>
                <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, color: 'var(--text-main)' }}>{selectedLead.opportunity_insight || 'Running analysis...'}</p>
                {selectedLead.lost_customers && (
                  <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                    ⚠️ Estimated Lost Customers: {selectedLead.lost_customers} / mo
                  </div>
                )}
              </div>

              {/* Outreach Drafts Display */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                  <Zap size={20} color="var(--primary)" /> AI Generated Outreach
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Email Card */}
                  <div className="glass-card" style={{ padding: '0', background: 'rgba(34, 211, 238, 0.03)', border: '1px solid rgba(34, 211, 238, 0.2)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', background: 'rgba(34, 211, 238, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(34, 211, 238, 0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                        <Mail size={16} /> HIGH-CONVERTING EMAIL
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => copyToClipboard(selectedLead.outreach_email, 'Email')} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Copy size={14} /> Copy</button>
                        {isReal(selectedLead.email) && (
                          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedLead.email)}&su=${encodeURIComponent(selectedLead.outreach_email_subject || 'Partnership Inquiry')}&body=${encodeURIComponent(selectedLead.outreach_email || '')}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', borderRadius: '4px' }}>
                            <Send size={14} /> Send
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {selectedLead.outreach_email_subject && <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Subject: <span style={{ fontWeight: 400, opacity: 0.9 }}>{selectedLead.outreach_email_subject}</span></div>}
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>{selectedLead.outreach_email || 'No email generated yet.'}</pre>
                    </div>
                  </div>

                  {/* Social Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* IG / FB Card */}
                    <div className="glass-card" style={{ padding: '0', background: 'rgba(228, 64, 95, 0.03)', border: '1px solid rgba(228, 64, 95, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '1rem', background: 'rgba(228, 64, 95, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(228, 64, 95, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E4405F', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                          <Instagram size={16} /> INSTAGRAM / FB
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => copyToClipboard(selectedLead.outreach_ig, 'Instagram')} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderColor: '#E4405F', color: '#E4405F', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Copy size={12} /> Copy</button>
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem', flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{selectedLead.outreach_ig || 'No DM generated yet.'}</p>
                      </div>
                    </div>

                    {/* SMS Card */}
                    <div className="glass-card" style={{ padding: '0', background: 'rgba(37, 211, 102, 0.03)', border: '1px solid rgba(37, 211, 102, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '1rem', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(37, 211, 102, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                          <MessageCircle size={16} /> DIRECT SMS
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => copyToClipboard(selectedLead.outreach_sms, 'SMS')} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderColor: '#25D366', color: '#25D366', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Copy size={12} /> Copy</button>
                          {isReal(selectedLead.phone) && (
                            <a href={`https://wa.me/${selectedLead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(selectedLead.outreach_sms || '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', backgroundColor: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Send size={12} /> Send</a>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem', flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{selectedLead.outreach_sms || 'No SMS generated yet.'}</p>
                      </div>
                    </div>
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
        )
      }

      <Chatbot />
    </div >
  );
}

export default Dashboard;
