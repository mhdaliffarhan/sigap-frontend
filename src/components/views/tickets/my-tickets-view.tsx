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
  AlertCircle,
  Search,
  RotateCw,
  Calendar,
  Info,
  Ticket as TicketIcon,
  ChevronRight,
  Filter,
  LayoutGrid,
  Clock,
  CheckCircle2,
  Sparkles,
  Send,
  List,
  Layout
} from "lucide-react";
import type { Ticket, User } from "@/types";
import { api } from "@/lib/api";
import { StatusInfoDialog } from "./status-info-dialog";

interface MyTicketsViewProps {
  currentUser: User;
  activeRole?: string;
  onViewTicket: (ticketId: string) => void;
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

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  currentUser,
  activeRole,
  onViewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const effectiveRole = activeRole || currentUser.role;
  const isTeknisi = effectiveRole === "teknisi";
  const scope = isTeknisi ? "assigned" : "my";

  // Auto-switch view based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("card");
      } else {
        setViewMode("table");
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setFilterStatus("all");
  }, [filterType]);

  useEffect(() => {
    loadTickets(1);
  }, [filterStatus, searchTerm, filterType, scope]);

  const loadTickets = async (page: number = 1) => {
    setLoading(true);
    try {
      const query = [];
      query.push(`page=${page}`);
      query.push(`per_page=15`);

      if (searchTerm) {
        query.push(`search=${encodeURIComponent(searchTerm)}`);
      }

      if (isTeknisi) {
        query.push(`type=perbaikan`);
      } else if (filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      if (filterStatus !== "all") {
        query.push(`status=${filterStatus}`);
      }

      query.push(`scope=${scope}`);

      const url = `tickets?${query.join("&")}`;
      const res: any = await api.get(url);

      const items = Array.isArray(res) ? res : res?.data || [];
      const responseMeta = res?.meta || res;

      // Robust mapping layer to handle snake_case from backend
      const mappedData = items.map((item: any) => ({
        ...item,
        ticketNumber: item.ticket_number || item.ticketNumber || `TIC-${item.id}`,
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        updatedAt: item.updated_at || item.updatedAt,
      }));

      setTickets(mappedData);
      setPagination({
        total: responseMeta.total || 0,
        per_page: responseMeta.per_page || 15,
        current_page: responseMeta.current_page || page,
        last_page: responseMeta.last_page || 1,
        from: responseMeta.from || (page - 1) * 15 + 1,
        to: responseMeta.to || Math.min(page * 15, responseMeta.total || 0),
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

  const handleRefreshData = () => {
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      submitted: { label: "Diajukan", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Send },
      assigned: { label: "Ditugaskan", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: LayoutGrid },
      in_progress: { label: "Diproses", color: "bg-orange-50 text-orange-600 border-orange-100", icon: RotateCw },
      on_hold: { label: "Menunggu", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
      closed: { label: "Selesai", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
      pending_review: { label: "Review", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Search },
      approved: { label: "Disetujui", color: "bg-green-50 text-green-600 border-green-100", icon: CheckCircle2 },
      rejected: { label: "Ditolak", color: "bg-red-50 text-red-600 border-red-100", icon: AlertCircle },
    };

    const config = statusMap[status] || { label: status, color: "bg-gray-50 text-gray-600 border-gray-100", icon: Info };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`capitalize font-bold px-2 py-1 text-[10px] ${config.color} border gap-1 rounded-lg shadow-sm whitespace-nowrap`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: "bg-blue-500",
      assigned: "bg-indigo-500",
      in_progress: "bg-orange-500",
      on_hold: "bg-amber-500",
      closed: "bg-emerald-500",
      pending_review: "bg-purple-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return statusMap[status] || "bg-slate-500";
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

  const getTypeLabel = (ticket: Ticket) => {
    // If it's a dynamic service, use the service category name
    if (ticket.service_category?.name) return ticket.service_category.name;
    
    const labels = {
      perbaikan: "Perbaikan",
      zoom_meeting: "Zoom Meeting",
    };
    return labels[ticket.type as keyof typeof labels] || ticket.type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      perbaikan: "text-orange-700 bg-orange-100 border-orange-300",
      zoom_meeting: "text-purple-700 bg-purple-100 border-purple-300",
      booking: "text-blue-700 bg-blue-100 border-blue-300",
      repair: "text-orange-700 bg-orange-100 border-orange-300",
      service: "text-emerald-700 bg-emerald-100 border-emerald-300",
      "peminjaman-kendaraan": "text-indigo-700 bg-indigo-100 border-indigo-300",
      "izin-belajar": "text-pink-700 bg-pink-100 border-pink-300",
    };
    return colors[type] || "text-slate-700 bg-slate-200 border-slate-300";
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      {/* HEADER SECTION - PREMIUM STYLE & COMPACT */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white border-none text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1.5 inline" /> SIGAP Service
                </Badge>
                {isTeknisi && <Badge className="bg-orange-500 text-white border-none text-[10px] font-bold px-3 py-1">MODE TEKNISI</Badge>}
            </div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-none">
              {isTeknisi ? "Monitoring Tugas" : "Tiket Saya"}
            </h1>
            <p className="text-slate-400 text-sm lg:text-base font-medium max-w-xl leading-relaxed">
              {isTeknisi 
                ? "Daftar antrean perbaikan dan tugas yang diberikan kepada Anda. Pastikan untuk merespon tepat waktu." 
                : "Pantau status pengajuan layanan Anda secara real-time. Kami berkomitmen memberikan solusi terbaik untuk kebutuhan Anda."}
            </p>
          </div>
        </div>
        <TicketIcon className="absolute -right-8 -bottom-8 h-48 w-48 text-white opacity-5 rotate-12" />
      </div>

      {/* Filter & Action Controls - INTEGRATED */}
      <Card className="border-none shadow-sm overflow-hidden bg-white group/card relative">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-[2.5] w-full group">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 h-5 w-5 group-focus-within:text-blue-600 transition-all duration-300 z-10" />
                <Input
                    placeholder="Cari nomor tiket atau judul pengajuan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-20 h-12 text-sm w-full bg-slate-50/50 border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all font-medium"
                    style={{ paddingLeft: '4.8rem' }}
                />
            </div>

            {/* Filter & Switcher Group */}
            <div className="flex-1 flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {!isTeknisi && (
                <div className="flex-1 min-w-[140px] relative">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-12 pl-4 text-sm border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Tipe" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="perbaikan">Perbaikan Asset</SelectItem>
                            <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                )}

                <div className="flex-1 min-w-[140px] relative">
                    <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                    >
                        <SelectTrigger className="h-12 pl-4 text-sm border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all font-bold text-slate-700">
                             <div className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="submitted">Diajukan</SelectItem>
                            <SelectItem value="assigned">Ditugaskan</SelectItem>
                            <SelectItem value="in_progress">Diproses</SelectItem>
                            <SelectItem value="on_hold">Menunggu</SelectItem>
                            <SelectItem value="closed">Selesai</SelectItem>
                            <SelectItem value="pending_review">Review</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* View Switcher & Action Group */}
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                        <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => setViewMode("table")}
                            className={`h-10 px-4 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <List className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Tabel</span>
                        </Button>
                        <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => setViewMode("card")}
                            className={`h-10 px-4 rounded-lg transition-all ${viewMode === "card" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <Layout className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Kartu</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 ml-1">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleRefreshData} 
                            className="h-10 w-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                            title="Muat Ulang"
                        >
                            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setShowStatusInfo(true)}
                            className="h-10 w-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                            title="Info Status"
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN CONTENT Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse uppercase tracking-widest">Sinkronisasi Data...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
          <TicketIcon className="h-12 w-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Tidak ada tiket ditemukan</h3>
          <p className="text-slate-500 text-sm italic mt-1 px-8 text-center">Silakan buat pengajuan baru melalui katalog layanan.</p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW - DESKTOP */
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[120px] font-bold text-xs uppercase tracking-wider text-slate-500 pl-6">ID Tiket</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Judul Pengajuan</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Tipe Layanan</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Tanggal</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="w-[100px] text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                return (
                  <TableRow 
                    key={ticket.id} 
                    className="group border-slate-50 cursor-pointer hover:bg-blue-50/30 transition-colors"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    <TableCell className="pl-6">
                        <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tighter">#{ticket.ticketNumber}</span>
                    </TableCell>
                    <TableCell>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ticket.title}</p>
                    </TableCell>
                    <TableCell>
                         <Badge variant="secondary" className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg border shadow-sm ${getTypeColor(ticket.type)}`}>
                            {getTypeLabel(ticket)}
                         </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(ticket.createdAt)}
                        </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                         <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <ChevronRight className="h-4 w-4" />
                         </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* CARD VIEW - COMPACT GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
             return (
               <Card
                 key={ticket.id}
                 className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white group overflow-hidden"
                 onClick={() => onViewTicket(ticket.id)}
               >
                 <div className="flex items-stretch h-full">
                   <div className={`w-1.5 ${getStatusColor(ticket.status)} opacity-80`} />
                   <div className="flex-1 p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                              <Badge variant="secondary" className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg border-none shadow-sm w-fit ${getTypeColor(ticket.type)}`}>
                                 {getTypeLabel(ticket)}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">#{ticket.ticketNumber}</span>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] leading-snug">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {formatDate(ticket.createdAt).split(',')[0]}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Clock className="h-3 w-3" />
                                {formatDate(ticket.createdAt).split(',')[1]}
                            </div>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <ChevronRight className="h-4 w-4" />
                          </div>
                      </div>
                   </div>
                 </div>
               </Card>
             );
          })}
        </div>
      )}

      {/* PAGINATION - IMPROVED & COMPACT */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">
                Halaman {pagination.current_page} / {pagination.last_page} • Total {pagination.total} Tiket
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={pagination.current_page === 1 || loading}
                    className="flex-1 sm:flex-none h-10 rounded-xl px-6 border-slate-200 font-bold text-xs"
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.has_more || loading}
                    className="flex-1 sm:flex-none h-10 rounded-xl px-6 border-slate-200 font-bold text-xs"
                >
                    Berikutnya
                </Button>
            </div>
        </div>
      )}

      <StatusInfoDialog
        open={showStatusInfo}
        onOpenChange={setShowStatusInfo}
      />
    </div>
  );
};

