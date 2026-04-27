import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Key as KeyIcon, CheckCircle, Eye, EyeOff, Loader2, Mail, Phone, ShieldCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { api, API_BASE_URL } from '@/lib/api';
import type { User } from '@/types';

interface ProfileSettingsProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    nip: currentUser.nip,
    jabatan: currentUser.jabatan,
    email: currentUser.email,
    phone: currentUser.phone,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const avatarUrl = React.useMemo(() => {
    if (!currentUser.avatar) return null;
    if (currentUser.avatar.startsWith('http')) return currentUser.avatar;
    const rawPath = currentUser.avatar.replace(/^\/?/, '');
    const cleanPath = rawPath.startsWith('storage/') ? rawPath : `storage/${rawPath}`;
    const fileBase = (API_BASE_URL || '').replace(/\/api$/i, '');
    return fileBase ? `${fileBase}/${cleanPath}` : `/${cleanPath}`;
  }, [currentUser.avatar]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const response = await api.put<{ message: string; user: User }>('/profile', profileData);

      if (response && response.user) {
        onUserUpdate(response.user);
        toast.success('Profil berhasil diperbarui');
        sessionStorage.setItem('bps_current_user', JSON.stringify(response.user));
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error?.body?.message || 'Gagal memperbarui profil';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    return Object.values(requirements).every(req => req);
  };

  const handleChangePassword = async () => {
    if (!validatePassword(passwordData.newPassword)) {
      toast.error('Password baru tidak memenuhi persyaratan keamanan');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('Password baru harus berbeda dengan password lama');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post('/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });

      toast.success('Password berhasil diubah');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const message = error?.body?.message || error?.body?.errors?.current_password?.[0] || 'Gagal mengubah password';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrator',
      admin_layanan: 'Admin Layanan',
      admin_penyedia: 'Admin Penyedia',
      teknisi: 'Teknisi',
      pegawai: 'Pegawai',
      user: 'Pegawai',
    };
    return labels[role] || role;
  };

  const userRoles = React.useMemo(() => {
    const roles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : [currentUser.role];
    const unique = Array.from(new Set(roles.filter(Boolean)));
    return unique.length > 0 ? unique : ['pegawai'];
  }, [currentUser.roles, currentUser.role]);

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Mengandung huruf besar dan kecil', test: (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
    { label: 'Mengandung angka', test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: 'Mengandung karakter khusus (!@#$%^&*)', test: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header - Standardized with Dashboard */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profil Pengguna</h1>
          <p className="text-slate-500 text-sm font-medium">
            Kelola informasi data diri, keamanan akun, dan preferensi profil Anda.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200" />
            <CardContent className="px-6 pb-6 -mt-12">
              <div className="flex flex-col items-center text-center">
                {/* Avatar Display - Fixed "Gepeng" issue */}
                <div className="relative mb-6">
                  <div className="h-32 w-32 rounded-full p-1 bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center transition-all duration-300">
                    {avatarUrl ? (
                      <div className="h-28 w-28 rounded-full overflow-hidden shrink-0 border-0">
                        <img src={avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-slate-900 text-white flex items-center justify-center text-4xl font-black shrink-0 leading-none">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Role */}
                <div className="space-y-1 w-full mb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentUser.name}</h2>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] tracking-wide px-3 uppercase">
                    {currentUser.unitKerja}
                  </Badge>
                </div>

                <div className="w-full h-px bg-slate-100 mb-6" />

                {/* Contact Info */}
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIP / Identitas</p>
                      <p className="font-bold text-sm text-slate-700">{currentUser.nip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Official</p>
                      <p className="font-bold text-sm text-slate-700">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp / Telepon</p>
                      <p className="font-bold text-sm text-slate-700">{currentUser.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Content */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              {/* Toggle Buttons - Premium Segmented Style */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                <button
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'profile'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <UserIcon className="h-4 w-4" />
                  Data Profil
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'password'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                  onClick={() => setActiveTab('password')}
                >
                  <KeyIcon className="h-4 w-4" />
                  Ubah Password
                </button>
              </div>

              {/* Data Profil Content */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="rounded-xl border-slate-200 focus:ring-blue-100 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nip" className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIP *</Label>
                      <Input
                        id="nip"
                        value={profileData.nip}
                        onChange={(e) => setProfileData({ ...profileData, nip: e.target.value })}
                        placeholder="18 digit NIP"
                        maxLength={18}
                        className="rounded-xl border-slate-200 focus:ring-blue-100 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jabatan" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan *</Label>
                      <Input
                        id="jabatan"
                        value={profileData.jabatan}
                        onChange={(e) => setProfileData({ ...profileData, jabatan: e.target.value })}
                        className="rounded-xl border-slate-200 focus:ring-blue-100 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="rounded-xl border-slate-200 focus:ring-blue-100 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Telepon *</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="rounded-xl border-slate-200 focus:ring-blue-100 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitKerja" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Kerja *</Label>
                      <Input
                        id="unitKerja"
                        value={currentUser.unitKerja}
                        disabled
                        className="rounded-xl border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed h-11 italic"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hak Akses / Role</Label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {userRoles.map(role => (
                          <Badge key={role} className="bg-white text-slate-700 border border-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" />
                        Hubungi Super Admin untuk penyesuaian hak akses sistem.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-8 shadow-md transition-all hover:scale-[1.02]"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Ubah Password Content */}
              {activeTab === 'password' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Saat Ini *</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          placeholder="Masukkan password saat ini"
                          className="rounded-xl border-slate-200 focus:ring-blue-100 h-11 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Baru *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          placeholder="Min. 8 karakter, huruf & angka"
                          className="rounded-xl border-slate-200 focus:ring-blue-100 h-11 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Password Baru *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          placeholder="Ulangi password baru"
                          className="rounded-xl border-slate-200 focus:ring-blue-100 h-11 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordData.confirmPassword &&
                        passwordData.newPassword !== passwordData.confirmPassword && (
                          <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-1">
                            <X className="h-3 w-3" />
                            Konfirmasi password tidak cocok
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Keamanan Password:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      {passwordRequirements.map((req, idx) => {
                        const isMet = passwordData.newPassword && req.test(passwordData.newPassword);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${isMet ? 'bg-green-100' : 'bg-slate-200/50'
                              }`}>
                              <CheckCircle className={`h-3 w-3 ${isMet ? 'text-green-600' : 'text-slate-400'}`} />
                            </div>
                            <span className={`text-[11px] font-bold transition-colors ${isMet ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }
                      className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                    >
                      Reset Form
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isUpdating}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-8 shadow-md"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Ubah Password
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
