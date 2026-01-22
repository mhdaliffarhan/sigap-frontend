import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import type { User, UserRole } from "@/types";

interface CreateFormData {
  name: string;
  username?: string; // Optional jika tidak dipakai di backend
  nip: string;
  jabatan: string;
  email: string;
  password: string;
  roles: string[]; // Generic string agar support dynamic roles
  unitKerja: string;
  phone: string;
}

interface EditFormData {
  name: string;
  username?: string;
  nip: string;
  jabatan: string;
  email: string;
  roles: string[];
  unitKerja: string;
  phone: string;
  isActive: boolean;
}

interface UserManagementDialogsProps {
  showCreateDialog: boolean;
  onCreateDialogChange: (open: boolean) => void;
  createFormData: CreateFormData;
  onCreateFormChange: (data: CreateFormData) => void;
  onCreateToggleRole: (role: string) => void; // Generic string
  onCreateSubmit: () => void;

  showEditDialog: boolean;
  onEditDialogChange: (open: boolean) => void;
  editFormData: EditFormData;
  onEditFormChange: (data: EditFormData) => void;
  onEditToggleRole: (role: string) => void;
  onEditSubmit: () => void;
  editingUser: User | null;

  showDeleteDialog: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  deletingUser: User | null;
  onDeleteSubmit: () => void;

  currentUserRole: string;
  
  // PROP BARU: Menerima list role dari database
  availableRoles: { id: string; code: string; name: string }[];
}

export const UserManagementDialogs: React.FC<UserManagementDialogsProps> = ({
  showCreateDialog,
  onCreateDialogChange,
  createFormData,
  onCreateFormChange,
  onCreateToggleRole,
  onCreateSubmit,
  showEditDialog,
  onEditDialogChange,
  editFormData,
  onEditFormChange,
  onEditToggleRole,
  onEditSubmit,
  showDeleteDialog,
  onDeleteDialogChange,
  deletingUser,
  onDeleteSubmit,
  currentUserRole,
  availableRoles = [], // Default empty array
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={onCreateDialogChange}>
        <DialogContent className="md:max-w-md md:max-h-[85vh] max-md:max-w-[90vw] max-md:max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru untuk sistem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama lengkap user"
                value={createFormData.name}
                onChange={(e) =>
                  onCreateFormChange({ ...createFormData, name: e.target.value })
                }
              />
            </div>

            {/* <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="username"
                value={createFormData.username}
                onChange={(e) =>
                  onCreateFormChange({ ...createFormData, username: e.target.value })
                }
              />
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  placeholder="18 digit NIP"
                  maxLength={18}
                  value={createFormData.nip}
                  onChange={(e) =>
                    onCreateFormChange({ ...createFormData, nip: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input
                  placeholder="Jabatan"
                  value={createFormData.jabatan}
                  onChange={(e) =>
                    onCreateFormChange({ ...createFormData, jabatan: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@gmail.com"
                value={createFormData.email}
                onChange={(e) =>
                  onCreateFormChange({ ...createFormData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password untuk user"
                  value={createFormData.password}
                  onChange={(e) =>
                    onCreateFormChange({ ...createFormData, password: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Password minimal 8 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label>Roles (pilih satu atau lebih)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border p-2 rounded-md bg-slate-50">
                {availableRoles.length === 0 ? (
                   <p className="text-xs text-muted-foreground col-span-2 text-center py-2">Memuat roles...</p>
                ) : (
                  availableRoles.map((role) => {
                    const checked = createFormData.roles.includes(role.code);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-2 border rounded px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onCreateToggleRole(role.code)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium">{role.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unit Kerja</Label>
              <Input
                placeholder="Contoh: Bagian TI"
                value={createFormData.unitKerja}
                onChange={(e) =>
                  onCreateFormChange({ ...createFormData, unitKerja: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                placeholder="Contoh: 081234567890"
                value={createFormData.phone}
                onChange={(e) =>
                  onCreateFormChange({ ...createFormData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => onCreateDialogChange(false)}
            >
              Batal
            </Button>
            <Button onClick={onCreateSubmit}>Buat User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={onEditDialogChange}>
        <DialogContent className="md:max-w-md md:max-h-[85vh] max-md:max-w-[90vw] max-md:max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Perbarui informasi user</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editFormData.name}
                onChange={(e) =>
                  onEditFormChange({ ...editFormData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  placeholder="18 digit NIP"
                  maxLength={18}
                  value={editFormData.nip}
                  onChange={(e) =>
                    onEditFormChange({ ...editFormData, nip: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input
                  placeholder="Jabatan"
                  value={editFormData.jabatan}
                  onChange={(e) =>
                    onEditFormChange({ ...editFormData, jabatan: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  onEditFormChange({ ...editFormData, email: e.target.value })
                }
              />
            </div>

            {currentUserRole === "super_admin" && (
              <div className="space-y-2">
                <Label>Roles (pilih satu atau lebih)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border p-2 rounded-md bg-slate-50">
                  {availableRoles.map((role) => {
                    const checked = editFormData.roles.includes(role.code);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-2 border rounded px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onEditToggleRole(role.code)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium">{role.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Unit Kerja</Label>
              <Input
                value={editFormData.unitKerja}
                onChange={(e) =>
                  onEditFormChange({ ...editFormData, unitKerja: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) =>
                  onEditFormChange({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => onEditDialogChange(false)}>
              Batal
            </Button>
            <Button onClick={onEditSubmit}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              Apakah Anda yakin ingin menghapus user "{deletingUser?.name}"?
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteSubmit}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};