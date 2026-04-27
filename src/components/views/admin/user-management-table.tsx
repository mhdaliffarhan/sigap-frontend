import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Edit, 
  Trash2,
  ShieldAlert,
  Lock // Ditambahkan untuk reset password
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { User, UserRole } from '@/types';

interface UserManagementTableProps {
  users: User[];
  currentUser: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string) => void;
  onResetPassword: (user: User) => void; // New prop
  getRoleBadge: (role: UserRole) => React.ReactNode;
}

// Helper tidak diperlukan lagi karena avatar profil dihapus

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  currentUser,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  getRoleBadge,
}) => {
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Watch for changes in users array length (like filtering), resetting to page 1
  React.useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  return (
    <div className="bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[60px] border-r border-b font-semibold text-center text-slate-700">No</TableHead>
            <TableHead className="w-[200px] border-r border-b font-semibold text-slate-700 whitespace-nowrap pl-4">Nama</TableHead>
            <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 whitespace-nowrap px-4">Username</TableHead>
            <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 whitespace-nowrap px-4">Role</TableHead>
            <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 whitespace-nowrap text-center">Terakhir Login</TableHead>
            <TableHead className="w-[1%] border-b font-semibold text-slate-700 whitespace-nowrap text-center px-4">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-[400px] text-center border-b">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Tidak ada user</h3>
                  <p className="text-sm text-gray-400 mt-1">Belum ada data user yang tersedia.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user, index) => {
              // Cek apakah user baris ini adalah user yang sedang login
              const isCurrentUser = user.id === currentUser.id;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Kolom No */}
                  <TableCell className="border-r border-b font-medium text-center text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>

                  {/* Kolom Nama */}
                  <TableCell className="border-r border-b py-3 pl-4 align-middle whitespace-nowrap bg-white group-hover:bg-transparent">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                            You
                          </Badge>
                        )}
                    </div>
                  </TableCell>

                  {/* Kolom Username (Email) */}
                  <TableCell className="border-r border-b py-3 px-4 align-middle whitespace-nowrap bg-white group-hover:bg-transparent">
                     <span className="text-sm font-mono text-gray-600">{(user as any).username || user.email}</span>
                  </TableCell>

                  {/* Kolom Role */}
                  <TableCell className="border-r border-b py-3 px-4 align-middle whitespace-nowrap bg-white group-hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        {Array.isArray(user.roles) && user.roles.length > 0
                          ? user.roles.map((r) => (
                              <div key={`${user.id}-${r}`} className="scale-90 origin-left inline-block mr-1">
                                {getRoleBadge(r)}
                              </div>
                            ))
                          : <div className="scale-90 origin-left">{getRoleBadge(user.role)}</div>
                        }
                      </div>
                    </div>
                  </TableCell>

                  {/* Kolom Last Login */}
                  <TableCell className="border-r border-b py-3 px-4 align-middle text-center text-sm text-gray-500 whitespace-nowrap bg-white group-hover:bg-transparent">
                    {(user as any).lastLogin || (user as any).last_login ? (
                      new Date((user as any).lastLogin || (user as any).last_login).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    ) : (
                      <span className="text-slate-400 italic">Belum Login</span>
                    )}
                  </TableCell>

                  {/* Kolom Aksi */}
                  <TableCell className="border-b py-3 px-4 align-middle text-center whitespace-nowrap bg-white/50 group-hover:bg-transparent">
                    <div className="flex items-center justify-center gap-2">
                      
                      {/* SWITCH STATUS */}
                      {currentUser.role === 'super_admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Div pembungkus agar tooltip jalan meski disabled */}
                              <div className="flex items-center"> 
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => onToggleStatus(user.id)}
                                  disabled={isCurrentUser} // Disabled jika diri sendiri
                                  className="data-[state=checked]:bg-green-600 scale-75 origin-center data-[disabled]:opacity-50"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isCurrentUser 
                                  ? 'Anda tidak dapat menonaktifkan akun sendiri' 
                                  : (user.isActive ? 'Nonaktifkan User' : 'Aktifkan User')
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* TOMBOL EDIT (Selalu muncul) */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-600 border border-blue-200 hover:bg-blue-50"
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* TOMBOL RESET PASSWORD (Hanya Super Admin) */}
                      {currentUser.role === 'super_admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-orange-600 border border-orange-200 hover:bg-orange-50"
                                onClick={() => onResetPassword(user)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reset Password User</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* TOMBOL DELETE */}
                      {currentUser.role === 'super_admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Span pembungkus agar tooltip jalan meski disabled */}
                              <span className="inline-block"> 
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={isCurrentUser} // Disabled jika diri sendiri
                                  className="h-8 w-8 text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-transparent"
                                  onClick={() => onDelete(user)}
                                >
                                  {isCurrentUser ? (
                                    <ShieldAlert className="h-4 w-4" /> // Ikon beda jika disabled
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isCurrentUser && (
                              <TooltipContent>
                                <p>Anda tidak dapat menghapus akun sendiri</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {/* Pagination Implementation */}
      {users.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-sm max-md:flex-col max-md:gap-4">
          <div className="text-slate-500">
            Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, users.length)} - {Math.min(currentPage * itemsPerPage, users.length)} dari {users.length} data
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(users.length / itemsPerPage) }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-8 w-8 p-0 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(users.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(users.length / itemsPerPage)}
              className="h-8 px-3"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};