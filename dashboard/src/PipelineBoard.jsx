import React, { useState } from 'react';
import { Mail, PhoneCall, Linkedin, Instagram } from 'lucide-react';

const STAGES = [
    { id: 'new', label: 'New Lead', color: 'var(--primary)', icon: '📥' },
    { id: 'contacted', label: 'Contacted', color: '#f39c12', icon: '✉️' },
    { id: 'replied', label: 'Replied', color: '#3498db', icon: '💬' },
    { id: 'demo_booked', label: 'Demo Booked', color: '#9b59b6', icon: '🎥' },
    { id: 'closed', label: 'Closed', color: 'var(--success)', icon: '🏆' },
    { id: 'lost', label: 'Lost', color: '#64748b', icon: '💤' }
];

export default function PipelineBoard({ leads, updateLeadStatus, setSelectedLead }) {
    const [draggedLeadId, setDraggedLeadId] = useState(null);

    const handleDragStart = (e, leadId) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', leadId);

        setTimeout(() => {
            if (e.target) e.target.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e) => {
        if (e.target) e.target.style.opacity = '1';
        setDraggedLeadId(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStageId) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('text/plain');

        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.status === targetStageId) return;

        await updateLeadStatus(leadId, targetStageId);
        setDraggedLeadId(null);
    };

    const leadsByStage = STAGES.reduce((acc, stage) => {
        acc[stage.id] = leads.filter(l => (l.status || 'new') === stage.id);
        return acc;
    }, {});

    return (
        <div className="pipeline-board" style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '1.5rem',
            minHeight: '650px',
            scrollbarWidth: 'thin'
        }}>
            {STAGES.map(stage => (
                <div
                    key={stage.id}
                    className="pipeline-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    style={{
                        flex: '0 0 320px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '1.25rem',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s'
                    }}
                >
                    {/* Column Header */}
                    <div style={{
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                                {stage.label}
                            </h3>
                        </div>
                        <span style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-muted)',
                            padding: '2px 10px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            border: '1px solid var(--border)'
                        }}>
                            {leadsByStage[stage.id].length}
                        </span>
                    </div>

                    <div style={{
                        height: '2px',
                        width: '100%',
                        background: `linear-gradient(90deg, ${stage.color} 0%, transparent 100%)`,
                        opacity: 0.5
                    }}></div>

                    {/* Draggable Cards Container */}
                    <div style={{
                        padding: '1rem',
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                    }}>
                        {leadsByStage[stage.id].map(lead => (
                            <div
                                key={lead.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => setSelectedLead(lead)}
                                className="pipeline-card"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    padding: '1.25rem',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border)',
                                    cursor: 'grab',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.65rem',
                                    position: 'relative',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                                        {lead.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        color: lead.score >= 75 ? 'var(--accent)' : 'var(--text-muted)',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {lead.score || 0}%
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {lead.niche} <span style={{ opacity: 0.4 }}>•</span> {lead.city}
                                </div>

                                {lead.primary_gap && (
                                    <div style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--accent)',
                                        background: 'rgba(34, 211, 238, 0.05)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(34, 211, 238, 0.2)',
                                        marginTop: '2px'
                                    }}>
                                        AI: {lead.primary_gap}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    marginTop: '0.5rem',
                                    paddingTop: '0.85rem',
                                    borderTop: '1px solid var(--border)'
                                }}>
                                    {lead.email && <Mail size={14} style={{ opacity: 0.7 }} />}
                                    {lead.phone && lead.phone !== 'N/A' && <PhoneCall size={14} style={{ opacity: 0.7 }} />}
                                    {lead.linkedin && <Linkedin size={14} style={{ color: '#0A66C2', opacity: 0.8 }} />}
                                    {lead.instagram && <Instagram size={14} style={{ color: '#E4405F', opacity: 0.8 }} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
