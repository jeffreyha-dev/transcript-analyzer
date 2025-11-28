import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Settings, Calendar, Filter, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import LivePersonConfig from './LivePersonConfig';

export default function LivePersonFetch() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fetchResult, setFetchResult] = useState(null);

    // Fetch parameters
    const [datePreset, setDatePreset] = useState('24h');
    const [customDateRange, setCustomDateRange] = useState({
        from: '',
        to: '',
    });
    const [status, setStatus] = useState(['CLOSE']);
    const [skillIds, setSkillIds] = useState('');
    const [batchSize, setBatchSize] = useState(20);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await api.getActiveLPAccounts();
            setAccounts(data);
            if (data.length > 0 && !selectedAccount) {
                setSelectedAccount(data[0].id);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    const getDateRange = () => {
        if (datePreset === 'custom') {
            if (!customDateRange.from || !customDateRange.to) {
                throw new Error('Please select both start and end dates');
            }
            return {
                from: new Date(customDateRange.from).getTime(),
                to: new Date(customDateRange.to).getTime(),
            };
        }

        const now = Date.now();
        const presets = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
        };

        const offset = presets[datePreset] || presets['24h'];
        return {
            from: now - offset,
            to: now,
        };
    };

    const handleFetch = async () => {
        if (!selectedAccount) {
            alert('Please select an account');
            return;
        }

        try {
            setFetching(true);
            setFetchResult(null);

            const dateRange = getDateRange();
            const skillIdArray = skillIds
                .split(',')
                .map(id => id.trim())
                .filter(id => id && !isNaN(id))
                .map(id => Number(id));

            const result = await api.fetchLPConversations({
                accountId: selectedAccount,
                dateRange,
                status,
                skillIds: skillIdArray,
                batchSize,
            });

            setFetchResult(result);
        } catch (error) {
            alert('Error fetching conversations: ' + error.message);
        } finally {
            setFetching(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Fetch from LivePerson</h1>
                    <p className="text-secondary mt-1">
                        Import conversations directly from your LivePerson account
                    </p>
                </div>
                <button
                    onClick={() => setShowConfig(true)}
                    className="btn btn-secondary"
                >
                    <Settings size={20} />
                    Manage Accounts
                </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Account Selection */}
                    <div className="card bg-base-200 p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Filter size={20} />
                            Account & Filters
                        </h2>

                        <div className="space-y-4">
                            {/* Account Selector */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">LivePerson Account</span>
                                </label>
                                {accounts.length === 0 ? (
                                    <div className="alert alert-warning">
                                        <span>No active accounts configured.</span>
                                        <button
                                            onClick={() => setShowConfig(true)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Add Account
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                    >
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_name} (ID: {account.account_id})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Date Range */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Date Range</span>
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDatePreset('1h')}
                                        className={`btn btn-sm ${datePreset === '1h' ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        Last Hour
                                    </button>
                                    <button
                                        onClick={() => setDatePreset('24h')}
                                        className={`btn btn-sm ${datePreset === '24h' ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        Last 24h
                                    </button>
                                    <button
                                        onClick={() => setDatePreset('7d')}
                                        className={`btn btn-sm ${datePreset === '7d' ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        onClick={() => setDatePreset('30d')}
                                        className={`btn btn-sm ${datePreset === '30d' ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        Last 30 Days
                                    </button>
                                    <button
                                        onClick={() => setDatePreset('custom')}
                                        className={`btn btn-sm ${datePreset === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                                    >
                                        <Calendar size={16} />
                                        Custom
                                    </button>
                                </div>
                            </div>

                            {/* Custom Date Range */}
                            {datePreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Start Date & Time</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="input input-bordered"
                                            value={customDateRange.from}
                                            onChange={(e) =>
                                                setCustomDateRange({ ...customDateRange, from: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">End Date & Time</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="input input-bordered"
                                            value={customDateRange.to}
                                            onChange={(e) =>
                                                setCustomDateRange({ ...customDateRange, to: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Status Filter */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Conversation Status</span>
                                </label>
                                <div className="flex gap-2">
                                    <label className="label cursor-pointer gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={status.includes('CLOSE')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setStatus([...status, 'CLOSE']);
                                                } else {
                                                    setStatus(status.filter(s => s !== 'CLOSE'));
                                                }
                                            }}
                                        />
                                        <span className="label-text">Closed</span>
                                    </label>
                                    <label className="label cursor-pointer gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={status.includes('OPEN')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setStatus([...status, 'OPEN']);
                                                } else {
                                                    setStatus(status.filter(s => s !== 'OPEN'));
                                                }
                                            }}
                                        />
                                        <span className="label-text">Open</span>
                                    </label>
                                </div>
                            </div>

                            {/* Skill IDs */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Skill IDs (Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="e.g., 3127625870, 3127625871"
                                    value={skillIds}
                                    onChange={(e) => setSkillIds(e.target.value)}
                                />
                                <label className="label">
                                    <span className="label-text-alt">Comma-separated. Leave empty for all skills.</span>
                                </label>
                            </div>

                            {/* Batch Size */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Batch Size</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered"
                                    min="1"
                                    max="100"
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(Number(e.target.value))}
                                />
                                <label className="label">
                                    <span className="label-text-alt">Conversations per API call (1-100)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleFetch}
                        disabled={fetching || accounts.length === 0}
                        className="btn btn-primary btn-lg w-full"
                    >
                        {fetching ? (
                            <>
                                <div className="loading loading-spinner"></div>
                                Fetching Conversations...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Fetch Conversations
                            </>
                        )}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-200 p-6 sticky top-4">
                        <h2 className="text-xl font-semibold mb-4">Results</h2>

                        {!fetchResult ? (
                            <div className="text-center text-secondary py-8">
                                <p>No fetch results yet.</p>
                                <p className="text-sm mt-2">Configure filters and click "Fetch Conversations"</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {fetchResult.success ? (
                                    <>
                                        <div className="alert alert-success">
                                            <span>✅ Fetch completed successfully!</span>
                                        </div>

                                        <div className="stats stats-vertical shadow w-full">
                                            <div className="stat">
                                                <div className="stat-title">Total Fetched</div>
                                                <div className="stat-value text-primary">{fetchResult.total}</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-title">New Conversations</div>
                                                <div className="stat-value text-success">{fetchResult.new}</div>
                                            </div>
                                            <div className="stat">
                                                <div className="stat-title">Updated</div>
                                                <div className="stat-value text-info">{fetchResult.updated}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <a href="#/analysis" className="btn btn-secondary btn-sm">
                                                View in Analysis
                                            </a>
                                            <a
                                                href={`http://localhost:3000/api/liveperson/export-csv?accountId=${selectedAccount}`}
                                                download
                                                className="btn btn-accent btn-sm"
                                            >
                                                <Download size={16} />
                                                Export to CSV
                                            </a>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setFetchResult(null)}>
                                                <RefreshCw size={16} />
                                                Clear Results
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="alert alert-error">
                                        <span>❌ {fetchResult.error || 'Fetch failed'}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Config Modal */}
            {showConfig && (
                <LivePersonConfig
                    onClose={() => setShowConfig(false)}
                    onAccountCreated={loadAccounts}
                />
            )}
        </div>
    );
}
