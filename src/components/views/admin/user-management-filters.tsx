import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

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
    <Card className="!pb-6 shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
          <Filter className="h-5 w-5 text-blue-600" />
          Filter & Pencarian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Pencarian Teks */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nama, email, atau unit kerja..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Filter Role Dinamis */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</Label>
            <Select value={filterRole} onValueChange={onRoleChange}>
              <SelectTrigger className="bg-slate-50 focus:bg-white transition-colors">
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
          </div>

          {/* Filter Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Akun</Label>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="bg-slate-50 focus:bg-white transition-colors">
                <SelectValue />
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
        </div>
      </CardContent>
    </Card>
  );
};