import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  TrendingUp,
  Package,
  Wrench,
  Video,
  ArrowUpRight,
  BarChart3,
  Timer,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { api } from '@/lib/api';
import { getTickets } from '@/lib/storage';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Spinner } from '@/components/ui/spinner';

interface DashboardStats {
  statistics: {
    total: number;
    perbaikan: { count: number; status: string };
    zoom: { count: number; status: string };
    closed: { count: number; percentage: number; description: string };
    avg_resolution_time?: number;
    top_categories?: Array<{ name: string; count: number }>;
  };
  trend: Array<{ date: string; perbaikan: number; zoom: number }>;
}

interface AdminLayananDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  onViewTicket: (ticketId: string) => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export const AdminLayananDashboard: React.FC<AdminLayananDashboardProps> = ({
  currentUser,
  onNavigate,
  onViewTicket,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const tickets = getTickets();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardStats>('/tickets/stats/admin-layanan-dashboard');
        setStats(response);
      } catch (err) {
        console.error('Failed to load admin layanan dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const last7DaysTrend = useMemo(() => {
    if (!stats || !stats.trend) return [];
    return stats.trend;
  }, [stats]);

  const recentPendingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'pending_review' || t.status === 'submitted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tickets]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-blue-600" />
          <p className="text-slate-500 text-sm font-medium">Memuat Analitik Dashboard...</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perbaikan': return Wrench;
      case 'zoom_meeting': return Video;
      default: return LayoutGrid;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
              ADMIN LAYANAN
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, {currentUser.name}!
          </h1>
          <p className="text-slate-500 text-sm">
            Monitor performa layanan, beban kerja teknisi, dan antrian tiket perbaikan.
          </p>
        </div>

        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
          <Button
            variant="outline"
            onClick={() => onNavigate('tickets')}
            className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
          >
            Semua Tiket
          </Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-md"
            onClick={() => onNavigate('tickets')}
          >
            Kelola Antrian
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tiket', value: stats.statistics.total, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Perbaikan', value: stats.statistics.perbaikan.count, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pending Zoom', value: stats.statistics.zoom.count, icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Waktu Selesai (Rata-rata)', value: `${stats.statistics.avg_resolution_time ?? 0}h`, icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Beban Kerja Saat Ini', value: `${stats.statistics.closed.percentage}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2 truncate">{item.label}</p>
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter">{item.value}</h4>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Tren Tiket Masuk</CardTitle>
                <CardDescription className="text-xs">Statistik harian 7 hari terakhir</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7DaysTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="perbaikan" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Perbaikan" />
                  <Line type="monotone" dataKey="zoom" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} name="Zoom" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Layanan Paling Sering</CardTitle>
                <CardDescription className="text-xs">Jenis Layanan paling sering diminta</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {stats.statistics.top_categories && stats.statistics.top_categories.length > 0 ? (
              <div className="space-y-5">
                <div className="h-[200px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.statistics.top_categories} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        width={100}
                      />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {stats.statistics.top_categories.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {stats.statistics.top_categories.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          {i + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{cat.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white text-slate-600 border-none font-bold text-[10px]">
                        {cat.count} Tiket
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Package className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-xs font-medium">Belum ada data kategori</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tickets Queue */}
        <Card className="lg:col-span-3 border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Antrian Tiket Pending</CardTitle>
              <CardDescription className="text-xs">Membutuhkan review admin layanan</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('tickets')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 rounded-lg"
            >
              Kelola Antrian
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentPendingTickets.length > 0 ? (
                recentPendingTickets.map((ticket) => {
                  const TypeIcon = getTypeIcon(ticket.type);
                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => onViewTicket(String(ticket.id))}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">#{ticket.ticketNumber}</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[8px] font-black px-1.5 py-0 rounded-md uppercase tracking-tight">
                              PENDING
                            </Badge>
                          </div>
                          <h5 className="font-bold text-sm text-slate-800 truncate">{ticket.title}</h5>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PENGIRIM</span>
                          <span className="text-xs font-bold text-slate-700">{ticket.userName || 'Pegawai'}</span>
                        </div>
                        <div className="hidden md:flex flex-col items-end w-24">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TANGGAL</span>
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(ticket.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-slate-600">Antrian Bersih!</p>
                  <p className="text-xs mt-1">Tidak ada tiket yang menunggu review Anda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};