import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LogOut, 
  ShieldCheck,
  UserPlus,
  LogIn,
  RefreshCw,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : '/api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, register, dashboard, admin
  const [formData, setFormData] = useState({ 
    acc_id: '', 
    password: '', 
    name: '', 
    initial_deposit: '' 
  });
  const [actionAmount, setActionAmount] = useState('');
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, {
        acc_id: formData.acc_id,
        password: formData.password
      });
      if (res.data.success) {
        setUser(res.data.user);
        setView('dashboard');
        setError('');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/register`, formData);
      if (res.data.success) {
        setView('login');
        setError('Account created! Please login.');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  const performAction = async (type) => {
    try {
      const endpoint = type === 'deposit' ? 'deposit' : 'withdraw';
      const res = await axios.post(`${API_URL}/${endpoint}`, {
        acc_id: user.acc_id,
        amount: actionAmount
      });
      if (res.data.success) {
        refreshUser();
        setActionAmount('');
        setError('');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Action failed');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/account/${user.acc_id}`);
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {}
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: formData.acc_id,
        password: formData.password
      });
      if (res.data.success) {
        const accountsRes = await axios.get(`${API_URL}/admin/accounts`);
        setAdminData(accountsRes.data.accounts);
        setView('admin');
        setError('');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Admin access failed');
    }
  };

  if (view === 'login' || view === 'register' || view === 'admin_login') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Wallet size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
            <h2>{view === 'login' ? 'Nexus Banking' : view === 'register' ? 'Join Nexus' : 'Admin Portal'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Secure Persistent Finance</p>
          </div>

          {error && <p style={{ color: 'var(--accent-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

          <form onSubmit={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleAdminLogin}>
            {view === 'register' && (
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
            )}
            <div className="input-group">
              <label>{view === 'admin_login' ? 'Admin Username' : 'Account ID'}</label>
              <input type="text" value={formData.acc_id} onChange={e => setFormData({...formData, acc_id: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
            {view === 'register' && (
              <div className="input-group">
                <label>Initial Deposit (₹)</label>
                <input type="number" value={formData.initial_deposit} onChange={e => setFormData({...formData, initial_deposit: e.target.value})} required />
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {view === 'login' ? <LogIn size={20} /> : view === 'register' ? <UserPlus size={20} /> : <ShieldCheck size={20} />}
              {view === 'login' ? 'Login' : view === 'register' ? 'Register' : 'Access Control'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {view === 'login' ? (
              <>
                <a href="#" onClick={() => setView('register')} style={{ color: 'var(--primary)', marginRight: '1rem' }}>Create Account</a>
                <a href="#" onClick={() => setView('admin_login')} style={{ color: 'var(--text-muted)' }}>Admin</a>
              </>
            ) : (
              <a href="#" onClick={() => setView('login')} style={{ color: 'var(--primary)' }}>Back to Login</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin' && adminData) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2><ShieldCheck style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> System Control</h2>
          <button className="btn btn-primary" onClick={() => setView('login')}><LogOut size={18} /> Exit</button>
        </div>
        
        <div className="glass-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Balance</th>
                <th style={{ padding: '1rem' }}>Txns</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(adminData).map(([id, data]) => (
                <tr key={id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem' }}>{id}</td>
                  <td style={{ padding: '1rem' }}>{data.name}</td>
                  <td style={{ padding: '1rem' }}>₹{data.balance.toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{data.transactions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in dashboard-grid">
      {/* Sidebar / Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="balance-card">
          <p style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Balance</p>
          <h1 style={{ fontSize: '2.5rem' }}>₹{user.balance.toLocaleString()}</h1>
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>{user.name}</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user.acc_id}</p>
        </div>

        <div className="glass-card">
          <h3>Quick Actions</h3>
          <div style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={actionAmount} 
                onChange={e => setActionAmount(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--accent-green)' }}
                onClick={() => performAction('deposit')}
              >
                <PlusCircle size={18} /> Deposit
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--accent-red)' }}
                onClick={() => performAction('withdraw')}
              >
                <MinusCircle size={18} /> Withdraw
              </button>
            </div>
            {error && <p style={{ color: 'var(--accent-red)', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</p>}
          </div>
        </div>

        <button className="btn" style={{ color: 'var(--text-muted)' }} onClick={() => setView('login')}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Main Content / Transactions */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3><History style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Transaction History</h3>
          <button className="btn" onClick={refreshUser}><RefreshCw size={16} /></button>
        </div>

        <div className="transactions-list">
          {[...user.transactions].reverse().map((txn, i) => (
            <div key={i} className="transaction-item">
              <div>
                <p style={{ fontWeight: 600 }}>{txn.type}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{txn.timestamp}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className={txn.type.includes('Withdraw') ? 'amount-negative' : 'amount-positive'} style={{ fontWeight: 700 }}>
                  {txn.type.includes('Withdraw') ? '-' : '+'} ₹{txn.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {user.transactions.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
