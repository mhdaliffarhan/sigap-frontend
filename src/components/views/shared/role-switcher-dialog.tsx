import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check } from 'lucide-react';
import type { User as UserType, UserRole } from '@/types';

interface RoleSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
  activeRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
}

export const RoleSwitcherDialog: React.FC<RoleSwitcherDialogProps> = ({
  open,
  onOpenChange,
  currentUser,
  activeRole,
  onRoleSwitch,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);

  // Get available roles from currentUser
  const availableRoles = currentUser?.roles || [currentUser?.role];

  const formatRoleLabel = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleConfirm = () => {
    onRoleSwitch(selectedRole);
    onOpenChange(false);
  };

  // Generate generic color variations based on string length to give variety
  const getRoleColor = (role: string) => {
    const colors = ['blue', 'indigo', 'purple', 'emerald', 'teal', 'cyan'];
    let hash = 0;
    for (let i = 0; i < role.length; i++) {
        hash = role.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Pilih Peran Aktif</AlertDialogTitle>
          <AlertDialogDescription>
            Pilih peran yang ingin Anda gunakan. Dashboard akan berubah sesuai dengan peran yang dipilih.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-4 max-h-[60vh] overflow-y-auto pr-2">
          {availableRoles.map((role) => {
            const isActive = selectedRole === role;
            const isCurrent = activeRole === role;
            const label = formatRoleLabel(role);
            const colorName = getRoleColor(role);

            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive
                      ? `bg-${colorName}-600 text-white`
                      : `bg-${colorName}-100 text-${colorName}-700`
                      } font-bold text-lg`}
                  >
                    {label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{label}</p>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Aktif Sekarang
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Akses mode sebagai {label}</p>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedRole === activeRole}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ganti ke {formatRoleLabel(selectedRole)}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};