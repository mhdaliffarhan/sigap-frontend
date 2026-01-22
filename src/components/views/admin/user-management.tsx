import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, getUsersSync, addAuditLog, addNotification, api } from '@/lib/storage';
import { roleApi } from '@/lib/api';
import type { User } from '@/types';

import { UserManagementFilters } from './user-management-filters';
import { UserManagementTable } from './user-management-table';
import { UserManagementDialogs } from './user-management-dialogs';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Akses Ditolak
            </CardTitle>
            <CardDescription>
              Hanya Super Admin yang dapat mengakses User Management
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [users, setUsers] = useState<User[]>(getUsersSync());
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // State loading untuk tombol submit

  // Load Data
  useEffect(() => {
    const loadAllData = async () => {
      setLoadingData(true);
      try {
        const [fetchedUsers, fetchedRoles] = await Promise.all([
          getUsers(),
          roleApi.getAll().catch(() => [])
        ]);

        setUsers(fetchedUsers);
        
        let rolesData = [];
        if (Array.isArray(fetchedRoles)) rolesData = fetchedRoles;
        else if (fetchedRoles?.data && Array.isArray(fetchedRoles.data)) rolesData = fetchedRoles.data;
        else if (Array.isArray(fetchedRoles?.data)) rolesData = fetchedRoles.data;
        
        setAvailableRoles(rolesData);
      } catch (err) {
        console.warn('⚠️ Failed to fetch data', err);
        toast.error("Gagal memuat data pengguna/role");
      } finally {
        setLoadingData(false);
      }
    };
    loadAllData();
  }, []);

  // State Dialogs & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    nip: '',
    jabatan: '',
    email: '',
    roles: ['pegawai'] as string[],
    unitKerja: '',
    phone: '',
    isActive: true,
  });
  
  const [createFormData, setCreateFormData] = useState({
    name: '',
    nip: '',
    jabatan: '',
    email: '',
    password: '',
    roles: ['pegawai'] as string[],
    unitKerja: '',
    phone: '',
  });

  // --- HELPER: Parse Error Message Backend ---
  const handleApiError = (err: any, defaultMsg: string) => {
    console.error(defaultMsg, err);
    setIsSubmitting(false); // Matikan loading

    // Cek apakah error 422 (Validasi)
    if (err.response?.status === 422 && err.response?.data?.errors) {
      const errors = err.response.data.errors;
      // Ambil semua pesan error dari object errors
      const errorMessages = Object.values(errors).flat().join('\n');
      
      toast.error("Gagal Validasi Data", {
        description: errorMessages, // Tampilkan detail error (misal: Format email salah)
        duration: 5000,
      });
    } else {
      // Error lain (500, 403, dll)
      toast.error(defaultMsg, {
        description: err.response?.data?.message || err.message || "Terjadi kesalahan sistem.",
      });
    }
  };

  // --- HANDLERS ---

  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (editFormData.roles.length === 0) {
      toast.error('User harus memiliki minimal satu role');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: editFormData.name,
        nip: editFormData.nip,
        jabatan: editFormData.jabatan,
        email: editFormData.email,
        unit_kerja: editFormData.unitKerja,
        phone: editFormData.phone,
        roles: editFormData.roles,
        is_active: editFormData.isActive,
      };

      const response: any = await api.put(`users/${selectedUser.id}`, payload);
      
      // FIX CRASH: Ambil data user dari properti .data jika ada wrapper
      const updatedUser = response.data || response;

      const updatedUsers = users.map(u => (u.id === selectedUser.id ? updatedUser : u));
      setUsers(updatedUsers);

      addAuditLog({
        userId: currentUser.id,
        action: 'USER_UPDATED',
        details: `Updated user ${selectedUser.email}`,
      });

      toast.success('User berhasil diperbarui');
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      handleApiError(err, 'Gagal memperbarui user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    // Basic Client Validation
    if (!createFormData.name || !createFormData.nip || !createFormData.jabatan || !createFormData.email || !createFormData.password) {
      toast.error('Semua field bertanda * harus diisi');
      return;
    }
    if (createFormData.roles.length === 0) {
      toast.error('Pilih minimal satu role');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: createFormData.name,
        nip: createFormData.nip,
        jabatan: createFormData.jabatan,
        email: createFormData.email.toLowerCase(),
        password: createFormData.password,
        unit_kerja: createFormData.unitKerja,
        phone: createFormData.phone,
        roles: createFormData.roles,
        is_active: true,
      };

      const response: any = await api.post('users', payload);
      
      // FIX CRASH: Unwrapping response structure
      // Backend return: { message: "...", data: { id: ... } }
      // Kita butuh object di dalam 'data'
      const newUser = response.data || response; 

      if (!newUser || !newUser.id) {
        throw new Error("Respon server tidak valid: Data user hilang");
      }

      setUsers(prev => [newUser, ...prev]);

      addAuditLog({
        userId: currentUser.id,
        action: 'USER_CREATED',
        details: `Created new user ${newUser.email}`,
      });

      toast.success('User baru berhasil dibuat');
      setShowCreateDialog(false);
      
      // Reset Form
      setCreateFormData({
        name: '',
        nip: '',
        jabatan: '',
        email: '',
        password: '',
        roles: ['pegawai'],
        unitKerja: '',
        phone: '',
      });
    } catch (err: any) {
      handleApiError(err, 'Gagal membuat user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Sisa handler delete, toggle status, form change sama seperti sebelumnya) ...
  // Biar kode tidak kepanjangan, saya ringkas bagian ini karena logika di atas adalah kunci perbaikannya.
  
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    api.delete(`users/${selectedUser.id}`)
      .then(() => getUsers().then(fetched => setUsers(fetched)))
      .then(() => {
        addAuditLog({ userId: currentUser.id, action: 'USER_DELETED', details: `Deleted user ${selectedUser.email}` });
        toast.success('User berhasil dihapus');
      })
      .catch(err => toast.error('Tidak dapat menghapus user', { description: 'User memiliki data terkait (tiket/log) dan tidak bisa dihapus.' }))
      .finally(() => {
        setShowDeleteDialog(false);
        setSelectedUser(null);
        setIsSubmitting(false);
      });
  };

  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = !user.isActive;
    // Optimistic
    setUsers(users.map(u => (u.id === userId ? { ...u, isActive: newStatus } : u)));
    api.put(`users/${userId}`, { is_active: newStatus, roles: user.roles || [user.role] })
      .then(() => toast.success(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`))
      .catch(() => {
        setUsers(users); // Revert
        toast.error('Gagal mengubah status');
      });
  };

  const toggleCreateRole = (role: string) => {
    setCreateFormData(prev => {
      const exists = prev.roles.includes(role);
      // Allow deselecting role, but handled in validation if empty
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const toggleEditRole = (role: string) => {
    setEditFormData(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  // --- FILTERS ---
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.unitKerja || '').toLowerCase().includes(searchTerm.toLowerCase()); // Safe check

    const matchesRole = filterRole === 'all' || 
                        user.role === filterRole || 
                        (Array.isArray(user.roles) && user.roles.includes(filterRole));
                        
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      super_admin: { variant: 'destructive', label: 'Super Admin' },
      admin_layanan: { variant: 'default', label: 'Admin Layanan' },
      admin_penyedia: { variant: 'default', label: 'Admin Penyedia' },
      teknisi: { variant: 'secondary', label: 'Teknisi' },
      pegawai: { variant: 'outline', label: 'Pegawai' },
    };
    if (config[role]) return <Badge variant={config[role].variant}>{config[role].label}</Badge>;
    const dynamicRole = availableRoles.find(r => r.code === role);
    return dynamicRole 
      ? <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">{dynamicRole.name}</Badge>
      : <Badge variant="outline">{role}</Badge>;
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      nip: user.nip || '',
      jabatan: user.jabatan || '',
      email: user.email,
      roles: user.roles ?? [user.role],
      unitKerja: user.unitKerja || '',
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-3xl font-bold max-md:text-2xl">User Management</h1>
          <p className="text-gray-500 mt-1 max-md:text-sm">Kelola pengguna dan permission</p>
        </div>
        <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch max-md:w-full">
          <Badge variant="outline" className="gap-2 justify-center py-2 md:py-1">
            <Users className="h-4 w-4" />
            {users.length} Total Users
          </Badge>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 max-md:w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Tambah User Baru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserManagementFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        availableRoles={availableRoles}
      />

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loadingData ? (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
               <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
               <p>Memuat data pengguna & role...</p>
             </div>
          ) : (
            <UserManagementTable
              users={filteredUsers}
              currentUser={currentUser}
              onEdit={openEditDialog}
              onDelete={(user) => {
                setSelectedUser(user);
                setShowDeleteDialog(true);
              }}
              onToggleStatus={handleToggleStatus}
              getRoleBadge={getRoleBadge}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserManagementDialogs
        showCreateDialog={showCreateDialog}
        onCreateDialogChange={setShowCreateDialog}
        createFormData={createFormData}
        onCreateFormChange={setCreateFormData}
        onCreateToggleRole={toggleCreateRole}
        onCreateSubmit={handleCreateUser}
        
        showEditDialog={showEditDialog}
        onEditDialogChange={setShowEditDialog}
        editFormData={editFormData}
        onEditFormChange={setEditFormData}
        onEditToggleRole={toggleEditRole}
        onEditSubmit={handleEditUser}
        
        editingUser={selectedUser}
        showDeleteDialog={showDeleteDialog}
        onDeleteDialogChange={setShowDeleteDialog}
        deletingUser={selectedUser}
        onDeleteSubmit={handleDeleteUser}
        currentUserRole={currentUser.role}
        
        availableRoles={availableRoles} 
      />
      
      {/* Loading Overlay saat Submit */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="font-semibold text-gray-700">Sedang memproses...</p>
          </div>
        </div>
      )}

    </div>
  );
};