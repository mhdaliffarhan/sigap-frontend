import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, isSameDay, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
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
  const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
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

  // Filter Event untuk Tanggal yang Dipilih
  const dailyEvents = events.filter(ev => {
    if (!selectedDate) return false;
    
    const start = parseLocalISO(ev.start_date);
    const end = parseLocalISO(ev.end_date);
    const target = selectedDate;

    return (isSameDay(start, target) || isSameDay(end, target) || 
           (isBefore(start, endOfDay(target)) && isAfter(end, startOfDay(target))));
  });

  const busyDays = events.map(ev => parseLocalISO(ev.start_date));

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  const formatEventTime = (ev: BookingEvent, currentViewDate: Date) => {
    const start = parseLocalISO(ev.start_date);
    const end = parseLocalISO(ev.end_date);
    
    let startText = format(start, 'HH:mm');
    let endText = format(end, 'HH:mm');
 
    if (isBefore(start, startOfDay(currentViewDate))) startText = "Kemarin";
    if (isAfter(end, endOfDay(currentViewDate))) endText = "Besok";

    return `${startText} - ${endText} WITA`;
  };

  if (!resourceId) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-slate-200 rounded-xl bg-white shadow-none font-sans">
      
      {/* KOLOM KIRI: KALENDER */}
      <div className="flex flex-col items-center border-r border-dashed pr-6 border-slate-200">
        <h4 className="text-sm font-bold mb-4 text-slate-700 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-blue-500"/> Kalender Jadwal
        </h4>
        <div className="scale-95 origin-top">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className="rounded-xl border border-slate-100 shadow-sm bg-white"
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
        </div>
        <div className="flex items-center gap-4 mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Terisi</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Kosong</div>
        </div>
      </div>

      {/* KOLOM KANAN: LIST JADWAL HARI INI */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-3">
          <CardTitle className="text-sm font-bold flex justify-between items-center text-slate-800">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : '-'}
            </span>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {dailyEvents.length > 0 ? (
            <div className="space-y-3">
              {dailyEvents.map((ev) => {
                const isRejected = ['rejected', 'cancelled', 'closed_unrepairable'].includes(ev.status);
                const isApproved = ['approved', 'assigned', 'in_progress'].includes(ev.status);
                
                if (isRejected) return null;

                return (
                    <div key={ev.id} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-white transition-all group">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed" title={ev.title}>
                            {ev.title || "Booking"}
                        </p>
                        <Badge 
                            variant="outline" 
                            className={cn("text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter border-none", 
                                isApproved ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                            )}
                        >
                            {ev.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                            {selectedDate && formatEventTime(ev, selectedDate)}
                        </span>
                    </div>

                    {ev.user_name && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-300 transition-colors"></div>
                            {ev.user_name}
                        </div>
                    )}
                    </div>
                );
              })}
              
              <div className="mt-6 p-3 bg-amber-50/50 text-amber-800 text-[10px] rounded-xl border border-amber-100/50 flex gap-2 items-start leading-relaxed">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                <span>
                  Pastikan pengajuan Anda tidak bentrok dengan jadwal yang sudah <b>Disetujui</b>.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mb-3 text-green-500/20" />
              <p className="text-xs font-bold text-slate-600">Unit Tersedia</p>
              <p className="text-[10px] mt-1">Belum ada agenda terdaftar untuk tanggal ini.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};