import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface UserManagementFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onRoleChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  // Prop baru untuk menerima data role dinamis
  availableRoles?: { id: string; code: string; name: string }[];
}

export const UserManagementFilters: React.FC<UserManagementFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleChange,
  filterStatus,
  onStatusChange,
  availableRoles = [], // Default array kosong
}) => {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-center max-md:flex-col max-md:items-stretch">

          {/* Pencarian Teks */}
          <div className="relative flex-1 min-w-[200px] h-10 max-md:w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, email, unit..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-full text-sm w-full bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Role Dinamis */}
          <Select value={filterRole} onValueChange={onRoleChange}>
            <SelectTrigger className="h-10 text-sm flex-1 max-md:w-full bg-slate-50 focus:bg-white transition-colors">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-medium">Semua Role</SelectItem>

              {/* Render Role dari Database */}
              {availableRoles.length > 0 ? (
                availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.code}>
                    {role.name}
                  </SelectItem>
                ))
              ) : (
                // Fallback jika data role gagal dimuat / kosong
                <>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin_layanan">Admin Layanan</SelectItem>
                  <SelectItem value="admin_penyedia">Admin Penyedia</SelectItem>
                  <SelectItem value="teknisi">Teknisi</SelectItem>
                  <SelectItem value="pegawai">Pegawai</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Filter Status */}
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 text-sm flex-1 max-md:w-full bg-slate-50 focus:bg-white transition-colors">
              <SelectValue placeholder="Status Akun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span> Aktif
                </span>
              </SelectItem>
              <SelectItem value="inactive">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span> Nonaktif
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};