import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, TestTube, Check, X, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

export default function LivePersonConfig({ onClose, onAccountCreated }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [testingId, setTestingId] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [showSecrets, setShowSecrets] = useState({});

    const [formData, setFormData] = useState({
        account_name: '',
        consumer_key: '',
        consumer_secret: '',
        token: '',
        token_secret: '',
        account_id: '',
        is_active: true,
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
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await api.updateLPAccount(editingId, formData);
            } else {
                await api.createLPAccount(formData);
            }

            await loadAccounts();
            resetForm();
            if (onAccountCreated) onAccountCreated();
        } catch (error) {
            alert('Error saving account: ' + error.message);
        }
    };

    const handleEdit = (account) => {
        setEditingId(account.id);
        setFormData({
            account_name: account.account_name,
            consumer_key: account.consumer_key,
            consumer_secret: account.consumer_secret,
            token: account.token,
            token_secret: account.token_secret,
            account_id: account.account_id,
            is_active: account.is_active,
            service_name: account.service_name,
            api_version: account.api_version,
            api_endpoint_path: account.api_endpoint_path,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        try {
            await api.deleteLPAccount(id);
            await loadAccounts();
        } catch (error) {
            alert('Error deleting account: ' + error.message);
        }
    };

    const handleTest = async (id) => {
        try {
            setTestingId(id);
            setTestResult(null);
            const result = await api.testLPConnection(id);
            setTestResult({ id, ...result });
        } catch (error) {
            setTestResult({ id, success: false, message: error.message });
        } finally {
            setTestingId(null);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await api.toggleLPAccount(id, !currentStatus);
            await loadAccounts();
        } catch (error) {
            alert('Error toggling account: ' + error.message);
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
            is_active: true,
            service_name: '',
            api_version: '',
            api_endpoint_path: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const toggleSecretVisibility = (field) => {
        setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-base-100 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-base-300 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">LivePerson Accounts</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Add Account Button */}
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn btn-primary mb-4"
                        >
                            <Plus size={20} />
                            Add Account
                        </button>
                    )}

                    {/* Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSubmit}
                                className="card bg-base-200 p-4 mb-4"
                            >
                                <h3 className="text-lg font-semibold mb-4">
                                    {editingId ? 'Edit Account' : 'New Account'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Account Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={formData.account_name}
                                            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">LivePerson Account ID *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={formData.account_id}
                                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Consumer Key *</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecrets.consumer_key ? 'text' : 'password'}
                                                className="input input-bordered w-full pr-10"
                                                value={formData.consumer_key}
                                                onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                                                required={!editingId}
                                                placeholder={editingId ? '****' : ''}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecretVisibility('consumer_key')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                                            >
                                                {showSecrets.consumer_key ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Consumer Secret *</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecrets.consumer_secret ? 'text' : 'password'}
                                                className="input input-bordered w-full pr-10"
                                                value={formData.consumer_secret}
                                                onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                                                required={!editingId}
                                                placeholder={editingId ? '****' : ''}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecretVisibility('consumer_secret')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                                            >
                                                {showSecrets.consumer_secret ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Access Token *</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecrets.token ? 'text' : 'password'}
                                                className="input input-bordered w-full pr-10"
                                                value={formData.token}
                                                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                                required={!editingId}
                                                placeholder={editingId ? '****' : ''}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecretVisibility('token')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                                            >
                                                {showSecrets.token ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Token Secret *</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecrets.token_secret ? 'text' : 'password'}
                                                className="input input-bordered w-full pr-10"
                                                value={formData.token_secret}
                                                onChange={(e) => setFormData({ ...formData, token_secret: e.target.value })}
                                                required={!editingId}
                                                placeholder={editingId ? '****' : ''}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleSecretVisibility('token_secret')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                                            >
                                                {showSecrets.token_secret ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Settings */}
                                <div className="collapse collapse-arrow bg-base-100 mt-4 border border-base-300">
                                    <input type="checkbox" />
                                    <div className="collapse-title text-md font-medium">
                                        Advanced Settings
                                    </div>
                                    <div className="collapse-content">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Service Name</span>
                                                    <span className="label-text-alt text-secondary">Default: msgHist</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm"
                                                    value={formData.service_name || ''}
                                                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                                                    placeholder="msgHist"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">API Version</span>
                                                    <span className="label-text-alt text-secondary">Default: 1.0</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm"
                                                    value={formData.api_version || ''}
                                                    onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                                                    placeholder="1.0"
                                                />
                                            </div>
                                            <div className="form-control md:col-span-2">
                                                <label className="label">
                                                    <span className="label-text">API Endpoint Path</span>
                                                    <span className="label-text-alt text-secondary">Use {'{accountId}'} placeholder</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm font-mono text-xs"
                                                    value={formData.api_endpoint_path || ''}
                                                    onChange={(e) => setFormData({ ...formData, api_endpoint_path: e.target.value })}
                                                    placeholder="/messaging_history/api/account/{accountId}/conversations/search"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label cursor-pointer justify-start gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span className="label-text">Active</span>
                                    </label>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button type="submit" className="btn btn-primary">
                                        {editingId ? 'Update' : 'Create'}
                                    </button>
                                    <button type="button" onClick={resetForm} className="btn btn-ghost">
                                        Cancel
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Accounts List */}
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="loading loading-spinner loading-lg"></div>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center p-8 text-secondary">
                            No accounts configured. Add your first LivePerson account to get started.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map((account) => (
                                <motion.div
                                    key={account.id}
                                    layout
                                    className="card bg-base-200 p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{account.account_name}</h3>
                                                {account.is_active ? (
                                                    <span className="badge badge-success badge-sm">Active</span>
                                                ) : (
                                                    <span className="badge badge-ghost badge-sm">Inactive</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-secondary mt-1">
                                                Account ID: {account.account_id}
                                            </p>
                                            <p className="text-xs text-secondary mt-1">
                                                Created: {new Date(account.created_at).toLocaleDateString()}
                                            </p>

                                            {/* Test Result */}
                                            {testResult && testResult.id === account.id && (
                                                <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'} mt-2`}>
                                                    <span className="text-sm">{testResult.message}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTest(account.id)}
                                                className="btn btn-sm btn-ghost"
                                                disabled={testingId === account.id}
                                            >
                                                {testingId === account.id ? (
                                                    <div className="loading loading-spinner loading-sm"></div>
                                                ) : (
                                                    <TestTube size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(account)}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account.id)}
                                                className="btn btn-sm btn-ghost text-error"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
