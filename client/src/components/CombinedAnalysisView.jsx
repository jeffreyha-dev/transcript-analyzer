import { useState } from 'react';
import AnalysisView from './AnalysisView';
import AIAnalysisView from './AIAnalysisView';

export default function CombinedAnalysisView() {
    const [activeTab, setActiveTab] = useState(() => {
        // Check if there's a pending AI analysis filter
        const hasFilter = sessionStorage.getItem('aiAnalysisFilter');
        return hasFilter ? 'ai' : 'traditional';
    });

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Analysis Hub</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Comprehensive conversation analysis and AI insights
                    </p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-md mb-lg" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                    className={`btn ${activeTab === 'traditional' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottom: activeTab === 'traditional' ? 'none' : '1px solid var(--border-color)',
                        marginBottom: '-1px'
                    }}
                    onClick={() => setActiveTab('traditional')}
                >
                    🔍 Traditional Analysis
                </button>
                <button
                    className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottom: activeTab === 'ai' ? 'none' : '1px solid var(--border-color)',
                        marginBottom: '-1px'
                    }}
                    onClick={() => setActiveTab('ai')}
                >
                    🤖 AI Analysis
                </button>
            </div>

            {/* Content Area */}
            <div className="fade-in">
                {activeTab === 'traditional' && (
                    <div style={{ marginTop: '-2rem' }}>
                        <AnalysisView />
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div style={{ marginTop: '-2rem' }}>
                        <AIAnalysisView />
                    </div>
                )}
            </div>
        </div>
    );
}
