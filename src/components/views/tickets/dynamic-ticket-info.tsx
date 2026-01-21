// src/components/views/tickets/dynamic-ticket-info.tsx

import React from "react";
import type { Ticket } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Car,
  Box,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface DynamicTicketInfoProps {
  ticket: Ticket;
}

export function DynamicTicketInfo({ ticket }: DynamicTicketInfoProps) {
  // Hanya tampilkan jika ini adalah tiket layanan dinamis
  if (!ticket.service_category) return null;

  const { resource, start_date, end_date, dynamic_form_data } = ticket;

  // Format tanggal & waktu
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "EEEE, d MMMM yyyy", {
        locale: localeId,
      });
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

  // Helper labels: snake_case to Title Case
  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper values rendering
  const formatValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 gap-1"
        >
          <CheckCircle2 className="h-3 w-3" /> Ya
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-500 border-slate-200 gap-1"
        >
          <XCircle className="h-3 w-3" /> Tidak
        </Badge>
      );
    }
    if (Array.isArray(value)) return value.join(", ");
    if (!value) return "-";
    return value;
  };

  return (
    <Card className="mb-6 overflow-hidden border-l-4 border-l-blue-600 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              {ticket.service_category.type === "booking" ? (
                <Car className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {ticket.service_category.name}
            </CardTitle>
            <CardDescription>
              Detail informasi permintaan layanan
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {ticket.service_category.type === "booking"
              ? "Peminjaman"
              : "Layanan"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 p-6 md:grid-cols-2">
        {/* KOLOM KIRI: Resource & Jadwal */}
        <div className="space-y-6">
          {/* Unit / Resource Info */}
          {resource && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Box className="h-4 w-4" /> Unit Layanan
              </h4>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {resource.name}
                    </p>
                    {resource.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                  {resource.capacity && (
                    <Badge variant="secondary" className="text-xs">
                      Kap: {resource.capacity} Orang
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Jadwal Info */}
          {start_date && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" /> Jadwal Kegiatan
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-green-50/50 p-3 dark:bg-green-950/20">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Mulai
                  </span>
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(start_date)}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(start_date)}
                    </div>
                  </div>
                </div>

                {end_date && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Selesai
                    </span>
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(end_date)}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(end_date)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Detail Form (Dynamic Data) */}
        {dynamic_form_data && Object.keys(dynamic_form_data).length > 0 && (
          <div className="flex flex-col h-full">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-blue-600" /> 
              Informasi Tambahan
            </h4>
            
            <div className="flex-1 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(dynamic_form_data).map(([key, value]) => (
                  <div 
                    key={key} 
                    className="group flex flex-col gap-1 rounded-lg border bg-white dark:bg-slate-950 p-3 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-800"
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}