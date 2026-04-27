import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Package,
  FolderKanban,
  ArrowUpRight,
  Wrench,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Spinner } from '@/components/ui/spinner';

interface AdminPenyediaDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

interface DashboardStats {
  total: number;
  byStatus: {
    requested: number;
    in_procurement: number;
    completed: number;
    unsuccessful: number;
  };
  byType: {
    sparepart: number;
    vendor: number;
    license: number;
  };
  recentWorkOrders: Array<{
    id: string;
    type: string;
    status: string;
    ticketNumber: string;
    ticketTitle: string;
    createdAt: string;
  }>;
}

export const AdminPenyediaDashboard: React.FC<AdminPenyediaDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<any>('/work-orders/stats/summary');
        // Transform response
        setStats({
          total: response.data?.total || 0,
          byStatus: response.data?.by_status || { requested: 0, in_procurement: 0, completed: 0, unsuccessful: 0 },
          byType: response.data?.by_type || { sparepart: 0, vendor: 0, license: 0 },
          recentWorkOrders: response.data?.recent || [],
        });
      } catch (err) {
        console.error('Failed to load admin penyedia dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            Admin Penyedia Dashboard
          </h1>
          <div className="flex flex-row gap-4">
            <p className="text-black-500 mt-1">Memuat data dashboard...</p>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sparepart': return Package;
      case 'vendor': return Wrench;
      case 'license': return FolderKanban;
      default: return Package;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sparepart': return 'Sparepart';
      case 'vendor': return 'Vendor';
      case 'license': return 'Lisensi';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
              ADMIN PENYEDIA
            </Badge>
            <span className="text-slate-400 text-xs font-medium px-2 py-1 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-tight">
              Procurement Control
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, {currentUser.name}!
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola work order dan pengadaan aset dari teknisi secara efisien.
          </p>
        </div>
        
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
          <Button 
            variant="outline"
            onClick={() => onNavigate('work-orders')}
            className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
          >
            Semua Work Order
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-md"
            onClick={() => onNavigate('work-orders')}
          >
            Monitor Pengadaan
          </Button>
        </div>
      </div>

      {/* Stats Grid - Unified Slate Style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total WO', value: stats?.total ?? 0, description: 'Semua work order', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Requested', value: stats?.byStatus.requested ?? 0, description: 'Menunggu proses', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Procurement', value: stats?.byStatus.in_procurement ?? 0, description: 'Dalam pengadaan', icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Selesai', value: stats?.byStatus.completed ?? 0, description: 'Berhasil tuntas', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Gagal', value: stats?.byStatus.unsuccessful ?? 0, description: 'Tidak berhasil', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all h-full">
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center gap-2">
                   <div className={`h-12 w-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.value}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Work Order by Type - simple cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sparepart</p>
                  <p className="text-4xl font-bold">{stats?.byType.sparepart || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order sparepart</p>
                </div>
                <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vendor</p>
                  <p className="text-4xl font-bold">{stats?.byType.vendor || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order vendor</p>
                </div>
                <div className="h-14 w-14 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-7 w-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lisensi</p>
                  <p className="text-4xl font-bold">{stats?.byType.license || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order lisensi</p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Work Orders */}
      <Card className="pb-6">
        <CardHeader>
          <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
            <div>
              <CardTitle>Work Order Terbaru</CardTitle>
              <CardDescription>
                Menampilkan 5 work order terbaru • {stats?.byStatus.requested || 0} work order menunggu diproses
              </CardDescription>
            </div>
            <Button
              onClick={() => onNavigate('work-orders')}
              className="
    relative overflow-hidden rounded-full 
    bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
    text-white 
    border-2 border-blue-300/50
    shadow-[inset_0px_4px_8px_rgba(255,255,255,0.4),inset_0px_-4px_8px_rgba(0,0,0,0.2),0px_4px_10px_rgba(59,130,246,0.5)]
    hover:brightness-110 transition-all duration-300
    group px-6 max-md:w-full
  "
            >
              {/* Efek Kilau Putih (Soap Shine Overlay) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-80 pointer-events-none" />

              {/* Kilau kecil tambahan di pojok */}
              <div className="absolute top-1 right-4 w-4 h-2 bg-white/40 blur-sm rounded-full pointer-events-none" />

              <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm font-semibold">
                Lihat Semua
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentWorkOrders && stats.recentWorkOrders.length > 0 ? (
            <div className="space-y-2">
              {stats.recentWorkOrders.slice(0, 5).map((wo, index) => {
                const TypeIcon = getTypeIcon(wo.type);

                return (
                  <motion.div
                    key={wo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TypeIcon className="h-5 w-5 text-black-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {getTypeLabel(wo.type)} - {wo.ticketTitle || wo.ticketNumber}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-black-500 mt-1">
                        <span className="font-mono text-black-700">{wo.ticketNumber}</span>
                        <span>•</span>
                        <span>{new Date(wo.createdAt).toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <span className="font-medium text-black-700">
                          {wo.status === 'requested' ? 'Requested' :
                            wo.status === 'in_procurement' ? 'In Procurement' :
                              wo.status === 'completed' ? 'Completed' : 'Unsuccessful'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-black-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-black-400" />
              <p className="text-lg">Belum ada work order!</p>
              <p className="text-sm mt-1">Work order dari teknisi akan muncul di sini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};