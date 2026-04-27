import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  ArrowRight,
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { UserOnboarding } from '@/components/views/shared';
import type { User, Ticket } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Badge } from '@/components/ui/badge';

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
  onViewTicket: (ticketId: string) => void;
}
export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onNavigate, onViewTicket }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load Stats
        const statsResponse = await api.get<{ success: boolean; stats: DashboardStats }>(
          'tickets/stats/dashboard?scope=my'
        );
        if (statsResponse.success && statsResponse.stats) {
          setStats(statsResponse.stats);
        }

        // Load Active Tickets (not completed/rejected)
        const ticketsResponse = await api.get<{ data: Ticket[] }>(
          'tickets?scope=my&status=submitted,assigned,in_progress,on_hold,waiting_for_submitter'
        );
        if (ticketsResponse.data) {
          setActiveTickets(ticketsResponse.data.slice(0, 5)); // Only show top 5
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      submitted: { label: "Diajukan", color: "bg-blue-50 text-blue-700 border-blue-100" },
      assigned: { label: "Disposisi", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
      in_progress: { label: "Proses", color: "bg-orange-50 text-orange-700 border-orange-100" },
      on_hold: { label: "Menunggu", color: "bg-amber-50 text-amber-700 border-amber-100" },
      waiting_for_submitter: { label: "Konfirmasi", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
      closed: { label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    };
    const config = statusMap[status] || { label: status, color: "bg-slate-50 text-slate-700 border-slate-100" };
    return (
      <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shadow-none capitalize ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <UserOnboarding open={showOnboarding} onComplete={handleCompleteOnboarding} />

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* HEADER SECTION */}
        <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Selamat Datang, {currentUser.name}!
            </h1>
            <p className="text-slate-500 text-sm">
              Pantau status pengajuan layanan dan buat tiket baru dengan mudah.
            </p>
          </div>

          <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
            <Button
              onClick={() => onNavigate('services')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6 shadow-md transition-all hover:-translate-y-0.5"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Tiket Baru
            </Button>
          </div>
        </div>

        {/* Stats Grid - Unified Slate Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tiket', value: stats?.total ?? 0, icon: TicketIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Sedang Proses', value: stats?.in_progress ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Tiket Selesai', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Tingkat Solusi', value: `${(stats?.completion_rate ?? 0).toFixed(0)}%`, icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl group hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{item.label}</p>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{loading ? '...' : item.value}</h4>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="font-bold text-slate-800 tracking-tight">Tiket Aktif</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('tickets')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-0 h-8 rounded-lg"
              >
                Lihat Semua
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                ))
              ) : activeTickets.length > 0 ? (
                activeTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Card
                      className="border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group overflow-hidden rounded-2xl"
                      onClick={() => onViewTicket(String(ticket.id))}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <TicketIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">#{(ticket as any).ticket_number || ticket.ticketNumber}</span>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 truncate pr-4">{ticket.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="border border-slate-200 border-dashed bg-slate-50/30 rounded-2xl p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-600">Tidak Ada Tiket Aktif</p>
                      <p className="text-xs text-slate-400 mt-1">Semua pengajuan Anda telah selesai diproses.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Quick Info / Catalog Shortcut */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 tracking-tight px-1">Layanan SIGAP</h3>
            <Card
              className="border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white group overflow-hidden rounded-2xl relative"
              onClick={() => onNavigate('services')}
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <LayoutGrid className="h-32 w-32" />
              </div>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Katalog Layanan</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  Pilih dan ajukan berbagai layanan operasional kantor dalam satu platform.
                </p>
                <div className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                  Lihat Katalog
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 border-dashed">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Butuh Bantuan?</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hubungi IT Support via Helpdesk (Internal 1234).</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};