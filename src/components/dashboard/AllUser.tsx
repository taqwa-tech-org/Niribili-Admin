import React, { useEffect, useState } from 'react';
import useAxiosSecure from '@/AllHooks/useAxiosSecure';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, UserCheck, UserX, Trash2, Mail, Phone } from 'lucide-react';

interface UserItem {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    role?: string;
    status?: string;
    isDeleted?: boolean;
    createdAt?: string;
};

const AllUser: React.FC = () => {
    const axiosSecure = useAxiosSecure();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'active' | 'blocked' | 'deleted'>('active');
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axiosSecure.get('/user/all');
            setUsers(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- ফিল্টারিং লজিক ফিক্সড ---
    const filtered = users.filter(u => {
        // ১. ডিলিটেড ট্যাব: শুধুমাত্র যাদের isDeleted: true
        if (tab === 'deleted') return u.isDeleted === true;

        // ২. বাকি ট্যাবগুলোর জন্য অবশ্যই isDeleted: false হতে হবে
        if (u.isDeleted) return false;

        const currentStatus = (u.status || '').toLowerCase();
        
        // ৩. একটিভ ট্যাব: যাদের Status "Active"
        if (tab === 'active') return currentStatus === 'active';
        
        // ৪. ব্লকড ট্যাব: যাদের Status "Blocked"
        if (tab === 'blocked') return currentStatus === 'blocked';

        return false;
    }).filter(u => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">User Directory</h2>
                    <p className="text-muted-foreground text-sm">Manage access and monitor account statuses.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email..."
                            className="bg-secondary/40 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
                        />
                    </div>
                    <Button variant="default" onClick={fetchUsers} className="rounded-xl flex gap-2">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl w-fit border border-border">
                <button 
                    onClick={() => setTab('active')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'active' ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <UserCheck size={16}/> Active
                </button>
                <button 
                    onClick={() => setTab('blocked')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'blocked' ? 'bg-card shadow text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <UserX size={16}/> Blocked
                </button>
                <button 
                    onClick={() => setTab('deleted')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'deleted' ? 'bg-card shadow text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Trash2 size={16}/> Deleted
                </button>
            </div>

            {/* Table Container */}
            <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-black tracking-widest border-b border-border">
                            <tr>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Account Status</th>
                                <th className="px-6 py-4">Registered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center animate-pulse text-muted-foreground">Synchronizing data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">No users found in {tab} section.</td></tr>
                            ) : (
                                filtered.map(u => (
                                    <tr key={u._id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-lg">{u.name}</td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                <Mail size={12} className="text-primary"/> {u.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                                <Phone size={12} className="text-primary"/> {u.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-secondary text-[10px] font-black uppercase tracking-tighter">
                                                {u.role || 'Resident'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                u.isDeleted ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                u.status?.toLowerCase() === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                                    u.isDeleted ? "bg-red-500" :
                                                    u.status?.toLowerCase() === 'active' ? "bg-emerald-500" : "bg-amber-500"
                                                }`} />
                                                {u.isDeleted ? 'Deleted' : u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-medium">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllUser;