import { useState, useEffect } from 'react';
import { useAccount } from '../context/AccountContext';
import api from '../utils/api';

export default function AccountSelector() {
    const { selectedAccount, setSelectedAccount } = useAccount();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedAccount(value === '' ? null : value);
    };

    if (loading) {
        return (
            <select className="form-select" disabled style={{ minWidth: '200px' }}>
                <option>Loading accounts...</option>
            </select>
        );
    }

    if (accounts.length === 0) {
        return null; // Don't show selector if no accounts
    }

    return (
        <select
            className="form-select"
            value={selectedAccount || ''}
            onChange={handleChange}
            style={{ minWidth: '200px' }}
        >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                    {account.account_name}
                </option>
            ))}
        </select>
    );
}
