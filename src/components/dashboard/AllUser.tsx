import React, { useEffect, useState } from 'react';
import useAxiosSecure from '@/hooks/useAxiosSecure';
import { Button } from '@/components/ui/button';

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

    const filtered = users.filter(u => {
        if (tab === 'deleted') return !!u.isDeleted;
        if (tab === 'active') return u.status === 'Active' && !u.isDeleted;
        // blocked: not Active and not deleted
        return u.status !== 'Active' && !u.isDeleted;
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">All Users</h2>
                <div className="flex items-center gap-3">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, email or phone"
                        className="bg-secondary/50 border border-border rounded-xl p-2"
                    />
                    <Button variant="outline" onClick={fetchUsers}>Refresh</Button>
                </div>
            </div>

            <div className="flex gap-2">
                <button className={`px-4 py-2 rounded ${tab==='active' ? 'bg-primary text-white' : 'bg-secondary/30'}`} onClick={() => setTab('active')}>Active</button>
                <button className={`px-4 py-2 rounded ${tab==='blocked' ? 'bg-primary text-white' : 'bg-secondary/30'}`} onClick={() => setTab('blocked')}>Blocked</button>
                <button className={`px-4 py-2 rounded ${tab==='deleted' ? 'bg-primary text-white' : 'bg-secondary/30'}`} onClick={() => setTab('deleted')}>Deleted</button>
            </div>

            <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {loading && (
                                <tr><td colSpan={6} className="px-6 py-6 text-center">Loading...</td></tr>
                            )}
                            {error && (
                                <tr><td colSpan={6} className="px-6 py-6 text-center text-destructive">{error}</td></tr>
                            )}
                            {!loading && !error && filtered.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-6 text-center">No users</td></tr>
                            )}

                            {filtered.map(u => (
                                <tr key={u._id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-4 font-bold">{u.name}</td>
                                    <td className="px-6 py-4">{u.phone}</td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4">{u.role}</td>
                                    <td className="px-6 py-4">{u.isDeleted ? 'Deleted' : u.status}</td>
                                    <td className="px-6 py-4">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllUser;