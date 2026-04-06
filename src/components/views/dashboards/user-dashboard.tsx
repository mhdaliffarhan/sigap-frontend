import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutGrid,
  ArrowRight,
  IdCardLanyard,
  Loader,
  Sparkles,
} from 'lucide-react'; 
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { getActiveRole } from '@/lib/storage';
import { UserOnboarding } from '@/components/views/shared';
import type { User, UserRole } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface DashboardStats {
  total: number;
  in_progress: number;
  completed: number;
  rejected: number;
  completion_rate: number;
  perbaikan: number;
  zoom: number;
}

interface UserDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_layanan: 'Admin Layanan',
  admin_penyedia: 'Admin Penyedia',
  teknisi: 'Teknisi',
  pegawai: 'Pegawai',
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onNavigate }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const activeRole = (getActiveRole(currentUser.id) || currentUser.role) as UserRole;

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; stats: DashboardStats }>(
          'tickets/stats/dashboard?scope=my'
        );
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem(`onboarding_seen_${currentUser.id}`);

    if (!hasSeenOnboarding && stats && stats.total === 0) {
      setShowOnboarding(true);
    }
  }, [currentUser.id, stats]);

  const handleCompleteOnboarding = () => {
    sessionStorage.setItem(`onboarding_seen_${currentUser.id}`, 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      <UserOnboarding open={showOnboarding} onComplete={handleCompleteOnboarding} />

      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white border border-white/20 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Dashboard Pegawai
                </span>
              </div>
              <h1 className="max-md:text-2xl text-4xl mb-2 font-bold tracking-tight">
                Selamat Datang, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-blue-100 max-md:text-sm md:text-lg opacity-90">
                {currentUser.unitKerja} • {roleLabels[activeRole] || 'Pegawai'}
              </p>
            </div>

            <div className="shrink-0">
              <div className="h-24 w-24 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl">
                <IdCardLanyard className="h-14 w-14 text-white/50" />
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-blue-300/30" />

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-1 md:col-span-4 flex items-center justify-center py-4">
                <Loader className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : stats ? (
              <>
                <div className="text-center group">
                  <p className="text-blue-100/70 text-sm font-medium mb-1 group-hover:text-white transition-colors">Total Tiket</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="text-center group border-l border-white/10">
                  <p className="text-blue-100/70 text-sm font-medium mb-1 group-hover:text-white transition-colors">Sedang Proses</p>
                  <p className="text-3xl font-bold">{stats.in_progress}</p>
                </div>
                <div className="text-center group border-l border-white/10">
                  <p className="text-blue-100/70 text-sm font-medium mb-1 group-hover:text-white transition-colors">Selesai</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="text-center group border-l border-white/10">
                  <p className="text-blue-100/70 text-sm font-medium mb-1 group-hover:text-white transition-colors">Completion Rate</p>
                  <p className="text-3xl font-bold">{stats.completion_rate.toFixed(0)}%</p>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card
              className="!cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white"
              onClick={() => onNavigate('services')}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <LayoutGrid className="h-40 w-40" />
              </div>
              
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <LayoutGrid className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Katalog Layanan</h3>
                  <p className="text-slate-500 text-lg max-w-md leading-relaxed">
                    Pilih dan ajukan layanan yang Anda butuhkan, mulai dari perbaikan barang, booking zoom, hingga permintaan fasilitas lainnya.
                  </p>
                </div>
                
                <div className="mt-10">
                  <Button
                    className="
                      rounded-full px-8 py-6 text-lg font-semibold
                      bg-blue-600 hover:bg-blue-700 text-white
                      shadow-lg shadow-blue-200
                      group/btn transition-all duration-300
                    "
                  >
                    Buka Katalog
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Secondary Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-[2.5rem] border-none shadow-lg h-full bg-slate-50/50 flex flex-col justify-center p-8 text-center border-dashed border-2 border-slate-200">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200/50 flex items-center justify-center">
                  <LayoutGrid className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Butuh Bantuan?</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Semua layanan kini terintegrasi di satu tempat untuk memudahkan Anda.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};