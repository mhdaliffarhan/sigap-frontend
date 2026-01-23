import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';
import { availabilityApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ResourceCalendarProps {
  resourceId: string;
  onDateSelect?: (date: Date) => void;
}

interface BookingEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  user_name?: string;
}

export const ResourceCalendar: React.FC<ResourceCalendarProps> = ({ resourceId, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // --- HELPER: TIMEZONE FIX ---
  // Memaksa string ISO dianggap sebagai waktu lokal (Membuang 'Z' atau offset)
  const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    // Hapus karakter 'Z' atau offset timezone (+07:00, etc) agar diparse sebagai local time
    const cleanDateStr = dateStr.replace(/(Z|[+-]\d{2}:\d{2})$/, '');
    return new Date(cleanDateStr);
  };

  // Load Jadwal
  useEffect(() => {
    if (!resourceId) return;
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await availabilityApi.getEvents(resourceId);
        setEvents(data);
      } catch (error) {
        console.error("Gagal memuat jadwal", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [resourceId]);

  // Filter Event untuk Tanggal yang Dipilih (Termasuk event lintas hari)
  const dailyEvents = events.filter(ev => {
    if (!selectedDate) return false;
    
    const start = parseLocalISO(ev.start_date);
    const end = parseLocalISO(ev.end_date);
    const target = selectedDate;

    // Logika: Event aktif jika (Start <= TargetOfDay) DAN (End >= TargetOfDay)
    // Sederhananya: Apakah tanggal yg dipilih ada di dalam rentang start-end?
    return (isSameDay(start, target) || isSameDay(end, target) || 
           (isBefore(start, endOfDay(target)) && isAfter(end, startOfDay(target))));
  });

  // Modifier Kalender (Tandai tanggal yang ada booking)
  // Kita loop setiap hari di bulan ini (biasanya library handle ini, tapi modifier butuh array date)
  // Untuk efisiensi, kita hanya pass start_date sebagai 'booked'. 
  // (Idealnya library calendar support range modifier, tapi basic modifier cukup untuk titik awal)
  const busyDays = events.map(ev => parseLocalISO(ev.start_date));

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  // Helper untuk format jam cerdas ("Kemarin", "Besok")
  const formatEventTime = (ev: BookingEvent, currentViewDate: Date) => {
    const start = parseLocalISO(ev.start_date);
    const end = parseLocalISO(ev.end_date);
    
    let startText = format(start, 'HH:mm');
    let endText = format(end, 'HH:mm');

    // Jika mulai sebelum hari ini
    if (isBefore(start, startOfDay(currentViewDate))) {
        startText = "Kemarin";
    }

    // Jika selesai setelah hari ini
    if (isAfter(end, endOfDay(currentViewDate))) {
        endText = "Besok";
    }

    return `${startText} - ${endText}`;
  };

  if (!resourceId) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white/50 animate-in fade-in zoom-in duration-300">
      
      {/* KOLOM KIRI: KALENDER */}
      <div className="flex flex-col items-center border-r border-dashed pr-4 border-slate-200">
        <h4 className="text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-blue-600"/> Kalender Jadwal
        </h4>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          className="rounded-md border shadow-sm bg-white"
          modifiers={{ booked: busyDays }}
          modifiersStyles={{
            booked: { 
                fontWeight: "bold", 
                color: "#2563eb",
                textDecoration: "underline",
                backgroundColor: "#eff6ff" 
            }
          }}
        />
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Terisi</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Kosong</div>
        </div>
      </div>

      {/* KOLOM KANAN: LIST JADWAL HARI INI */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-semibold flex justify-between items-center text-slate-700">
            <span>
              Agenda: {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : '-'}
            </span>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 h-[280px] overflow-y-auto pr-1 scrollbar-thin">
          {dailyEvents.length > 0 ? (
            <div className="space-y-2">
              {dailyEvents.map((ev) => {
                const isRejected = ['rejected', 'cancelled', 'closed_unrepairable'].includes(ev.status);
                const isApproved = ['approved', 'assigned', 'in_progress'].includes(ev.status);
                
                // Jangan tampilkan yg rejected di list agar tidak membingungkan (kecuali untuk audit)
                if (isRejected) return null;

                return (
                    <div key={ev.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-white shadow-sm hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1" title={ev.title}>
                            {ev.title || "Booking"}
                        </p>
                        <Badge 
                            variant="outline" 
                            className={cn("text-[10px] h-4 px-1", 
                                isApproved ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"
                            )}
                        >
                            {ev.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="font-mono bg-slate-100 px-1 rounded">
                            {selectedDate && formatEventTime(ev, selectedDate)}
                        </span>
                    </div>

                    {ev.user_name && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            {ev.user_name}
                        </div>
                    )}
                    </div>
                );
              })}
              
              <div className="mt-4 p-2 bg-amber-50 text-amber-800 text-[10px] rounded border border-amber-100 flex gap-2 items-start">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  Waktu yang tertera adalah waktu lokal. Pastikan pengajuan Anda tidak bentrok dengan jadwal <b>Disetujui</b> di atas.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed">
              <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
              <p className="text-xs font-medium text-slate-600">Tidak ada jadwal.</p>
              <p className="text-[10px]">Resource tersedia sepanjang hari ini.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};