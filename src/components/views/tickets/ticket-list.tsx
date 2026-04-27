import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Wrench,
  Video,
  AlertCircle,
  RotateCw,
  User as UserIcon,
  Calendar,
  Info,
  Download,
  Layout,
  Layers,
  List,
  Eye,
  Filter,
  Ticket as TicketIcon
} from "lucide-react";
import { motion } from "motion/react";
import { api, resolveApiUrl } from "@/lib/api";
import { StatusInfoDialog } from "./status-info-dialog";
import { toast } from "sonner";
import type { User, Ticket, UserRole } from "@/types";

interface TicketListProps {
  currentUser: User;
  activeRole: UserRole;
  viewMode: "all" | "my-tickets";
  onViewTicket: (ticketId: string) => void;
}

interface TicketStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  completed: number;
  rejected: number;
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  has_more: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  onViewTicket,
  currentUser,
  activeRole,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<"card" | "table">(() => 
    typeof window !== 'undefined' && window.innerWidth >= 768 ? "table" : "card"
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Role effective mengikuti activeRole (bukan sekadar daftar roles)
  const effectiveRole = activeRole || currentUser.role;
  const isAdmin =
    effectiveRole === "admin_layanan" || effectiveRole === "super_admin";
  const isTeknisi = effectiveRole === "teknisi";
  const isAdminPenyedia = effectiveRole === "admin_penyedia";
  const isPegawai = effectiveRole === "pegawai";

  // Untuk multi-role users, tentukan scope berdasarkan activeRole saat ini
  // Bukan berdasarkan "only" logic karena bisa punya multiple roles

  // Reset filterStatus ketika filterType berubah
  useEffect(() => {
    setFilterStatus("all");
  }, [filterType]);

  // Load statistics on mount and when filter type changes
  useEffect(() => {
    loadStats();
  }, [filterType, effectiveRole]);

  // Load tickets when filters change
  useEffect(() => {
    loadTickets(1);
  }, [filterStatus, searchTerm, filterType, effectiveRole]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const query: string[] = [];
      // Admin view hanya untuk super_admin/admin_layanan
      if (isAdmin) {
        query.push("admin_view=true");
      } else if (isAdminPenyedia) {
        // Admin penyedia: semua tiket perbaikan
        query.push("scope=perbaikan_tickets");
      } else if (isPegawai) {
        query.push("scope=my");
      } else if (isTeknisi) {
        query.push("scope=assigned");
      }
      if (!isAdminPenyedia && filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      const response = await api.get<any>(`tickets-counts?${query.join("&")}`);
      const statsData = response.counts || response;

      setStats({
        total: statsData.total || 0,
        pending: statsData.submitted || statsData.pending || 0,
        in_progress: statsData.in_progress || statsData.processing || 0,
        approved: statsData.approved || 0,
        completed: statsData.closed || statsData.completed || 0,
        rejected: statsData.rejected || 0,
      });
    } catch (err) {
      console.error("Failed to load ticket stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTickets = async (page: number = 1) => {
    setLoading(true);
    try {
      const query = [];
      query.push(`page=${page}`);
      query.push(`per_page=15`);

      // Add scope for role-based filtering
      if (isAdminPenyedia) {
        query.push("scope=perbaikan_tickets");
      } else if (isPegawai) {
        query.push("scope=my");
      } else if (isTeknisi) {
        query.push("scope=assigned");
      } else if (isAdmin) {
        query.push("admin_view=true");
      }

      // Add search parameter
      if (searchTerm) {
        query.push(`search=${encodeURIComponent(searchTerm)}`);
      }

      // Add type filter - only for non-admin-penyedia
      if (!isAdminPenyedia && filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      // Add status filter - map filters to actual status values based on type
      if (filterStatus !== "all") {
        if (isAdminPenyedia) {
          // Admin penyedia: perbaikan only
          if (filterStatus === "submitted") {
            query.push(`status=submitted`);
          } else if (filterStatus === "on_hold") {
            query.push(`status=on_hold`);
          } else if (filterStatus === "closed") {
            query.push(`status=closed`);
          }
        } else if (filterType === "perbaikan") {
          // Perbaikan: submitted, assigned, in_progress, on_hold, closed
          query.push(`status=${filterStatus}`);
        } else if (filterType === "zoom_meeting") {
          // Zoom: pending_review, approved, rejected, closed
          query.push(`status=${filterStatus}`);
        } else {
          query.push(`status=${filterStatus}`);
        }
      }

      const url = `tickets?${query.join("&")}`;
      const res: any = await api.get(url);

      let data = Array.isArray(res) ? res : res?.data || [];
      const responseMeta = res?.meta || res;

      // Backend already handles filtering via scope parameter
      setTickets(data);
      setPagination({
        total: responseMeta.total || data.length,
        per_page: responseMeta.per_page || 15,
        current_page: responseMeta.current_page || page,
        last_page: responseMeta.last_page || 1,
        from: responseMeta.from || (page - 1) * 15 + 1,
        to:
          responseMeta.to ||
          Math.min(page * 15, responseMeta.total || data.length),
        has_more:
          responseMeta.has_more !== undefined
            ? responseMeta.has_more
            : responseMeta.current_page < responseMeta.last_page,
      });
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (!pagination || pagination.current_page <= 1) return;
    loadTickets(pagination.current_page - 1);
  };

  const handleNextPage = () => {
    if (!pagination || !pagination.has_more) return;
    loadTickets(pagination.current_page + 1);
  };

  const handleRefreshData = async () => {
    await loadStats();
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      submitted: { label: 'Pending', className: 'bg-slate-50 text-slate-700 border-slate-200' },
      assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      in_progress: { label: 'Diproses', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      on_hold: { label: 'On Hold', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      closed: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
      pending_review: { label: 'Pending Review', className: 'bg-slate-50 text-slate-700 border-slate-200' },
      approved: { label: 'Disetujui', className: 'bg-green-50 text-green-700 border-green-200' },
      rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
      waiting_for_submitter: { label: 'Butuh Info', className: 'bg-orange-50 text-orange-700 border-orange-200' }
    };

    const config = configs[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' };

    return (
      <Badge variant="outline" className={`${config.className} pb-0.5 text-xs font-medium rounded-full border`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "perbaikan":
        return Wrench;
      case "zoom_meeting":
        return Video;
      default:
        return AlertCircle;
    }
  };

  // Export ke Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(resolveApiUrl("/tickets/export/all"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan_tiket_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Berhasil mengunduh laporan tiket");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengunduh laporan");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      perbaikan: "Perbaikan",
      zoom_meeting: "Zoom Meeting",
      "peminjaman-ruanganaula": "Peminjaman Ruangan",
    };
    if (labels[type]) return labels[type];
    return type.split(/[-_]/).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      perbaikan: "bg-orange-50 text-orange-800 border-orange-200",
      zoom_meeting: "bg-purple-50 text-purple-800 border-purple-200",
      "peminjaman-ruanganaula": "bg-blue-50 text-blue-800 border-blue-200",
    };
    return colors[type] || "bg-slate-50 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - Clean Standard */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-wider">
              <TicketIcon className="h-3 w-3 mr-1.5 inline" /> 
              MANAJEMEN TIKET
            </Badge>
            {isAdmin && <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold px-3 py-1 rounded-xl">ADMIN</Badge>}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kelola Semua Tiket</h1>
          <p className="text-slate-500 text-sm font-medium">
            {isAdminPenyedia
              ? "Tinjau dan kelola seluruh tiket perbaikan dari semua departemen."
              : "Review, pantau, dan kelola seluruh tiket pengajuan layanan dari pengguna."}
          </p>
        </div>
        
        {/* Export Button Integration */}
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col">
          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-md transition-all hover:-translate-y-0.5"
          >
            {exporting ? (
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Ekspor Laporan (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Controls - Grid 12-Kolom Standard */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl gap-0">
        <CardContent className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search - 7 Columns */}
            <div className="relative lg:col-span-7 w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all h-4 w-4 z-10" />
                <Input
                    placeholder="Cari tiket, nomor, atau pengaju..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 text-sm w-full bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl transition-all font-medium shadow-none"
                />
            </div>

            {/* Filters - 5 Columns */}
            <div className="lg:col-span-5 flex items-center gap-3 w-full">
                {/* Admin Penyedia - Status Filter only */}
                {isAdminPenyedia ? (
                  <div className="flex-1">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 px-4 text-sm border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all font-bold text-slate-700 shadow-none">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="all">
                            Semua Perbaikan ({statsLoading ? "..." : stats.total})
                        </SelectItem>
                        <SelectItem value="submitted">
                            Pending ({statsLoading ? "..." : stats.pending})
                        </SelectItem>
                        <SelectItem value="on_hold">
                            On Hold ({statsLoading ? "..." : stats.in_progress})
                        </SelectItem>
                        <SelectItem value="closed">
                            Closed ({statsLoading ? "..." : stats.completed})
                        </SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-10 px-4 text-sm border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all font-bold text-slate-700 shadow-none">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                    <SelectValue placeholder="Tipe" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="perbaikan">Perbaikan</SelectItem>
                                <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-10 px-4 text-sm border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all font-bold text-slate-700 shadow-none">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-slate-400" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                {filterType === "perbaikan" ? (
                                <>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="waiting_for_submitter">
                                    Waiting for Submitter
                                    </SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </>
                                ) : filterType === "zoom_meeting" ? (
                                <>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="pending_review">
                                    Pending Review
                                    </SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </>
                                ) : (
                                <>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="submitted">Pending</SelectItem>
                                    <SelectItem value="in_progress">Diproses</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="closed">Selesai</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                  </>
                )}

                {/* Switcher & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-slate-100/50 p-1 rounded-xl flex border border-slate-200">
                        <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => setDisplayMode("table")}
                            className={`h-8 px-3 rounded-lg transition-all ${displayMode === "table" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <Layout className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => setDisplayMode("card")}
                            className={`h-8 px-3 rounded-lg transition-all ${displayMode === "card" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <List className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRefreshData} 
                        className="h-10 w-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all hidden sm:flex"
                    >
                        <RotateCw className={`h-4 w-4 ${loading || statsLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setShowStatusInfo(true)}
                        className="h-10 w-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all hidden sm:flex"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List Area */}
        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">Tidak ada tiket</p>
              <p className="text-sm text-center">
                Belum ada tiket yang sesuai dengan filter
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tickets.map((ticket, index) => {
                    const TypeIcon = getTypeIcon(ticket.type);
                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card 
                          className="border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer bg-white group overflow-hidden rounded-2xl h-full"
                          onClick={() => onViewTicket(String(ticket.id))}
                        >
                          <div className="p-5 flex flex-col justify-between gap-4 h-full">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className={`${getTypeColor(ticket.type)} text-[9px] font-black px-2.5 py-0.5 rounded-lg border shadow-none w-fit`}>
                                    <TypeIcon className="w-3 h-3 mr-1 inline-block" />
                                    {getTypeLabel(ticket.type)}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                                    #{(ticket as any).ticket_number || ticket.ticketNumber}
                                  </span>
                                </div>
                                {getStatusBadge(ticket.status)}
                              </div>
                              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                {ticket.title}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                  <UserIcon className="h-3 w-3" />
                                  <span className="line-clamp-1 italic">{(ticket as any).user?.name || ticket.userName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate((ticket as any).created_at || ticket.createdAt)}
                                </div>
                              </div>
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white rounded-xl">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-b border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[60px] font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center">No</TableHead>
                            <TableHead className="w-[140px] font-bold text-[11px] uppercase tracking-wider text-slate-500 pl-4 border-l border-slate-100/50">No. Tiket</TableHead>
                            <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Informasi Tiket</TableHead>
                            <TableHead className="w-[200px] font-bold text-[11px] uppercase tracking-wider text-slate-500">Tipe & Status</TableHead>
                            <TableHead className="w-[80px] text-right pr-6"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket, index) => {
                            const TypeIcon = getTypeIcon(ticket.type);
                            const rowNumber = (pagination?.from || 1) + index;
                            return (
                              <TableRow 
                                key={ticket.id} 
                                className="group border-b border-slate-50 cursor-pointer hover:bg-blue-50/30 transition-colors"
                                onClick={() => onViewTicket(String(ticket.id))}
                              >
                                <TableCell className="text-center font-medium text-slate-400 text-xs border-r border-slate-50">
                                  {rowNumber}
                                </TableCell>
                                <TableCell className="pl-4 font-mono text-[10px] font-bold text-slate-500 tracking-tighter">
                                  {(ticket as any).ticket_number || ticket.ticketNumber}
                                </TableCell>
                                <TableCell>
                                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ticket.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <UserIcon className="h-3 w-3 text-slate-400" />
                                      <span>{(ticket as any).user?.name || ticket.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      <span>{formatDate((ticket as any).created_at || ticket.createdAt)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col items-start gap-1.5">
                                    <Badge variant="outline" className={`${getTypeColor(ticket.type)} text-[9px] font-black px-2 py-0 rounded-lg shadow-none`}>
                                      <TypeIcon className="w-3 h-3 mr-1 inline-block" />
                                      {getTypeLabel(ticket.type)}
                                    </Badge>
                                    {getStatusBadge(ticket.status)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-all rounded-lg shadow-sm"
                                    onClick={(e) => { e.stopPropagation(); onViewTicket(String(ticket.id)); }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {pagination && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 border-t border-slate-100 rounded-b-xl">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data Stats</p>
                          <p className="text-xs font-bold text-slate-600">
                            Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} data
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={pagination.current_page === 1} className="h-8 px-3 rounded-lg border-slate-200 font-bold text-[10px] uppercase bg-white">
                            Sebelumnya
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.last_page }).map((_, i) => (
                              (i + 1 === 1 || i + 1 === pagination.last_page || (i + 1 >= pagination.current_page - 1 && i + 1 <= pagination.current_page + 1)) ? (
                                <Button
                                  key={i}
                                  variant={pagination.current_page === i + 1 ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => loadTickets(i + 1)}
                                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${pagination.current_page === i + 1 ? 'bg-blue-600 shadow-md' : 'bg-white border-slate-200'}`}
                                >
                                  {i + 1}
                                </Button>
                              ) : (i + 1 === 2 || i + 1 === pagination.last_page - 1) ? <span key={i} className="text-slate-300">...</span> : null
                            ))}
                          </div>
                          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!pagination.has_more} className="h-8 px-3 rounded-lg border-slate-200 font-bold text-[10px] uppercase bg-white">
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          )}
        </div>

        {/* Unified Pagination for Cards */}
        {displayMode === "card" && tickets.length > 0 && pagination && (
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50">
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data Stats</p>
                <p className="text-xs font-bold text-slate-600">
                  Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} kartu
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={pagination.current_page === 1} className="h-8 px-3 rounded-lg border-slate-200 font-bold text-[10px] uppercase bg-white">
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.last_page }).map((_, i) => (
                    (i + 1 === 1 || i + 1 === pagination.last_page || (i + 1 >= pagination.current_page - 1 && i + 1 <= pagination.current_page + 1)) ? (
                      <Button
                        key={i}
                        variant={pagination.current_page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => loadTickets(i + 1)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${pagination.current_page === i + 1 ? 'bg-blue-600 shadow-md' : 'bg-white border-slate-200'}`}
                      >
                        {i + 1}
                      </Button>
                    ) : (i + 1 === 2 || i + 1 === pagination.last_page - 1) ? <span key={i} className="text-slate-300">...</span> : null
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!pagination.has_more} className="h-8 px-3 rounded-lg border-slate-200 font-bold text-[10px] uppercase bg-white">
                  Berikutnya
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Status Info Dialog */}
        <StatusInfoDialog
          open={showStatusInfo}
          onOpenChange={setShowStatusInfo}
        />
      </div>
    );
  };
