// src/components/views/tickets/dynamic-ticket-info.tsx

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface DynamicTicketInfoProps {
  ticket: any; // Menggunakan any agar fleksibel dengan struktur backend terbaru
}

export function DynamicTicketInfo({ ticket }: DynamicTicketInfoProps) {
  // Hanya tampilkan jika ini adalah tiket layanan dinamis
  if (!ticket.service_category && !ticket.type) return null;

  // Destructure Data
  const { resource, start_date, end_date, ticket_data, action_data, assigned_user } = ticket;
  const isBooking = ticket.service_category?.type === "booking" || ticket.type === "booking" || !!resource;
  const hasActionData = action_data && Object.keys(action_data).length > 0;

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "EEEE, d MMMM yyyy", { locale: localeId });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "HH:mm 'WITA'", { locale: localeId });
    } catch (e) {
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
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Ya
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1">
          <XCircle className="h-3 w-3" /> Tidak
        </Badge>
      );
    }
    if (Array.isArray(value)) return value.join(", ");
    if (!value) return "-";
    
    // Cek apakah string tanggal ISO?
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(value), "d MMMM yyyy", { locale: localeId });
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const RenderDataGrid = ({ data }: { data: any }) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => (
        <div 
          key={key} 
          className="group flex flex-col gap-1 rounded-lg border bg-white dark:bg-slate-950 p-3 shadow-sm hover:border-blue-200 transition-colors"
        >
          <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
            {formatLabel(key)}
          </dt>
          <dd className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words leading-relaxed">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. INFORMASI BOOKING (Khusus Tipe Peminjaman) */}
      {isBooking && (resource || start_date) && (
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/30">
          <CardHeader className="border-b border-blue-100/50">
            <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Detail Jadwal & Resource
            </CardTitle>
          </CardHeader>
          <CardContent className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Unit Info */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Unit / Ruangan</p>
                  <p className="text-base font-bold text-slate-800 mt-1">
                    {resource?.name || "Resource tidak spesifik"}
                  </p>
                  {resource?.description && (
                    <p className="text-sm text-slate-500 mt-1">{resource.description}</p>
                  )}
                  {resource?.capacity && (
                    <Badge variant="secondary" className="mt-2 text-xs font-normal">
                      Kapasitas: {resource.capacity} Orang
                    </Badge>
                  )}
                </div>
              </div>

              {/* Time Info */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Waktu Peminjaman</p>
                  <div className="text-sm text-slate-800 mt-1 space-y-2">
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Mulai:</span> 
                      <span className="font-medium">{formatDate(start_date)} - {formatTime(start_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Selesai:</span> 
                      <span className="font-medium">{formatDate(end_date)} - {formatTime(end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. DATA PERMINTAAN USER (Ticket Data) */}
      {ticket_data && Object.keys(ticket_data).length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" /> Detail Permintaan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 bg-slate-50/30">
            <RenderDataGrid data={ticket_data} />
          </CardContent>
        </Card>
      )}

      {/* 3. HASIL TINDAK LANJUT PJ (Action Data) */}
      {/* Ini akan muncul setelah PJ mengisi form "Selesaikan Tiket" */}
      {hasActionData && (
        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/20">
          <CardHeader className="pb-3 border-b border-emerald-100/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Laporan Penyelesaian
              </CardTitle>
              {assigned_user && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  <User className="h-3 w-3" />
                  <span className="font-medium">{assigned_user.name}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RenderDataGrid data={action_data} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}