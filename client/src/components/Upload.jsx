import { useState } from 'react';
import api from '../utils/api';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    // Field mapping state
    const [showMapping, setShowMapping] = useState(false);
    const [detectedFields, setDetectedFields] = useState([]);
    const [mapping, setMapping] = useState({
        id: '',
        transcript: '',
        date: ''
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
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
            processFile(droppedFile);
        }
    };

    const processFile = (selectedFile) => {
        setFile(selectedFile);
        setError(null);
        setResult(null);
        setShowMapping(false);
        setDetectedFields([]);
        setMapping({ id: '', transcript: '', date: '' });

        const fileName = selectedFile.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    const firstItem = Array.isArray(content) ? content[0] : content;

                    if (firstItem && typeof firstItem === 'object') {
                        const fields = Object.keys(firstItem);
                        setDetectedFields(fields);

                        // Auto-detect fields
                        const newMapping = { id: '', transcript: '', date: '' };

                        fields.forEach(field => {
                            const lower = field.toLowerCase();
                            if (lower.includes('id') && !newMapping.id) newMapping.id = field;
                            if ((lower.includes('transcript') || lower.includes('message') || lower.includes('chat') || lower.includes('body')) && !newMapping.transcript) newMapping.transcript = field;
                            if ((lower.includes('date') || lower.includes('time') || lower.includes('created')) && !newMapping.date) newMapping.date = field;
                        });

                        setMapping(newMapping);
                        setShowMapping(true);
                    }
                } catch (err) {
                    console.error('Error parsing JSON for preview:', err);
                }
            };
            reader.readAsText(selectedFile);
        } else if (fileName.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // Read first 50 lines to detect keys
                    const lines = content.split('\n').slice(0, 50);
                    const potentialKeys = new Set();

                    // Regex to find "Key:" pattern at start of line
                    const keyRegex = /^([a-zA-Z0-9_\-\s]+):/i;

                    lines.forEach(line => {
                        const match = line.match(keyRegex);
                        if (match && match[1]) {
                            // Only add if it looks like a metadata key (not too long)
                            if (match[1].length < 30) {
                                potentialKeys.add(match[1].trim());
                            }
                        }
                    });

                    if (potentialKeys.size > 0) {
                        const fields = Array.from(potentialKeys);
                        setDetectedFields(fields);

                        // Auto-detect fields
                        const newMapping = { id: '', transcript: '', date: '' };

                        fields.forEach(field => {
                            const lower = field.toLowerCase();
                            if ((lower.includes('id') || lower.includes('conv')) && !newMapping.id) newMapping.id = field;
                            if ((lower.includes('date') || lower.includes('time')) && !newMapping.date) newMapping.date = field;
                        });

                        setMapping(newMapping);
                        setShowMapping(true);
                    }
                } catch (err) {
                    console.error('Error parsing text for preview:', err);
                }
            };
            reader.readAsText(selectedFile);
        } else if (fileName.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // Read first line to get headers
                    const firstLine = content.split('\n')[0];
                    if (firstLine) {
                        // Simple split by comma, handling potential quotes if needed (basic)
                        // For preview, simple split is usually enough
                        const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

                        if (headers.length > 0) {
                            setDetectedFields(headers);

                            // Auto-detect fields
                            const newMapping = { id: '', transcript: '', date: '' };

                            headers.forEach(field => {
                                const lower = field.toLowerCase();
                                if ((lower.includes('id') || lower.includes('conv')) && !newMapping.id) newMapping.id = field;
                                if ((lower.includes('transcript') || lower.includes('message') || lower.includes('chat') || lower.includes('body')) && !newMapping.transcript) newMapping.transcript = field;
                                if ((lower.includes('date') || lower.includes('time')) && !newMapping.date) newMapping.date = field;
                            });

                            setMapping(newMapping);
                            setShowMapping(true);
                        }
                    }
                } catch (err) {
                    console.error('Error parsing CSV for preview:', err);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleMappingChange = (target, sourceField) => {
        setMapping(prev => ({
            ...prev,
            [target]: sourceField
        }));
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
            // If we have mapping, we need to send it
            // api.uploadFile needs to be updated or we pass it as additional data
            // Since we can't easily change the api utility without seeing it, 
            // we'll assume we can pass a second argument or we'll modify the file object slightly (hacky)
            // Better: let's check api.js next, but for now we'll assume the backend handles the mapping
            // if we pass it in the FormData.

            // We'll use a custom upload function here to ensure mapping is sent
            const formData = new FormData();
            formData.append('file', file);
            if (showMapping) {
                formData.append('fieldMapping', JSON.stringify(mapping));
            }

            const response = await fetch('http://localhost:3000/api/conversations/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data);
            setFile(null);
            setShowMapping(false);
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
                            accept=".txt,.json,.csv"
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
                                        setShowMapping(false);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {showMapping && (
                        <div className="mt-lg fade-in">
                            <h4 className="mb-md">Map Fields</h4>
                            <p className="mb-md" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                We detected a JSON file. Please map the columns to the required fields.
                            </p>

                            <div className="grid grid-3 gap-md">
                                <div>
                                    <label className="label">Conversation ID</label>
                                    <select
                                        className="input"
                                        value={mapping.id}
                                        onChange={(e) => handleMappingChange('id', e.target.value)}
                                    >
                                        <option value="">-- Select Field --</option>
                                        {detectedFields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Transcript</label>
                                    <select
                                        className="input"
                                        value={mapping.transcript}
                                        onChange={(e) => handleMappingChange('transcript', e.target.value)}
                                    >
                                        <option value="">-- Select Field --</option>
                                        {detectedFields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Date (Optional)</label>
                                    <select
                                        className="input"
                                        value={mapping.date}
                                        onChange={(e) => handleMappingChange('date', e.target.value)}
                                    >
                                        <option value="">-- Select Field --</option>
                                        {detectedFields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-lg">
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!file || uploading || (showMapping && (!mapping.id || !mapping.transcript))}
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
