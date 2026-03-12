import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger
} from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import {
  Bell,
  LogOut,
  User,
  ChevronDown,
  Check,
  RefreshCw,
  Menu,
  Loader2,
  X,
  MailOpen,
  Coffee, // [NEW] Icon untuk Cuti
} from 'lucide-react';
import { motion } from 'motion/react';
import { getActiveRole, setActiveRole } from '@/lib/storage';
import { useNotifications } from '@/hooks/use-notifications';
import { ROUTES } from '@/routing';
import type { User as UserType, UserRole } from '@/types';
import type { ViewType } from './main-layout';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { RoleSwitcherDialog } from '@/components/views/shared';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { API_BASE_URL, api } from '../lib/api'; // [UPDATED] Import api
import { Switch } from './ui/switch'; // [NEW] Import Switch
import { Label } from './ui/label'; // [NEW] Import Label

// Tambahan Import Date-FNS
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface HeaderProps {
  currentUser: UserType;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRoleSwitchDialog, setShowRoleSwitchDialog] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // [NEW] State Availability
  const [isOnLeave, setIsOnLeave] = useState(currentUser.is_on_leave || false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Use API-based notifications with pagination
  const { notifications, unreadCount, loading, loadingMore, hasMore, loadMore, markAsRead, markAllAsRead } = useNotifications();

  // Get current active role
  const activeRole = getActiveRole(currentUser.id) || currentUser.role;
  const availableRoles = currentUser.roles || [currentUser.role];
  const hasMultipleRoles = availableRoles.length > 1;

  const avatarUrl = useMemo(() => {
    if (!currentUser.avatar) return null;
    if (currentUser.avatar.startsWith('http')) return currentUser.avatar;
    const rawPath = currentUser.avatar.replace(/^\/?/, '');
    const cleanPath = rawPath.startsWith('storage/') ? rawPath : `storage/${rawPath}`;
    const fileBase = (API_BASE_URL || '').replace(/\/api$/i, '');
    return fileBase ? `${fileBase}/${cleanPath}` : `/${cleanPath}`;
  }, [currentUser.avatar]);

  // Fungsi Action: Tandai Semua Dibaca
  const handleMarkAll = async () => {
    await markAllAsRead();
    toast.success('Semua notifikasi ditandai dibaca');
  };

  // Fungsi Action: Close Sheet Notifikasi
  const handleClose = () => {
    setNotificationsOpen(false);
  };

  // [NEW] Handle Toggle Cuti
  const handleToggleAvailability = async () => {
    if (togglingStatus) return;
    setTogglingStatus(true);
    
    // Optimistic Update UI
    const newState = !isOnLeave;
    setIsOnLeave(newState);

    try {
      // Tambahkan type 'any' agar TS tidak rewel, atau definisikan interface response
      const res: any = await api.post('/profile/toggle-availability');
      
      // PERBAIKAN: Akses langsung properti dari res, jangan pakai res.data
      const serverStatus = res.is_on_leave; 
      
      // Update state dengan data real dari server
      setIsOnLeave(serverStatus);
      
      if (serverStatus) {
        toast.info("Status diubah ke Cuti/Tidak Tersedia");
      } else {
        toast.success("Status diubah ke Aktif/Tersedia");
      }
    } catch (e) {
      console.error("Toggle Error:", e); // Log error asli ke console agar terlihat
      // Revert jika gagal
      setIsOnLeave(!newState);
      toast.error("Gagal mengubah status ketersediaan");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    toast.success('Anda berhasil logout');
    onLogout();
    navigate(ROUTES.LOGIN);
  };

  const handleRoleSwitchClick = () => {
    setShowRoleSwitchDialog(true);
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    try {
      await setActiveRole(newRole, currentUser.id);
      toast.success(`Berhasil beralih ke ${newRole}`);
      window.location.reload();
    } catch (e: any) {
      toast.error('Gagal mengganti peran. Silakan coba lagi.');
    }
  };

  return (
    <>
      <header
        className="
          bg-white h-[72px]
          max-md:bg-gradient-to-br
          max-md:from-white/40
          max-md:to-white/10
          max-md:backdrop-blur-xl
          max-md:border-b max-md:border-white/20
        "
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">

          {/* LEFT SIDE: Toggle, Logo, App Name, Badge */}
          <div className="flex items-center h-full gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="h-10 w-10 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} />
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-50">
                  <img src="/logo.svg" alt="BPS Logo" className="h-full w-full object-contain p-0.5" />
                </div>
              </div>

              <div className="hidden md:block items-center gap-3">
                <div className="flex flex-col">
                  <h1 className="text-sm font-black text-gray-900">SIGAP-TI</h1>
                  <p className="text-[10px] text-gray-500 !mb-0">BPS Provinsi NTB</p>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="text-[9px] max-md:text-gray-800 md:text-gray-400 uppercase tracking-wider font-medium">FOR</span>
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.7)]"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(13, 79, 97, 0.2) 0%, rgba(99, 200, 228, 0.25) 100%)",
                    border: "1px solid rgba(14,116,144,0.3)",
                    color: "#0e7490",
                  }}
                >
                  {activeRole === 'super_admin' ? 'SUPER ADMIN' :
                    activeRole === 'admin_layanan' ? 'ADMIN LAYANAN' :
                      activeRole === 'admin_penyedia' ? 'ADMIN PENYEDIA' :
                        activeRole === 'teknisi' ? 'TEKNISI' : 'PEGAWAI'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Notifications & User Menu */}
          <div className="flex items-center gap-3">

            {/* [NEW] INDIKATOR STATUS DI HEADER (OPSIONAL, AGAR TERLIHAT TANPA BUKA MENU) */}
            {isOnLeave && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full animate-in fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Mode Cuti</span>
              </div>
            )}

            {/* NOTIFICATION SHEET */}
            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-auto w-auto p-0 rounded-full hover:bg-transparent cursor-pointer">
                  <div className="rounded-full p-[2.5px] bg-gradient-to-br from-slate-300 via-white to-slate-400 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-300">
                    <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-white leading-none"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="max-sm:w-[90vw] sm:max-w-sm p-0 flex flex-col h-full [&>button]:hidden !mb-0 !gap-0">
                <div className="flex-shrink-0 flex items-center justify-between h-[72px] pl-4 pr-4 bg-blue-50 border-b border-gray-100">
                  <SheetTitle className="font-bold text-xl text-gray-900 m-0 leading-none !m-0">
                    NOTIFIKASI
                  </SheetTitle>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAll}
                        className="h-7 max-md:mr-5 text-[11px] border-1 border-blue-300 font-medium rounded-full bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100 text-black-200 hover:text-blue-600 px-2 cursor-pointer"
                        disabled={loading}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Tandai dibaca
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleClose} className="max-md:border-1 max-md:border-gray-400 h-7 w-7 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-200">
                      <X className="h-4 w-4 text-black"/>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="flex flex-col">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <MailOpen className="h-12 w-12 mb-3 text-gray-200" />
                          <p className="text-sm text-gray-400">Tidak ada notifikasi baru</p>
                        </div>
                      ) : (
                        <>
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => !notification.is_read && markAsRead(notification.id)}
                              className={`
                                relative flex flex-col gap-1.5 p-4 text-sm transition-all cursor-pointer
                                border-b border-gray-100 last:border-0
                                ${!notification.is_read ? "bg-gradient-to-t from-gray-300 via-gray-100/2 to-gray-50 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06)] border-t border-t-white" : "bg-white hover:bg-gray-50"}
                              `}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm ${!notification.is_read ? "font-bold text-gray-800 drop-shadow-[0_1px_0_rgba(255,255,255,1)]" : "font-medium text-gray-600"}`}>
                                  {notification.title}
                                </span>
                                {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-sm ring-1 ring-white" />}
                              </div>
                              <p className={`text-xs line-clamp-2 leading-relaxed ${!notification.is_read ? "text-gray-600" : "text-gray-500"}`}>
                                {notification.message}
                              </p>
                              <span className="text-[10px] text-gray-400 font-medium pt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                              </span>
                            </div>
                          ))}
                          {hasMore && (
                            <div className="py-4 flex justify-center">
                              {loadingMore ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <Button variant="ghost" size="sm" onClick={loadMore} className="text-xs text-gray-500 hover:text-gray-700">Muat lebih banyak</Button>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            {/* USER MENU DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-auto pl-0 pr-1 hover:bg-transparent rounded-full cursor-pointer">
                  <div className={`rounded-full p-[2.5px] ${isOnLeave ? 'bg-gradient-to-br from-amber-300 via-white to-amber-400 ring-2 ring-amber-100' : 'bg-gradient-to-br from-slate-300 via-white to-slate-400'} shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-300`}>
                    <Avatar className="h-9 w-9 border-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={currentUser.name} />}
                      <AvatarFallback className={`text-white text-xs ${isOnLeave ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-600 to-blue-500'}`}>
                        {currentUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-sm leading-none">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 font-normal leading-none">{currentUser.email}</p>
                    <span className="inline-flex mt-2 w-fit items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {activeRole === 'super_admin' ? 'Super Admin' : activeRole === 'admin_layanan' ? 'Admin Layanan' : activeRole === 'admin_penyedia' ? 'Admin Penyedia' : activeRole === 'teknisi' ? 'Teknisi' : 'Pegawai'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* [NEW] AVAILABILITY TOGGLE SECTION */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between space-x-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <div className="flex flex-col space-y-0.5">
                      <Label htmlFor="availability-mode" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-slate-500" /> 
                        Status Cuti
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        {isOnLeave ? "Anda sedang tidak menerima tiket." : "Anda siap menerima tiket."}
                      </span>
                    </div>
                    <Switch
                      id="availability-mode"
                      checked={isOnLeave}
                      onCheckedChange={handleToggleAvailability}
                      disabled={togglingStatus}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>
                
                {hasMultipleRoles && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRoleSwitchClick} className="cursor-pointer">
                      <RefreshCw className="mr-2 h-4 w-4" /> Ganti Peran
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* Global Dialogs */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-md:max-w-[90vw] rounded-3xl border border-white/40 bg-gradient-to-br from-white to-white/80 backdrop-blur-lg max-w-[400px] p-8">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold text-center text-gray-800">Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 text-base">
              Apakah Anda yakin ingin keluar dari sistem? <br /> Anda perlu login kembali untuk mengakses sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 sm:justify-center gap-3 flex flex-row flex-wrap">
            <AlertDialogCancel className="w-full sm:w-auto rounded-full border border-1 border-black-700 bg-gradient-to-b from-white to-gray-100 text-gray-700 hover:from-gray-50 hover:to-gray-200 hover:text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-200">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} className="w-full sm:w-auto rounded-full border border-red-500 bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-200">Ya, Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleSwitcherDialog open={showRoleSwitchDialog} onOpenChange={setShowRoleSwitchDialog} currentUser={currentUser} activeRole={activeRole as UserRole} onRoleSwitch={handleRoleSwitch} />
    </>
  );
};