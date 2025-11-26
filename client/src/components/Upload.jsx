import { useState } from 'react';
import api from '../utils/api';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.uploadFile(file);
            setResult(response);
            setFile(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 className="mb-md">Upload Conversations</h1>
                <p className="mb-lg" style={{ color: 'var(--text-secondary)' }}>
                    Upload conversation transcripts in text or JSON format for analysis
                </p>

                <div className="card mb-lg">
                    <div className="card-header">
                        <h3 className="card-title">File Upload</h3>
                        <p className="card-description">
                            Supported formats: .txt, .json (up to 50MB)
                        </p>
                    </div>

                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>
                            {file ? file.name : 'Drop your file here'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            or click to browse
                        </p>
                        <input
                            id="file-input"
                            type="file"
                            accept=".txt,.json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {file && (
                        <div className="mt-md" style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p style={{ fontWeight: 600 }}>{file.name}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    className="btn btn-danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-lg">
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{ width: '100%' }}
                        >
                            {uploading ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                    Uploading...
                                </>
                            ) : (
                                'Upload & Process'
                            )}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="card fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--accent-success)' }}>
                        <h3 style={{ color: 'var(--accent-success)', marginBottom: '1rem' }}>✓ Upload Successful</h3>
                        <div className="grid grid-3 gap-md">
                            <div>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                                    {result.inserted}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Conversations Uploaded</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{result.total}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Processed</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: result.errors ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                                    {result.errors?.length || 0}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Errors</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="card fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                        <h3 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>✗ Upload Failed</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                    </div>
                )}

                <div className="card mt-lg">
                    <h3 className="card-title">Expected Format</h3>
                    <p className="card-description mb-md">
                        Your file should contain conversations with the following structure:
                    </p>

                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>// JSON Format:</p>
                        <pre style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{`[
  {
    "conversation_id": "conv_001",
    "conversation_date": "2025-11-26",
    "transcript_details": "Agent: Hello...\\nCustomer: Hi..."
  }
]`}</pre>

                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '0.5rem' }}>// Text Format:</p>
                        <pre style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{`conversation_id: conv_001
date: 2025-11-26
Agent: Hello, how can I help you?
Customer: I have a question...`}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
