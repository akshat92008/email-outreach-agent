import React from 'react';
import { Target, MessageCircle, CalendarCheck, CheckCircle2, XOctagon } from 'lucide-react';

export default function AnalyticsBoard({ leads }) {
    // Aggregate Metrics
    const total = leads.length;
    const contacted = leads.filter(l => l.status === 'contacted' || l.status === 'replied' || l.status === 'demo_booked' || l.status === 'closed' || l.status === 'lost').length;
    const replied = leads.filter(l => l.status === 'replied' || l.status === 'demo_booked' || l.status === 'closed').length;
    const booked = leads.filter(l => l.status === 'demo_booked' || l.status === 'closed').length;
    const closed = leads.filter(l => l.status === 'closed').length;
    const lost = leads.filter(l => l.status === 'lost').length;

    // Conversion Rates
    const contactRate = total ? Math.round((contacted / total) * 100) : 0;
    const replyRate = contacted ? Math.round((replied / contacted) * 100) : 0;
    const bookedRate = replied ? Math.round((booked / replied) * 100) : 0;
    const closeRate = booked ? Math.round((closed / booked) * 100) : 0;

    // Assume $2,500 LTV per closed deal for visualization
    const estimatedRevenue = closed * 2500;

    const FunnelStage = ({ label, count, rate, icon: Icon, color }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background fill representing conversion rate */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${rate || 0}%`,
                backgroundColor: color,
                opacity: 0.1,
                zIndex: 0
            }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1 }}>
                <div style={{ padding: '0.5rem', backgroundColor: color + '20', borderRadius: '8px', color: color }}>
                    <Icon size={20} />
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} prospects</div>
                </div>
            </div>

            <div style={{ zIndex: 1, textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: color }}>
                    {rate}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conversion</div>
            </div>
        </div>
    );

    return (
        <div className="analytics-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

            {/* Funnel Widget */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} color="var(--primary)" /> Sales Pipeline Funnel
                </h3>

                <FunnelStage label="Initial Contact" count={contacted} rate={contactRate} icon={Send} color="#fca5a5" />
                <FunnelStage label="Replied" count={replied} rate={replyRate} icon={MessageCircle} color="#60a5fa" />
                <FunnelStage label="Demo Booked" count={booked} rate={bookedRate} icon={CalendarCheck} color="#c084fc" />
                <FunnelStage label="Deal Closed" count={closed} rate={closeRate} icon={CheckCircle2} color="#34d399" />
            </div>

            {/* Revenue Widget */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Revenue Projections</h3>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        Estimated Pipeline Value
                    </div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
                        ${estimatedRevenue.toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{booked}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Demos Scheduled</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{lost}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lost Leads</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
// Placeholder for Send icon if not imported from lucid-react directly in this file
const Send = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
