import { useState } from 'react';
import api from '../utils/api';

export default function ExportView() {
    const [format, setFormat] = useState('json');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            setError(null);
            setSuccess(false);

            await api.exportResults(format);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 className="mb-md">Export Results</h1>
                <p className="mb-lg" style={{ color: 'var(--text-secondary)' }}>
                    Download analysis results in your preferred format
                </p>

                <div className="card mb-md">
                    <h3 className="card-title">Export Configuration</h3>

                    <div className="mt-md">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Export Format
                        </label>
                        <div className="flex gap-md">
                            <button
                                className={`btn ${format === 'json' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFormat('json')}
                                style={{ flex: 1 }}
                            >
                                📄 JSON
                            </button>
                            <button
                                className={`btn ${format === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFormat('csv')}
                                style={{ flex: 1 }}
                            >
                                📊 CSV
                            </button>
                        </div>
                    </div>

                    <div className="mt-lg">
                        <button
                            className="btn btn-success"
                            onClick={handleExport}
                            disabled={exporting}
                            style={{ width: '100%', fontSize: '1rem', padding: '1rem' }}
                        >
                            {exporting ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                    Exporting...
                                </>
                            ) : (
                                `⬇️ Download ${format.toUpperCase()} Export`
                            )}
                        </button>
                    </div>
                </div>

                {success && (
                    <div className="card fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--accent-success)' }}>
                        <h3 style={{ color: 'var(--accent-success)' }}>✓ Export Successful</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Your file has been downloaded successfully!
                        </p>
                    </div>
                )}

                {error && (
                    <div className="card fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                        <h3 style={{ color: 'var(--accent-danger)' }}>✗ Export Failed</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
                    </div>
                )}

                <div className="card">
                    <h3 className="card-title">Export Details</h3>
                    <div className="mt-md" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        <p><strong>Included Data:</strong></p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Conversation IDs and dates</li>
                            <li>Sentiment scores and labels</li>
                            <li>Positive, negative, and neutral message counts</li>
                            <li>Average message length and response times</li>
                            <li>Agent performance scores</li>
                            <li>Customer satisfaction scores</li>
                            <li>Keywords</li>
                        </ul>

                        <p style={{ marginTop: '1rem' }}><strong>Format Comparison:</strong></p>
                        <div className="grid grid-2 gap-md mt-md">
                            <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📄 JSON</h4>
                                <p style={{ fontSize: '0.875rem' }}>
                                    Structured data format, ideal for programmatic access and further processing
                                </p>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📊 CSV</h4>
                                <p style={{ fontSize: '0.875rem' }}>
                                    Spreadsheet-compatible format, perfect for Excel, Google Sheets, and data analysis tools
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
