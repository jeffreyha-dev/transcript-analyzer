import { createContext, useContext, useState } from 'react';

const AccountContext = createContext();

export function AccountProvider({ children }) {
    const [selectedAccount, setSelectedAccount] = useState(null); // null = "All Accounts"

    return (
        <AccountContext.Provider value={{ selectedAccount, setSelectedAccount }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error('useAccount must be used within AccountProvider');
    }
    return context;
}
