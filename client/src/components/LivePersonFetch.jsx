import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Settings, Calendar, Filter, RefreshCw, ChevronDown, X as XIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import api, { API_BASE_URL } from '../utils/api';

export default function LivePersonFetch() {
    // Account State
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState('');

    // Account Management State
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        account_name: '',
        consumer_key: '',
        consumer_secret: '',
        token: '',
        token_secret: '',
        account_id: '',
        service_name: 'msgHist',
        api_version: '1.0',
        api_endpoint_path: '/messaging_history/api/account/{accountId}/conversations/search'
    });

    // Fetch Params State
    const [datePreset, setDatePreset] = useState('7d');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
    const [status, setStatus] = useState(['CLOSE']);

    // Skills State
    const [skills, setSkills] = useState([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [skillsError, setSkillsError] = useState(null);
    const [selectedSkillIds, setSelectedSkillIds] = useState([]);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Fetch Execution State
    const [fetchStatus, setFetchStatus] = useState(null);
    const [batchSize, setBatchSize] = useState(50); // Using 50 to match HEAD's BATCH_SIZE

    useEffect(() => {
        loadAccounts();

        // Load persisted fetch status
        const savedStatus = sessionStorage.getItem('lpFetchStatus');
        if (savedStatus) {
            try {
                setFetchStatus(JSON.parse(savedStatus));
            } catch (e) {
                console.error('Failed to parse saved fetch status:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            loadSkills();
        } else {
            setSkills([]);
            setSelectedSkillIds([]);
        }
    }, [selectedAccount]);

    useEffect(() => {
        if (fetchStatus) {
            sessionStorage.setItem('lpFetchStatus', JSON.stringify(fetchStatus));
        }
    }, [fetchStatus]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSkillDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getLPAccounts();
            setAccounts(data);
            if (data.length > 0 && !selectedAccount) {
                // Optionally select first account, or leave empty
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSkills = async () => {
        try {
            setLoadingSkills(true);
            setSkillsError(null);
            const data = await api.getSkills(selectedAccount);
            setSkills(data);
        } catch (error) {
            console.error('Error loading skills:', error);
            setSkillsError(error.message);
            setSkills([]);
        } finally {
            setLoadingSkills(false);
        }
    };

    const getDateRange = () => {
        if (datePreset === 'custom') {
            if (!customDateRange.from || !customDateRange.to) {
                throw new Error('Please select both start and end dates');
            }
            return {
                startDate: new Date(customDateRange.from).toISOString(),
                endDate: new Date(customDateRange.to).toISOString()
            };
        }

        const now = new Date();
        let startDate, endDate = now;

        switch (datePreset) {
            case '1h': startDate = new Date(now.getTime() - 60 * 60 * 1000); break;
            case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };

    const handleFetch = async () => {
        if (!selectedAccount) {
            alert('Please select an account');
            return;
        }

        try {
            setFetchStatus({ loading: true, message: 'Starting fetch...' });

            const dateRange = getDateRange();

            let totalImported = 0;
            let batchesFetched = 0;
            let hasMore = true;
            let offset = 0;
            let totalExpected = 0;

            while (hasMore) {
                if (batchesFetched > 100) {
                    console.warn('Safety break: Reached 100 batches, stopping.');
                    break;
                }

                setFetchStatus({
                    loading: true,
                    message: `Fetching batch ${batchesFetched + 1}... (${totalImported} imported so far)`
                });

                const result = await api.fetchLPConversations({
                    accountId: selectedAccount,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    limit: batchSize,
                    offset: offset,
                    status: status,
                    skills: selectedSkillIds.length > 0 ? selectedSkillIds : undefined
                });

                console.log(`Batch ${batchesFetched + 1}: imported ${result.imported}, API returned ${result.apiReturned || result.imported}`);

                if (result.totalFetched > 0 && totalExpected === 0) {
                    totalExpected = result.totalFetched;
                }

                totalImported += result.imported;
                batchesFetched++;

                const actualReturned = result.apiReturned || result.imported;

                if (totalExpected > 0 && totalImported >= totalExpected) {
                    hasMore = false;
                } else if (actualReturned === 0 || actualReturned < batchSize) {
                    hasMore = false;
                } else {
                    offset += actualReturned;
                }
            }

            setFetchStatus({
                loading: false,
                success: true,
                message: `Successfully fetched ${totalImported} conversations`,
                imported: totalImported
            });

        } catch (error) {
            console.error('Fetch error:', error);
            setFetchStatus({
                loading: false,
                success: false,
                message: error.message
            });
        }
    };

    const handleExport = async () => {
        if (!selectedAccount) {
            alert('Please select an account');
            return;
        }

        try {
            const dateRange = getDateRange();
            const params = new URLSearchParams({
                accountId: selectedAccount,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            if (status.length > 0) {
                // API mostly expects one status for CSV or we filter manually. 
                // Currently API export implementation filters by SINGLE status if provided?
                // Or relies on query. Let's send the first one or logic needs update if multi-status export needed.
                // For now, assume mainly seeking CLOSED.
                // Or don't send status to export ALL and let backend filter? 
                // Backend 'status' param is singular in previous impl.
            }

            window.location.href = `${API_BASE_URL}/liveperson/export?${params.toString()}`;
        } catch (error) {
            alert('Failed to export: ' + error.message);
        }
    };

    // Account Management Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await api.updateLPAccount(editingAccount.id, formData);
            } else {
                await api.createLPAccount(formData);
            }
            setShowAddForm(false);
            setEditingAccount(null);
            resetForm();
            loadAccounts();
        } catch (error) {
            alert('Error saving account: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            account_name: '',
            consumer_key: '',
            consumer_secret: '',
            token: '',
            token_secret: '',
            account_id: '',
            service_name: 'msgHist',
            api_version: '1.0',
            api_endpoint_path: '/messaging_history/api/account/{accountId}/conversations/search'
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await api.deleteLPAccount(id);
            if (selectedAccount === id) setSelectedAccount('');
            loadAccounts();
        } catch (error) {
            alert('Error deleting account: ' + error.message);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            account_name: account.account_name,
            consumer_key: account.consumer_key,
            consumer_secret: account.consumer_secret,
            token: account.token,
            token_secret: account.token_secret,
            account_id: account.account_id,
            service_name: account.service_name || 'msgHist',
            api_version: account.api_version || '1.0',
            api_endpoint_path: account.api_endpoint_path || '/messaging_history/api/account/{accountId}/conversations/search'
        });
        setShowAddForm(true);
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="mb-xl flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">LivePerson Integration</h1>
                    <p className="text-secondary mt-sm">
                        Connect to LivePerson accounts and fetch conversation data
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setEditingAccount(null);
                        resetForm();
                    }}
                    className="btn btn-outline btn-sm gap-2"
                >
                    <Plus size={16} />
                    {showAddForm ? 'Cancel' : 'Manage Accounts'}
                </button>
            </div>

            {/* Account Form Modal/Panel */}
            {showAddForm && (
                <div className="card mb-lg p-md border-2 border-primary/20 bg-base-200/50">
                    <h3 className="font-semibold mb-md">
                        {editingAccount ? 'Edit Account' : 'New LivePerson Account'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Account Name *</span></label>
                            <input type="text" className="input input-bordered" required
                                value={formData.account_name}
                                onChange={e => setFormData({ ...formData, account_name: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Account ID *</span></label>
                            <input type="text" className="input input-bordered" required
                                value={formData.account_id}
                                onChange={e => setFormData({ ...formData, account_id: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Consumer Key *</span></label>
                            <input type="text" className="input input-bordered" required
                                value={formData.consumer_key}
                                onChange={e => setFormData({ ...formData, consumer_key: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Consumer Secret *</span></label>
                            <input type="password" className="input input-bordered" required
                                value={formData.consumer_secret}
                                onChange={e => setFormData({ ...formData, consumer_secret: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Token *</span></label>
                            <input type="text" className="input input-bordered" required
                                value={formData.token}
                                onChange={e => setFormData({ ...formData, token: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Token Secret *</span></label>
                            <input type="password" className="input input-bordered" required
                                value={formData.token_secret}
                                onChange={e => setFormData({ ...formData, token_secret: e.target.value })} />
                        </div>

                        <div className="col-span-2 flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-ghost">Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Account</button>
                        </div>
                    </form>

                    {/* Account List for Edit/Delete */}
                    <div className="mt-8 border-t border-base-300 pt-4">
                        <h4 className="text-sm font-semibold mb-2">Existing Accounts</h4>
                        <div className="space-y-2">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center bg-base-100 p-2 rounded">
                                    <span>{acc.account_name} ({acc.account_id})</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(acc)} className="btn btn-xs btn-ghost"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(acc.id)} className="btn btn-xs btn-ghost text-error"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Fetch UI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Account Selector */}
                    <div className="card bg-base-100 shadow-sm p-4">
                        <label className="label font-semibold">LivePerson Account</label>
                        <select
                            className="select select-bordered w-full"
                            value={selectedAccount}
                            onChange={e => setSelectedAccount(e.target.value)}
                        >
                            <option value="">Select Account...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="card bg-base-100 shadow-sm p-4">
                        <label className="label font-semibold">Date Range</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {['1h', '24h', '7d', '30d'].map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setDatePreset(preset)}
                                    className={`btn btn-sm ${datePreset === preset ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setDatePreset('custom')}
                            className={`btn btn-sm w-full ${datePreset === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            Custom Range
                        </button>

                        {datePreset === 'custom' && (
                            <div className="mt-4 space-y-2">
                                <input type="datetime-local" className="input input-sm input-bordered w-full"
                                    value={customDateRange.from} onChange={e => setCustomDateRange({ ...customDateRange, from: e.target.value })} />
                                <input type="datetime-local" className="input input-sm input-bordered w-full"
                                    value={customDateRange.to} onChange={e => setCustomDateRange({ ...customDateRange, to: e.target.value })} />
                            </div>
                        )}
                    </div>

                    {/* Filters: Status & Skills */}
                    <div className="card bg-base-100 shadow-sm p-4">
                        <label className="label font-semibold">Filters</label>

                        {/* Status */}
                        <div className="flex gap-4 mb-4">
                            {['OPEN', 'CLOSE'].map(s => (
                                <label key={s} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="checkbox checkbox-sm"
                                        checked={status.includes(s)}
                                        onChange={e => {
                                            if (e.target.checked) setStatus([...status, s]);
                                            else setStatus(status.filter(i => i !== s));
                                        }} />
                                    <span className="text-sm">{s}</span>
                                </label>
                            ))}
                        </div>

                        {/* Skills */}
                        <div className="form-control" ref={dropdownRef}>
                            <label className="label">
                                <span className="label-text text-sm">Skills (Optional)</span>
                                {loadingSkills && <span className="loading loading-spinner loading-xs"></span>}
                            </label>

                            {skillsError ? (
                                <div className="alert alert-warning alert-xs">
                                    <span>Failed to load skills.</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                                        className="btn btn-bordered btn-sm w-full justify-between normal-case font-normal"
                                        disabled={loadingSkills || skills.length === 0}
                                    >
                                        <span className="truncate">
                                            {selectedSkillIds.length === 0 ? (
                                                <span className="text-secondary">All Skills</span>
                                            ) : (
                                                <span>{selectedSkillIds.length} select</span>
                                            )}
                                        </span>
                                        <ChevronDown size={14} />
                                    </button>

                                    {showSkillDropdown && skills.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded shadow-lg max-h-60 overflow-y-auto">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="input input-xs input-bordered w-full m-2 max-w-[90%]"
                                                value={skillSearchQuery}
                                                onChange={(e) => setSkillSearchQuery(e.target.value)}
                                            />
                                            {skills
                                                .filter(skill => skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                                .map(skill => (
                                                    <label key={skill.id} className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer">
                                                        <input type="checkbox" className="checkbox checkbox-xs"
                                                            checked={selectedSkillIds.includes(skill.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) setSelectedSkillIds([...selectedSkillIds, skill.id]);
                                                                else setSelectedSkillIds(selectedSkillIds.filter(id => id !== skill.id));
                                                            }} />
                                                        <span className="text-xs truncate">{skill.name}</span>
                                                    </label>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Actions & Output */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleFetch}
                            disabled={fetchStatus?.loading || !selectedAccount}
                            className={`btn btn-primary flex-1 ${fetchStatus?.loading ? 'loading' : ''}`}
                        >
                            {fetchStatus?.loading ? 'Fetching...' : 'Fetch Conversations'}
                        </button>
                        <button onClick={handleExport} className="btn btn-outline gap-2">
                            <Download size={18} /> Export CSV
                        </button>
                    </div>

                    {fetchStatus && (
                        <div className={`alert ${fetchStatus.success ? 'alert-success' : fetchStatus.loading ? 'alert-info' : 'alert-error'}`}>
                            <div>
                                {fetchStatus.loading && <RefreshCw className="animate-spin" />}
                                <span>{fetchStatus.message}</span>
                            </div>
                        </div>
                    )}

                    {/* Instructions/Placeholder */}
                    {!fetchStatus && (
                        <div className="text-center p-xl border-2 border-dashed border-base-300 rounded-lg text-secondary">
                            <Settings className="mx-auto mb-2 opacity-50" size={48} />
                            <p>Select an account and configure filters to start fetching conversation data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
