// src/components/views/services/create-service-ticket.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { dynamicServiceApi, availabilityApi, resourceApi, api } from '@/lib/api';
import type { ServiceCategory } from '@/types/dynamic-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Send,
  Loader2, Info, MapPin, Clock, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DynamicFormRenderer } from '@/components/dynamic-engine/form-renderer';
import { ResourceCalendar } from '../tickets/resource-calendar';
import { format, areIntervalsOverlapping } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreateServiceTicket() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceCategory | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    data: any | null;
    conflictInfo: any | null;
  }>({ open: false, data: null, conflictInfo: null });

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      resource_id: '',
      priority: 'medium',
      ticket_data: {} 
    }
  });

  const selectedResourceId = form.watch('resource_id');
  const isBooking = service?.type === 'booking';

  useEffect(() => {
    if (slug) {
      dynamicServiceApi.getServiceBySlug(slug)
        .then((s) => {
          setService(s);
          form.setValue('title', `Pengajuan: ${s.name}`);
        })
        .catch(() => toast.error("Layanan tidak ditemukan"))
        .finally(() => setLoading(false));
    }
  }, [slug, form]);

  useEffect(() => {
    if (isBooking && service?.id) {
      const fetchResources = async () => {
        setLoadingResources(true);
        try {
          const res = await resourceApi.getByCategory(service.id);
          setResources(Array.isArray(res) ? res.filter((r: any) => r.is_active) : []);
        } catch (error) {
          console.error("Gagal load resource", error);
        } finally {
          setLoadingResources(false);
        }
      };
      fetchResources();
    }
  }, [service?.id, isBooking]);

  const executeSubmission = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (!service) return;
      
      const payload = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        type: service.slug, 
        service_category_id: service.id,
        resource_id: isBooking ? data.resource_id : null,
        start_date: isBooking ? data.start_date : null,
        end_date: isBooking ? data.end_date : null,
        ticket_data: data.ticket_data 
      };

      await api.post('/tickets', payload);
      
      toast.success("Tiket berhasil dibuat!", {
        description: "Pengajuan Anda telah masuk ke sistem."
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal membuat tiket";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setConflictDialog({ open: false, data: null, conflictInfo: null });
    }
  };

  const onSubmit = async (data: any) => {
    if (!service) return;

    if (!isBooking || !data.resource_id || !data.start_date || !data.end_date) {
      await executeSubmission(data);
      return;
    }

    setIsSubmitting(true);
    try {
      const events = await availabilityApi.getEvents(data.resource_id);
      const userStart = new Date(data.start_date);
      const userEnd = new Date(data.end_date);

      const conflict = events.find((ev: any) => {
        if (['cancelled', 'rejected', 'closed_unrepairable'].includes(ev.status)) return false;
        const evStart = new Date(ev.start_date);
        const evEnd = new Date(ev.end_date);
        return areIntervalsOverlapping(
          { start: userStart, end: userEnd },
          { start: evStart, end: evEnd }
        );
      });

      if (conflict) {
        const hardBlockStatuses = ['approved', 'assigned', 'in_progress', 'completed', 'resolved', 'closed'];
        if (hardBlockStatuses.includes(conflict.status)) {
          toast.error("Jadwal Tidak Tersedia", {
            description: `Bentrok dengan tiket #${conflict.ticketNumber || 'Lain'} (Status: ${conflict.status}). Silakan pilih waktu lain.`,
            duration: 5000,
          });
          setIsSubmitting(false);
          return;
        } else {
          setConflictDialog({
            open: true,
            data: data,
            conflictInfo: conflict
          });
          setIsSubmitting(false);
          return;
        }
      }
      await executeSubmission(data);
    } catch (error) {
      console.error("Gagal cek ketersediaan", error);
      await executeSubmission(data);
    }
  };

  if (loading || !service) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Mempersiapkan formulir layanan...</p>
    </div>
  );

  const typeStyle = service ? (() => {
    if (service.type === 'booking') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (service.type === 'repair') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  })() : '';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full font-sans pb-20">
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
             <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors">Daftar Layanan</button>
             <ChevronRight className="h-3 w-3" />
             <span className="text-slate-500 font-medium">{service.name}</span>
          </div>
          <h1 className="text-3xl font-bold">Buat Pengajuan</h1>
          <p className="text-muted-foreground">Silakan lengkapi formulir di bawah untuk layanan {service.name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`capitalize py-1.5 px-3 border shadow-none ${typeStyle}`}>
            {service.type === 'booking' ? 'Reservasi' : service.type === 'repair' ? 'Perbaikan' : 'Layanan Umum'}
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 1. MAIN CORE INFO SECTION */}
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl gap-0">
            <CardHeader className="pb-3 border-b bg-slate-50/50 px-6 py-4">
               <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" /> Detail Informasi
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField control={form.control} name="title" rules={{required: "Judul wajib diisi"}} render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700">Subjek Pengajuan *</FormLabel>
                  <FormControl><Input placeholder="Contoh: Perbaikan AC Ruang Rapat" {...field} className="rounded-xl h-11 border-slate-200 focus:ring-2 focus:ring-blue-100 transition-all shadow-none" /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" rules={{required: "Deskripsi wajib diisi"}} render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700">Deskripsi / Alasan *</FormLabel>
                  <FormControl><Textarea placeholder="Jelaskan kebutuhan Anda secara detail..." className="min-h-[140px] rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-100 transition-all shadow-none py-3" {...field} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700">Prioritas</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['low', 'medium', 'high'].map((p) => (
                       <Button 
                         key={p} 
                         type="button"
                         variant={field.value === p ? 'default' : 'outline'}
                         onClick={() => field.onChange(p)}
                         className={`rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-wider shadow-none transition-all ${
                           field.value === p 
                           ? (p === 'high' ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white' : p === 'medium' ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white' : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white')
                           : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                          {p === 'low' ? 'Rendah' : p === 'medium' ? 'Normal' : 'Tinggi'}
                       </Button>
                    ))}
                  </div>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* 2. BOOKING SECTION */}
          {isBooking && (
            <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl gap-0">
              <CardHeader className="pb-3 border-b bg-slate-50/50 px-6 py-4">
                 <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-orange-500" /> Penjadwalan Unit
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <FormField control={form.control} name="resource_id" rules={{required: "Pilih unit"}} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Pilih Unit / Ruangan *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold text-slate-700">
                          <SelectValue placeholder={loadingResources ? "Memuat..." : "-- Pilih Unit --"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {resources.map((res) => (
                          <SelectItem key={res.id} value={res.id} className="py-2">{res.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                {selectedResourceId && (
                  <div className="space-y-6">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                       <ResourceCalendar resourceId={selectedResourceId} onDateSelect={(date) => {
                         const dateStr = format(date, 'yyyy-MM-dd');
                         form.setValue('start_date', `${dateStr}T08:00`);
                         form.setValue('end_date', `${dateStr}T09:00`);
                       }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="start_date" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3 w-3" /> Waktu Mulai (WITA)</FormLabel>
                          <FormControl><Input type="datetime-local" className="rounded-xl h-10 bg-white border-slate-200 font-medium text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="end_date" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3 w-3" /> Waktu Selesai (WITA)</FormLabel>
                          <FormControl><Input type="datetime-local" className="rounded-xl h-10 bg-white border-slate-200 font-medium text-sm" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3. DYNAMIC ATTRIBUTES */}
          {service.form_schema && service.form_schema.length > 0 && (
            <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl gap-0">
              <CardHeader className="pb-3 border-b bg-slate-50/50 px-6 py-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                   <MapPin className="h-4 w-4 text-emerald-500" /> Detail Tambahan: {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <DynamicFormRenderer schema={service.form_schema} form={form} />
              </CardContent>
            </Card>
          )}

          {/* 4. SUBMIT ACTION */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="max-md:w-full border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-blue-600 hover:bg-blue-700 max-md:w-full min-w-[160px]"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={conflictDialog.open} onOpenChange={(open) => !open && setConflictDialog(prev => ({...prev, open: false}))}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="h-6 w-6" /> Jadwal Bentrok
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium pt-2 leading-relaxed">
              Terdapat pengajuan lain di waktu yang sama pada unit ini. Apakah Anda ingin tetap melanjutkan pengajuan Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel onClick={() => setConflictDialog(prev => ({...prev, open: false}))} className="rounded-xl border-slate-200 font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => conflictDialog.data && executeSubmission(conflictDialog.data)} className="bg-amber-600 hover:bg-amber-700 rounded-xl font-bold">Tetap Ajukan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}