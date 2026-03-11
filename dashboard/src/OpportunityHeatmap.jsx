import React from 'react';
import { MapPin } from 'lucide-react';

export default function OpportunityHeatmap({ leads }) {
    // Group leads by city and calculate average opportunity score
    const cityData = leads.reduce((acc, lead) => {
        const city = lead.city || 'Unknown';
        if (!acc[city]) {
            acc[city] = { count: 0, totalScore: 0, noWeb: 0 };
        }
        acc[city].count += 1;
        acc[city].totalScore += (lead.opportunity_score || lead.score || 0);
        if (!lead.has_website || lead.has_website === 'No') {
            acc[city].noWeb += 1;
        }
        return acc;
    }, {});

    const sortedCities = Object.entries(cityData)
        .map(([name, data]) => ({
            name,
            avgScore: Math.round(data.totalScore / data.count),
            count: data.count,
            noWeb: data.noWeb,
            intensity: Math.min(100, Math.round((data.totalScore / data.count) * 1.2)) // Boost intensity for visualization
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    return (
        <div className="card heat-map" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="var(--accent)" /> Opportunity Heatmap (Top Cities)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedCities.map((city, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 700 }}>{city.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{city.avgScore}% Opportunity</span>
                        </div>
                        <div style={{
                            height: '12px',
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${city.intensity}%`,
                                background: `linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)`,
                                boxShadow: '0 0 10px var(--primary-glow)',
                                transition: 'width 1s ease-out'
                            }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <span>{city.count} Total Leads</span>
                            <span style={{ color: 'var(--danger)' }}>{city.noWeb} No Website</span>
                        </div>
                    </div>
                ))}
            </div>

            {sortedCities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Insufficient data for heatmap generation.
                </div>
            )}
        </div>
    );
}
