import React, { useState } from 'react';
import { Mail, PhoneCall, Facebook, Instagram, Linkedin, MessageCircle, MoreVertical } from 'lucide-react';

const STAGES = [
    { id: 'new', label: 'New Lead', color: 'var(--primary)' },
    { id: 'contacted', label: 'Contacted', color: '#f39c12' },
    { id: 'replied', label: 'Replied', color: '#3498db' },
    { id: 'demo_booked', label: 'Demo Booked', color: '#9b59b6' },
    { id: 'closed', label: 'Closed', color: 'var(--success)' },
    { id: 'lost', label: 'Lost', color: 'var(--danger)' }
];

export default function PipelineBoard({ leads, updateLeadStatus, setSelectedLead }) {
    const [draggedLeadId, setDraggedLeadId] = useState(null);

    const handleDragStart = (e, leadId) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', leadId);

        // Slight delay for visual drag ghosting styling
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
        if (!lead || lead.status === targetStageId) return; // Prevent unnecessary DB calls

        await updateLeadStatus(leadId, targetStageId);
        setDraggedLeadId(null);
    };

    // Group leads by their status. Fallback to 'new' if undefined.
    const leadsByStage = STAGES.reduce((acc, stage) => {
        acc[stage.id] = leads.filter(l => (l.status || 'new') === stage.id);
        return acc;
    }, {});

    return (
        <div className="pipeline-board" style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            minHeight: '600px'
        }}>
            {STAGES.map(stage => (
                <div
                    key={stage.id}
                    className="pipeline-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    style={{
                        flex: '0 0 320px',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: '8px',
                        border: `1px solid var(--border)`,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Column Header */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '2px solid',
                        borderBottomColor: stage.color,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--card-bg)',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stage.color }}></span>
                            {stage.label}
                        </h3>
                        <span style={{
                            backgroundColor: 'var(--border)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}>
                            {leadsByStage[stage.id].length}
                        </span>
                    </div>

                    {/* Draggable Cards Container */}
                    <div style={{
                        padding: '1rem',
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        backgroundColor: draggedLeadId ? 'rgba(0,0,0,0.02)' : 'transparent'
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
                                    backgroundColor: 'var(--card-bg)',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: '1px solid var(--border)',
                                    cursor: 'grab',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    position: 'relative',
                                    transition: 'transform 0.1s ease',
                                }}
                            >
                                {/* Score Badge */}
                                <div style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
                                    {lead.score >= 75 ? (
                                        <span className="badge badge-priority-high shadow-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{lead.score}★</span>
                                    ) : lead.score >= 40 ? (
                                        <span className="badge badge-priority-medium shadow-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{lead.score}★</span>
                                    ) : (
                                        <span className="badge badge-priority-low shadow-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{lead.score}★</span>
                                    )}
                                </div>

                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', paddingRight: '20px' }}>
                                    {lead.name}
                                </div>

                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {lead.niche} • {lead.city}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                                    {lead.email && <Mail size={14} style={{ color: 'var(--primary)' }} title="Email Available" />}
                                    {lead.phone && lead.phone !== 'N/A' && <PhoneCall size={14} style={{ color: 'var(--primary)' }} title="Phone Available" />}
                                    {lead.linkedin && <Linkedin size={14} style={{ color: '#0A66C2' }} title="LinkedIn Available" />}
                                    {lead.instagram && <Instagram size={14} style={{ color: '#E4405F' }} title="Instagram Available" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
