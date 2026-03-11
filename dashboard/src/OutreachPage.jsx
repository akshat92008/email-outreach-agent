import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import db from './firebase';
import {
    Users, Send, PhoneCall, Mail, Instagram, Linkedin,
    MessageCircle, ArrowLeft, Search, Check, Copy, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OutreachPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [copyStatus, setCopyStatus] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, "leads"), orderBy("created_at", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLeads(leadsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(type);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const updateStatus = async (id, status) => {
        const leadRef = doc(db, 'leads', id);
        await updateDoc(leadRef, {
            status: status,
            contacted_status: status,
            history: arrayUnion({
                event: `Manual Outreach via ${status.toUpperCase()}`,
                timestamp: new Date().toISOString()
            })
        });
    };

    const filteredLeads = leads.filter(l =>
        (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="dashboard-container">Loading Outreach Engine...</div>;

    return (
        <div className="dashboard-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.6rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0 }}>Multi-Channel <span style={{ color: 'var(--primary)' }}>Outreach</span></h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Direct manual engagement console</p>
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                        className="input-glow"
                        style={{ paddingLeft: '2.75rem', width: '100%' }}
                        placeholder="Search prospects to message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filteredLeads.map(lead => (
                    <div key={lead.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{lead.name}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.niche} • {lead.city}</span>
                            </div>
                            <div className="badge badge-priority-high">{lead.score || 0}% Match</div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>AI GENERATED HOOK</div>
                            {lead.outreach_message || lead.outreach_email || "No custom hook generated yet."}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(lead.outreach_message || 'Hi!')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline"
                                onClick={() => updateStatus(lead.id, 'contacted')}
                                style={{ justifyContent: 'center', borderColor: '#25D366', color: '#25D366' }}
                            >
                                <MessageCircle size={18} /> WhatsApp
                            </a>

                            {/* Gmail */}
                            <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=Partnership&body=${encodeURIComponent(lead.outreach_message || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline"
                                onClick={() => updateStatus(lead.id, 'contacted')}
                                style={{ justifyContent: 'center', borderColor: '#EA4335', color: '#EA4335' }}
                            >
                                <Mail size={18} /> Gmail
                            </a>

                            {/* Instagram */}
                            <a
                                href={lead.instagram || `https://instagram.com/direct/inbox/`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline"
                                onClick={() => updateStatus(lead.id, 'contacted')}
                                style={{ justifyContent: 'center', borderColor: '#E4405F', color: '#E4405F' }}
                            >
                                <Instagram size={18} /> Instagram
                            </a>

                            {/* Phone */}
                            <a
                                href={`tel:${lead.phone}`}
                                className="btn btn-outline"
                                onClick={() => updateStatus(lead.id, 'contacted')}
                                style={{ justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            >
                                <PhoneCall size={18} /> Call Lead
                            </a>
                        </div>

                        <button
                            className="btn btn-outline"
                            style={{ width: '100%', fontSize: '0.75rem' }}
                            onClick={() => copyToClipboard(lead.outreach_message || lead.outreach_email || '', lead.id)}
                        >
                            {copyStatus === lead.id ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy AI Hook</>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
