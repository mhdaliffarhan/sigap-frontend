// src/components/views/tickets/dynamic-ticket-info.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ShieldCheck,

  UserCheck,
  MessageSquare,
  Info,
  Star,
} from "lucide-react";
import type { Ticket } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface DynamicTicketInfoProps {
  ticket: Ticket;
}

export function DynamicTicketInfo({ ticket }: DynamicTicketInfoProps) {
  if (!ticket.service_category && !ticket.type) return null;

  const { resource, start_date, end_date, ticket_data, action_data, assigned_user } = ticket;
  const ticketOwner = ticket.user;
  const isBooking = ticket.service_category?.type === "booking" || ticket.type === "booking" || !!resource;
  const hasActionData = action_data && Object.keys(action_data).length > 0;

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "EEEE, d MMM yyyy", { locale: localeId });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "HH:mm 'WITA'", { locale: localeId });
    } catch {
      return "-";
    }
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 rounded-full font-bold text-[10px] px-1.5 py-0">
          <CheckCircle2 className="h-2.5 w-2.5" /> YA
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1 rounded-full font-bold text-[10px] px-1.5 py-0">
          <XCircle className="h-2.5 w-2.5" /> TIDAK
        </Badge>
      );
    }
    if (Array.isArray(value)) return value.join(", ");
    if (!value) return "-";
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(value), "d MMM yyyy", { locale: localeId });
      } catch {
        return value;
      }
    }
    return value;
  };

  const RenderDataGrid = ({ data }: { data: any }) => (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="group flex flex-col gap-0.5 rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm hover:border-blue-200 transition-all"
        >
          <dt className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
            {formatLabel(key)}
          </dt>
          <dd className="text-xs font-bold text-slate-800 break-words leading-tight">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* === REFINED "INFORMASI UMUM" CARD === */}
      <Card className="shadow-sm rounded-xl border-slate-200 overflow-hidden bg-white gap-0">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800">
            <Info className="h-4 w-4 text-blue-500" /> Informasi Umum
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">

          {/* Row 1: People Info */}
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {/* Pembuat Tiket */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500 shrink-0 border border-blue-100/50">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Pembuat Tiket</p>
                <p className="text-sm text-slate-700 truncate">
                  {ticketOwner?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Penanggung Jawab */}
            <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/30">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 shrink-0 border border-indigo-100/50">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Penanggung Jawab (PJ)</p>
                {assigned_user ? (
                  <div className="flex flex-col">
                    <p className="text-sm  text-slate-700 truncate leading-tight">{assigned_user.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className="text-[8px] h-3.5 px-1.5 bg-indigo-600 text-white border-none font-bold uppercase tracking-tighter">
                        {assigned_user.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px]  italic text-slate-400 mt-0.5 uppercase tracking-tight">
                    Menunggu Penugasan
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Booking Info (Compact Consolidation) */}
          {isBooking && (resource || start_date) && (
            <div className="px-4 py-3 bg-orange-50/10 space-y-3">
              {/* Resource */}
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-lg border border-orange-200 text-orange-600 shrink-0 shadow-sm">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block mb-0.5">Resource / Lokasi</span>
                  <p className="text-xs text-slate-700 truncate">{resource?.name || "N/A"}</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-lg border border-blue-200 text-blue-600 shrink-0 shadow-sm mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-0.5">Jadwal Peminjaman</span>
                  <div className="space-y-1.5 mt-1">
                    <div className="flex items-center justify-start gap-4 bg-white/50 p-1.5 rounded-md border border-slate-100">
                      <span className="text-[8px] max-w-[40px] w-full font-bold text-blue-600 uppercase">Mulai</span>
                      <span className="text-[10px] text-slate-700">{formatDate(start_date)}, {formatTime(start_date)}</span>
                    </div>
                    <div className="flex items-center justify-start gap-4 bg-white/50 p-1.5 rounded-md border border-slate-100">
                      <span className="text-[8px] max-w-[40px] w-full font-bold text-indigo-600 uppercase">Selesai</span>
                      <span className="text-[10px] text-slate-700">{formatDate(end_date)}, {formatTime(end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Deskripsi Tiket */}
          <div className="px-4 py-3 bg-white">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0 border border-slate-100/50">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Deskripsi Tiket</p>
                <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100/30">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {ticket.description || "Tidak ada rincian deskripsi untuk tiket ini."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid for Ticket Data & Action Data */}
      <div className="grid grid-cols-1 gap-4">
        {/* Atribut Permintaan */}
        {ticket_data && Object.keys(ticket_data).length > 0 && (
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-slate-50/5 gap-0">
            <div className="px-4 py-2 border-b bg-white flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atribut Permintaan</span>
            </div>
            <CardContent className="p-4">
              <RenderDataGrid data={ticket_data} />
            </CardContent>
          </Card>
        )}

        {/* Laporan Selesai */}
        {hasActionData && (
          <Card className="shadow-sm border-emerald-100 bg-emerald-50/5 rounded-xl overflow-hidden border gap-0">
            <div className="px-4 py-2 border-b bg-white flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Laporan Penyelesaian</span>
            </div>
            <CardContent className="p-4">
              <RenderDataGrid data={action_data} />
            </CardContent>
          </Card>
        )}

        {/* Rating & Feedback */}
        {ticket.feedback && (
          <Card className="shadow-sm border-amber-100 bg-amber-50/5 rounded-xl overflow-hidden border gap-0">
            <div className="px-4 py-2 border-b bg-white flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Rating & Feedback</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= ticket.feedback!.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {ticket.feedback.rating}/5
                </span>
              </div>
              
              {ticket.feedback.feedback_text ? (
                <div className="bg-white p-3 rounded-lg border border-amber-100 italic">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "{ticket.feedback.feedback_text}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada komentar tambahan.</p>
              )}
              
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  {ticket.feedback.user_name?.substring(0, 1) || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-700">{ticket.feedback.user_name || "Pembuat Tiket"}</span>
                  <span className="text-[9px] text-slate-400">Memberikan feedback pada {format(new Date(ticket.feedback.created_at), "d MMM yyyy", { locale: localeId })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}