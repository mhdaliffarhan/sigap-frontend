import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  Shield,
  Users,
  Package,
  AlertCircle,
  ArrowRight,
  Settings,
  History,
  Activity,
  UserCheck,
  Database,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSuperAdminDashboard } from '@/hooks/use-super-admin-dashboard';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Spinner } from "@/components/ui/spinner";

interface SuperAdminDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const { stats, ticketsByType, usersByRole, recentActivities, loading, error } =
    useSuperAdminDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-indigo-600" />
          <p className="text-slate-500 text-sm font-medium">Memuat Sistem Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-red-500">
          <AlertCircle className="h-10 w-10 opacity-50" />
          <p className="font-bold text-slate-700">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
              SUPER ADMIN
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, {currentUser.name}!
          </h1>
          <p className="text-slate-500 text-sm">
            Manajemen user, jenis layanan, dan monitoring integritas data sistem.
          </p>
        </div>

        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
          <Button
            variant="outline"
            onClick={() => onNavigate('audit_logs' as any)}
            className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
          >
            Riwayat Audit
          </Button>
          <Button
            onClick={() => onNavigate('settings' as any)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 px-6 shadow-md"
          >
            <Settings className="mr-2 h-4 w-4" />
            Pengaturan
          </Button>
        </div>
      </div>

      {/* Management Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jumlah User', value: `${stats?.totalUsers ?? 0} Akun`, icon: Users, route: 'users' as ViewType, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Aset BMN', value: `${stats?.totalAssets ?? 0} Item`, icon: Package, route: 'bmn-assets' as ViewType, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Jenis Layanan', value: `${stats?.totalServiceCategories ?? 0} Tipe`, icon: Database, route: 'service-categories' as ViewType, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Jenis Role', value: `${stats?.totalRoles ?? 0} Role`, icon: Shield, route: 'roles' as ViewType, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className="border border-slate-200 shadow-sm bg-white rounded-2xl group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer overflow-hidden"
              onClick={() => onNavigate(item.route)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight truncate">{item.value}</h4>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics: Distributions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Distribution */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Jenis Layanan</CardTitle>
                  <Activity className="h-4 w-4 text-slate-300" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[240px] w-full">
                  {ticketsByType.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketsByType as any}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {ticketsByType.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 italic text-xs">
                      Belum ada data tersedia
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Role User</CardTitle>
                  <UserCheck className="h-4 w-4 text-slate-300" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usersByRole}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        interval={0}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={25}>
                        {usersByRole.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick System Settings / Actions */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-50/50 p-6 border-dashed">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Integritas Sistem Terjaga</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Seluruh parameter keamanan dan dependensi berjalan normal.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-white rounded-lg h-9 font-bold text-xs border-slate-200">
                  <Search className="h-3 w-3 mr-2" />
                  Database Check
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity Log */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-50 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Log Aktivitas</CardTitle>
              <CardDescription className="text-xs">10 interaksi sistem terbaru</CardDescription>
            </div>
            <History className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{log.action.replace('_', ' ')}</span>
                          <span className="text-[9px] font-bold text-slate-400">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate">{log.user_name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">{log.details}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-medium">Belum ada data aktivitas</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs font-black text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-lg h-9"
                onClick={() => onNavigate('audit_logs' as any)}
              >
                LIHAT SEMUA RIWAYAT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
