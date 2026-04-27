import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Wrench,
  Timer,
  Calendar,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import type { User, Ticket } from "@/types";
import type { ViewType } from "@/components/main-layout";
import { Spinner } from "@/components/ui/spinner";

interface TeknisiDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
  onViewTicket: (ticketId: string) => void;
}


export const TeknisiDashboard: React.FC<TeknisiDashboardProps> = ({
  currentUser,
  onNavigate,
  onViewTicket,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await api.get<any>(
          "tickets?per_page=1000&type=perbaikan"
        );
        const ticketsData = response?.data || [];
        setTickets(ticketsData);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const myTickets = useMemo(() => {
    return tickets.filter((t: any) => {
      const assignedUserId = t.assignedTo || t.assigned_to;
      return t.type === "perbaikan" && String(assignedUserId) === String(currentUser.id);
    });
  }, [tickets, currentUser.id]);

  const activeQueue = useMemo(() => {
    const active = myTickets.filter((t: any) => 
      !["closed", "waiting_for_submitter", "rejected", "verified"].includes(t.status)
    );
    
    // Sort by priority (high to low) and then by creation date
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    
    return active.sort((a: any, b: any) => {
      const pA = priorityWeight[a.priority?.toLowerCase()] || 0;
      const pB = priorityWeight[b.priority?.toLowerCase()] || 0;
      if (pA !== pB) return pB - pA;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [myTickets]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: myTickets.length,
      active: activeQueue.length,
      completedToday: myTickets.filter((t: any) => 
        (t.status === "closed" || t.status === "verified") && 
        new Date(t.updated_at).toDateString() === today
      ).length,
      needsAttention: myTickets.filter((t: any) => t.status === "assigned" || t.status === "submitted").length,
    };
  }, [myTickets, activeQueue]);

  const incomingTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const dayTickets = myTickets.filter((t: any) => new Date(t.created_at).toDateString() === date.toDateString());
      last7Days.push({ date: dateStr, count: dayTickets.length });
    }
    return last7Days;
  }, [myTickets]);

  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <Badge className="bg-red-50 text-red-700 border-red-100 font-black text-[10px] rounded-lg">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[10px] rounded-lg">MEDIUM</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[10px] rounded-lg">LOW</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'in_progress') return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold rounded-lg uppercase">Sedang Dikerjakan</Badge>;
    if (s === 'on_hold') return <Badge className="bg-orange-50 text-orange-700 border-orange-100 text-[10px] font-bold rounded-lg uppercase">Pending Sparepart</Badge>;
    return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold rounded-lg uppercase">{s.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-blue-600" />
          <p className="text-slate-500 text-sm font-medium">Memuat Antrian Kerja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
              TEKNISI
            </Badge>
            <span className="text-slate-400 text-xs font-medium px-2 py-1 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-tight">
              {myTickets.length} Penugasan Total
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, {currentUser.name}!
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola perbaikan aset dan pantau antrian tugas harian Anda.
          </p>
        </div>
        
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
          <Button 
            variant="outline"
            onClick={() => onNavigate('tickets')}
            className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
          >
            Buka Semua Tiket
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-md"
            onClick={() => onNavigate('tickets')}
          >
            Update Progres
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tugas Aktif', value: stats.active, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Selesai Hari Ini', value: stats.completedToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Perlu Respon Segera', value: stats.needsAttention, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Selesai', value: stats.total - stats.active, icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shadow-sm`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{item.value}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue List */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                 <ClipboardList className="h-5 w-5 text-blue-600" />
                 Daftar Tugas Pending
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-500 uppercase">Prioritas & Waktu</Badge>
           </div>
           
           <div className="space-y-3">
              {activeQueue.length > 0 ? (
                activeQueue.map((ticket: any) => (
                  <Card key={ticket.id} className="border border-slate-200 shadow-sm bg-white rounded-2xl group hover:border-blue-200 transition-all cursor-pointer" onClick={() => onViewTicket(ticket.id)}>
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                           <div className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${ticket.priority === 'High' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-500'}`}>
                              <Wrench className="h-6 w-6" />
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-tight">#{ticket.ticket_id || ticket.id}</span>
                                 {getPriorityBadge(ticket.priority)}
                                 {getStatusBadge(ticket.status)}
                              </div>
                              <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{ticket.subject}</h4>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                                 <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                                 <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                 <span className="text-slate-300">•</span>
                                 <span className="text-indigo-500">{ticket.requester_name || 'User'}</span>
                              </div>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="hidden md:flex rounded-xl font-bold group-hover:bg-blue-50 group-hover:text-blue-600">
                           DETAIL
                           <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border border-slate-200 border-dashed bg-slate-50/50 rounded-2xl py-12 text-center">
                   <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                   <p className="text-sm font-bold text-slate-500">Semua tugas telah diselesaikan!</p>
                   <p className="text-xs text-slate-400 mt-1">Belum ada tiket baru yang ditugaskan ke Anda.</p>
                </Card>
              )}
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
           {/* Weekly Performance Bar Chart */}
           <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Trend Tugas Masuk</CardTitle>
                    <CardDescription className="text-[10px]">7 Hari Terakhir</CardDescription>
                 </div>
                 <Calendar className="h-4 w-4 text-slate-300" />
              </CardHeader>
              <CardContent className="p-6">
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={incomingTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                             dataKey="date" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                             dy={10}
                          />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20}>
                             {incomingTrend.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === incomingTrend.length - 1 ? '#3b82f6' : '#e2e8f0'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
           </Card>

           {/* Emergency Alerts / Reminders */}
           <Card className="bg-slate-900 border-none shadow-lg rounded-2xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <AlertTriangle className="h-24 w-24 -mr-8 -mt-8" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Perhatian
                 </div>
                 <h4 className="text-lg font-black leading-tight tracking-tight">
                    Utamakan Tiket <span className="text-amber-400">High Priority</span> untuk menjaga SLA perbaikan.
                 </h4>
                 <p className="text-xs text-slate-400 font-medium">
                    Pastikan status tiket selalu diperbarui minimal sekali dalam 24 jam.
                 </p>
                 <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl h-10">
                    LIHAT SLA TIAP TIKET
                 </Button>
              </div>
           </Card>

           {/* Quick Actions Card */}
           <Card className="border border-slate-200 border-dashed rounded-2xl p-5 bg-slate-50/50">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Shortcuts</h5>
              <div className="space-y-2">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Download Report Harian</span>
                    <ExternalLink className="h-3 w-3 text-slate-300" />
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Manajemen Alat Kerja</span>
                    <ExternalLink className="h-3 w-3 text-slate-300" />
                 </button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
