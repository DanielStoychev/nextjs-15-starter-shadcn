'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/registry/new-york-v4/ui/dialog';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import { Edit2, Eye, Search, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: 'USER' | 'ADMIN';
    emailVerified: Date | null;
    createdAt: Date;
    _count: {
        userGameEntries: number;
    };
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (user) =>
                    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by role
        if (roleFilter !== 'ALL') {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
    };

    const handleRoleChange = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch('/api/admin/users/role', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    newRole: newRole
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update user role');
            }

            // Update local state
            setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: newRole } : user)));

            toast.success(`User role updated to ${newRole}`);
            setIsRoleDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast.error('Failed to update user role');
            console.error(error);
        }
    };

    const openRoleDialog = (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsRoleDialogOpen(true);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className='p-6'>
                    <div className='text-center'>
                        <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2'></div>
                        <p className='text-muted-foreground mt-2 text-sm'>Loading users...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Shield className='h-5 w-5' />
                        User Management
                    </CardTitle>
                    <CardDescription>
                        Manage user accounts, roles, and permissions. Total users: {users.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className='mb-6 flex flex-col gap-4 sm:flex-row'>
                        <div className='relative flex-1'>
                            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                            <Input
                                placeholder='Search by name or email...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-10'
                            />
                        </div>
                        <Select
                            value={roleFilter}
                            onValueChange={(value: 'ALL' | 'USER' | 'ADMIN') => setRoleFilter(value)}>
                            <SelectTrigger className='w-40'>
                                <SelectValue placeholder='Filter by role' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='ALL'>All Roles</SelectItem>
                                <SelectItem value='USER'>Users</SelectItem>
                                <SelectItem value='ADMIN'>Admins</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Users Table */}
                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email Status</TableHead>
                                    <TableHead>Game Entries</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                                            No users found matching your criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div>
                                                    <div className='font-medium'>{user.name || 'No name'}</div>
                                                    <div className='text-muted-foreground text-sm'>{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                    {user.role === 'ADMIN' ? (
                                                        <ShieldCheck className='mr-1 h-3 w-3' />
                                                    ) : (
                                                        <Shield className='mr-1 h-3 w-3' />
                                                    )}
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
                                                    {user.emailVerified ? 'Verified' : 'Unverified'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user._count.userGameEntries}</TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() => openRoleDialog(user)}>
                                                    <Edit2 className='mr-1 h-3 w-3' />
                                                    Edit Role
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Role Change Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            You are about to change the role for {selectedUser?.name || selectedUser?.email}. This
                            action will affect their permissions immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <div className='space-y-2'>
                            <label className='text-sm font-medium'>New Role</label>
                            <Select value={newRole} onValueChange={(value: 'USER' | 'ADMIN') => setNewRole(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='USER'>
                                        <div className='flex items-center'>
                                            <Shield className='mr-2 h-4 w-4' />
                                            User - Standard access
                                        </div>
                                    </SelectItem>
                                    <SelectItem value='ADMIN'>
                                        <div className='flex items-center'>
                                            <ShieldCheck className='mr-2 h-4 w-4' />
                                            Admin - Full access
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newRole === 'ADMIN' && (
                            <div className='mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20'>
                                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                                    <strong>Warning:</strong> Admin users have full access to manage users, games, and
                                    system settings.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsRoleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRoleChange}>Update Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
