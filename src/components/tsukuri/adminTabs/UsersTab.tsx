import React, { useState } from 'react';
import { Plus, Trash2, Edit, Lock, Search } from 'lucide-react';

export interface StudioUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Production Lead' | 'CAD Designer' | 'Fulfillment Agent';
  status: 'Active' | 'Inactive';
  lastActive: string;
}

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<StudioUser[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_admin_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'usr-1', name: 'Aditya Joshi', username: 'aditya', email: 'commersgyan@gmail.com', role: 'Super Admin', status: 'Active', lastActive: 'Current Session' },
      { id: 'usr-2', name: 'Anshuman', username: 'anshuman', email: 'sheracleanz@gmail.com', role: 'Super Admin', status: 'Active', lastActive: 'Active Co-Founder' },
    ];
  });

  const saveUsers = (newUsers: StudioUser[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem('tsukuri_admin_users', JSON.stringify(newUsers));
    } catch {}
  };

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Production Lead' | 'CAD Designer' | 'Fulfillment Agent'>('Production Lead');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [userToast, setUserToast] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = users.map((u) =>
        u.id === editingId
          ? { ...u, name, username, email, role, status }
          : u
      );
      saveUsers(updated);
    } else {
      const newUser: StudioUser = {
        id: `usr-${Date.now()}`,
        name,
        username,
        email,
        role,
        status,
        lastActive: 'Just now',
      };
      saveUsers([...users, newUser]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (u: StudioUser) => {
    setEditingId(u.id);
    setName(u.name);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === 'usr-1' || id === 'usr-2') {
      setUserToast('Studio Co-Founder account cannot be deleted.');
      setTimeout(() => setUserToast(''), 3500);
      return;
    }
    saveUsers(users.filter((u) => u.id !== id));
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#1e4b3e]" />
            <span>STUDIO USER ACCOUNTS & ACCESS CONTROL</span>
          </h2>
          <p className="text-xs text-slate-500">
            Role-Based Access Control (RBAC) for studio technicians, CAD slicers, and logistics operators.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setUsername('');
              setEmail('');
              setRole('Production Lead');
              setStatus('Active');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD USER</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">User Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Active</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold text-[#1a2e26]">{u.name}</td>
                <td className="p-3 font-mono text-slate-500 font-bold">@{u.username}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8ece1] text-[#1e4b3e]">
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-slate-400 text-[11px]">{u.lastActive}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                      title="Edit User"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== 'usr-1' && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit User Account' : 'Create New User Account'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenji Sato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="kenji"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="kenji@tsukuri3d.store"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Production Lead">Production Lead</option>
                    <option value="CAD Designer">CAD Designer</option>
                    <option value="Fulfillment Agent">Fulfillment Agent</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-full bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs shadow-md"
                >
                  SAVE USER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900 text-white font-bubbly text-xs shadow-xl flex items-center gap-2 animate-in fade-in">
          <span>{userToast}</span>
        </div>
      )}
    </div>
  );
};
