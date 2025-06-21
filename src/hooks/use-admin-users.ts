import { useEffect, useState } from 'react';

import { toast } from 'sonner';

export interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
    role: 'USER' | 'ADMIN';
    emailVerified: Date | null;
    _count: {
        userGameEntries: number;
    };
}

export interface UserPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface AdminUsersResponse {
    users: AdminUser[];
    pagination: UserPagination;
}

export function useAdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<UserPagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchUsers = async (page = 1, searchTerm = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await fetch(`/api/admin/users?${params}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch users');
            }

            const data: AdminUsersResponse = await response.json();
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    role: newRole
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user role');
            }

            const data = await response.json();

            // Update the user in the local state
            setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));

            toast.success('User role updated successfully', {
                description: `${data.user.email} is now ${newRole.toLowerCase()}`
            });

            return data.user;
        } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('Failed to update user role', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    };

    const handleSearch = (searchTerm: string) => {
        setSearch(searchTerm);
        fetchUsers(1, searchTerm);
    };

    const handlePageChange = (newPage: number) => {
        fetchUsers(newPage, search);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        pagination,
        loading,
        search,
        fetchUsers,
        updateUserRole,
        handleSearch,
        handlePageChange
    };
}
