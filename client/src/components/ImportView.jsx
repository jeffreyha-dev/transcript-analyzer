import { useState } from 'react';
import Upload from './Upload';
import LivePersonFetch from './LivePersonFetch';

export default function ImportView() {
    const [activeTab, setActiveTab] = useState('upload');

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Import Data</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Import conversations from files or external services
                    </p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-md mb-lg" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                    className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottom: activeTab === 'upload' ? 'none' : '1px solid var(--border-color)',
                        marginBottom: '-1px'
                    }}
                    onClick={() => setActiveTab('upload')}
                >
                    📁 File Upload
                </button>
                <button
                    className={`btn ${activeTab === 'liveperson' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottom: activeTab === 'liveperson' ? 'none' : '1px solid var(--border-color)',
                        marginBottom: '-1px'
                    }}
                    onClick={() => setActiveTab('liveperson')}
                >
                    🔗 LivePerson Fetch
                </button>
            </div>

            {/* Content Area */}
            <div className="fade-in">
                {activeTab === 'upload' && (
                    <div style={{ marginTop: '-2rem' }}>
                        {/* Negative margin to offset the padding inside Upload component if needed, 
                            or we can just let it have its own padding. 
                            Upload component has its own container and padding. 
                            We might want to wrap it in a div that resets some styles if necessary.
                            For now, let's just render it. The nested container might add double padding.
                        */}
                        <Upload />
                    </div>
                )}
                {activeTab === 'liveperson' && (
                    <div style={{ marginTop: '-2rem' }}>
                        <LivePersonFetch />
                    </div>
                )}
            </div>
        </div>
    );
}
