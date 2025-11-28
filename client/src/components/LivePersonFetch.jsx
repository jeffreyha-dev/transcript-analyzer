import { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../utils/api';

export default function LivePersonFetch() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [fetchParams, setFetchParams] = useState({
        accountId: '',
        datePreset: '7d', // Default to last 7 days
        startDate: '',
        endDate: '',
        status: 'CLOSE' // OPEN, CLOSE, or both
    });
    const [fetchStatus, setFetchStatus] = useState(null);
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

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getLPAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRangeFromPreset = (preset) => {
        const now = new Date();
        let startDate, endDate;

        switch (preset) {
            case '1h':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                endDate = now;
                break;
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'custom':
                if (!fetchParams.startDate || !fetchParams.endDate) {
                    throw new Error('Please select both start and end dates');
                }
                startDate = new Date(fetchParams.startDate);
                endDate = new Date(fetchParams.endDate);

                if (startDate > endDate) {
                    throw new Error('Start date cannot be after end date');
                }
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
        }

        // Return ISO strings to preserve time information
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };

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

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await api.deleteLPAccount(id);
            loadAccounts();
        } catch (error) {
            alert('Error deleting account: ' + error.message);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await api.toggleLPAccount(id, !currentStatus);
            loadAccounts();
        } catch (error) {
            alert('Error toggling account: ' + error.message);
        }
    };

    const handleTest = async (id) => {
        try {
            const result = await api.testLPConnection(id);
            if (result.success) {
                alert(`✓ Connection successful!\nDomain: ${result.domain}`);
            } else {
                alert(`✗ Connection failed:\n${result.message}`);
            }
        } catch (error) {
            alert('Error testing connection: ' + error.message);
        }
    };

    const handleFetch = async () => {
        if (!fetchParams.accountId) {
            alert('Please select an account');
            return;
        }

        try {
            setFetchStatus({ loading: true, message: 'Starting fetch...' });

            // Get actual date range from preset or custom dates
            const dateRange = getDateRangeFromPreset(fetchParams.datePreset);

            let totalImported = 0;
            let batchesFetched = 0;
            let hasMore = true;
            let offset = 0;
            const BATCH_SIZE = 50; // LivePerson API max limit
            let totalExpected = 0; // Track total expected records from first batch

            // Fetch all conversations in batches
            while (hasMore) {
                // Safety break to prevent infinite loops
                if (batchesFetched > 100) {
                    console.warn('Safety break: Reached 100 batches, stopping.');
                    break;
                }

                setFetchStatus({
                    loading: true,
                    message: `Fetching batch ${batchesFetched + 1}... (${totalImported} imported so far)`
                });

                const result = await api.fetchLPConversations({
                    accountId: fetchParams.accountId,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    limit: BATCH_SIZE,
                    offset: offset,
                    status: fetchParams.status
                });

                console.log(`Batch ${batchesFetched + 1}: imported ${result.imported}, API returned ${result.apiReturned || result.imported}`);

                // Capture total expected from the first batch (or any batch that reports it)
                if (result.totalFetched > 0 && totalExpected === 0) {
                    totalExpected = result.totalFetched;
                    console.log(`Total records expected: ${totalExpected}`);
                }

                totalImported += result.imported;
                batchesFetched++;

                // Stop if we have fetched all expected records based on metadata
                if (totalExpected > 0 && totalImported >= totalExpected) {
                    hasMore = false;
                    console.log(`Stopping pagination: Reached total expected records (${totalExpected})`);
                }
                // Fallback: Stop if no conversations were returned or if we got fewer than the batch size
                else {
                    const actualReturned = result.apiReturned || result.imported;
                    if (actualReturned === 0 || actualReturned < BATCH_SIZE) {
                        hasMore = false;
                        console.log(`Stopping pagination: returned ${actualReturned} conversations (last batch)`);
                    } else {
                        offset += actualReturned;
                        console.log(`Continuing to next batch with offset ${offset}`);
                    }
                }
            }

            setFetchStatus({
                loading: false,
                success: true,
                message: `Successfully fetched ${totalImported} conversations`,
                imported: totalImported
            });
        } catch (error) {
            setFetchStatus({
                loading: false,
                success: false,
                message: error.message
            });
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

    const handleExport = async () => {
        if (!fetchParams.accountId) {
            alert('Please select an account');
            return;
        }

        try {
            // Get actual date range
            const dateRange = getDateRangeFromPreset(fetchParams.datePreset);

            // Build query params
            const params = new URLSearchParams({
                accountId: fetchParams.accountId,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            if (fetchParams.status) {
                params.append('status', fetchParams.status);
            }

            // Trigger download
            // Trigger download
            window.location.href = `${API_BASE_URL}/liveperson/export?${params.toString()}`;

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export CSV: ' + error.message);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="mb-xl">
                <h1 className="text-2xl font-bold">LivePerson Integration</h1>
                <p className="text-secondary mt-sm">
                    Connect to LivePerson accounts and fetch conversation data
                </p>
            </div>

            {/* Account Management */}
            <div className="card mb-lg">
                <div className="p-md border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">LivePerson Accounts</h2>
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setEditingAccount(null);
                            resetForm();
                        }}
                        className="btn btn-primary"
                    >
                        {showAddForm ? 'Cancel' : '+ Add Account'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="p-md border-b border-border bg-tertiary">
                        <h3 className="font-semibold mb-md">
                            {editingAccount ? 'Edit Account' : 'New Account'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
                            <div>
                                <label className="block text-sm font-medium mb-xs">Account Name *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Account ID *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Consumer Key *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.consumer_key}
                                    onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Consumer Secret *</label>
                                <input
                                    type="password"
                                    className="input w-full"
                                    value={formData.consumer_secret}
                                    onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Token *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Token Secret *</label>
                                <input
                                    type="password"
                                    className="input w-full"
                                    value={formData.token_secret}
                                    onChange={(e) => setFormData({ ...formData, token_secret: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">Service Name</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.service_name}
                                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                                    placeholder="msgHist"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-xs">API Version</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.api_version}
                                    onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                                    placeholder="1.0"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-xs">API Endpoint Path</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.api_endpoint_path}
                                    onChange={(e) => setFormData({ ...formData, api_endpoint_path: e.target.value })}
                                    placeholder="/messaging_history/api/account/{accountId}/conversations/search"
                                />
                            </div>
                            <div className="col-span-2 flex gap-sm justify-end">
                                <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingAccount ? 'Update' : 'Create'} Account
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="p-md">
                    {loading ? (
                        <div className="flex justify-center p-xl">
                            <div className="spinner"></div>
                        </div>
                    ) : accounts.length === 0 ? (
                        <p className="text-center text-secondary p-xl">No LivePerson accounts configured</p>
                    ) : (
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Account Name</th>
                                    <th>Account ID</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr key={account.id}>
                                        <td className="font-semibold">{account.account_name}</td>
                                        <td className="font-mono text-sm">{account.account_id}</td>
                                        <td>
                                            <span className={`badge ${account.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-sm text-secondary">
                                            {new Date(account.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="flex gap-xs">
                                                <button
                                                    onClick={() => handleTest(account.id)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Test Connection"
                                                >
                                                    🔌 Test
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(account.id, account.is_active)}
                                                    className="btn btn-sm btn-secondary"
                                                    title={account.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {account.is_active ? '⏸️' : '▶️'}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(account)}
                                                    className="btn btn-sm btn-secondary"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account.id)}
                                                    className="btn btn-sm btn-danger"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Fetch Conversations */}
            <div className="card">
                <div className="p-md border-b border-border">
                    <h2 className="text-lg font-semibold">Fetch Conversations</h2>
                    <p className="text-sm text-secondary mt-xs">Import conversations from LivePerson</p>
                </div>
                <div className="p-md">
                    <div className="grid grid-2 gap-md mb-md">
                        <div>
                            <label className="block text-sm font-medium mb-xs">Account</label>
                            <select
                                className="input w-full"
                                value={fetchParams.accountId}
                                onChange={(e) => setFetchParams({ ...fetchParams, accountId: e.target.value })}
                            >
                                <option value="">Select an account...</option>
                                {accounts.filter(a => a.is_active).map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.account_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-xs">Conversation Status</label>
                            <select
                                className="input w-full"
                                value={fetchParams.status}
                                onChange={(e) => setFetchParams({ ...fetchParams, status: e.target.value })}
                            >
                                <option value="CLOSE">Closed Conversations</option>
                                <option value="OPEN">Open Conversations</option>
                                <option value="">All Conversations (Open + Closed)</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-xs">Date Range</label>
                            <select
                                className="input w-full"
                                value={fetchParams.datePreset}
                                onChange={(e) => setFetchParams({ ...fetchParams, datePreset: e.target.value })}
                            >
                                <option value="1h">Last Hour</option>
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {fetchParams.datePreset === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-xs">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="input w-full"
                                        value={fetchParams.startDate}
                                        onChange={(e) => setFetchParams({ ...fetchParams, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-xs">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="input w-full"
                                        value={fetchParams.endDate}
                                        onChange={(e) => setFetchParams({ ...fetchParams, endDate: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-md">
                        <button
                            onClick={handleFetch}
                            disabled={!fetchParams.accountId || fetchStatus?.loading}
                            className="btn btn-primary flex-1"
                        >
                            {fetchStatus?.loading ? (
                                <span>⏳ {fetchStatus.message || 'Fetching...'}</span>
                            ) : (
                                '📥 Fetch Conversations'
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={!fetchParams.accountId || fetchStatus?.loading}
                            className="btn btn-secondary"
                            title="Export fetched conversations to CSV"
                        >
                            📤 Export CSV
                        </button>
                    </div>

                    {fetchStatus && !fetchStatus.loading && (
                        <div className={`mt-md p-md rounded-lg ${fetchStatus.success ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
                            <p className={fetchStatus.success ? 'text-green-500' : 'text-red-500'}>
                                {fetchStatus.success ? '✓' : '✗'} {fetchStatus.message}
                            </p>
                            {fetchStatus.success && fetchStatus.imported > 0 && (
                                <p className="text-sm text-secondary mt-xs">
                                    Go to the Analysis tab to analyze them.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
