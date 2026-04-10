import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api, resourceApi, availabilityApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { 
  ArrowLeft, Send, Loader2, Info, 
  Calendar as CalendarIcon, 
  AlertCircle, AlertTriangle, Sparkles,
  BookText, Wrench
} from 'lucide-react';
import { DynamicFormRenderer } from '@/components/dynamic-engine/form-renderer';
import { Badge } from '@/components/ui/badge';
import { ResourceCalendar } from './resource-calendar';
import { format, areIntervalsOverlapping } from 'date-fns';

interface CreateTicketDynamicProps {
  currentUser: any;
  service: any; 
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateTicketDynamic: React.FC<CreateTicketDynamicProps> = ({ 
  currentUser, 
  service, 
  onBack, 
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resources, setResources] = useState<any[]>([]); 
  const [loadingResources, setLoadingResources] = useState(false);
  
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    data: any | null;
    conflictInfo: any | null;
  }>({ open: false, data: null, conflictInfo: null });

  const isBooking = service.type === 'booking';

  const form = useForm({
    defaultValues: {
      title: `Pengajuan: ${service.name}`,
      description: '',
      priority: 'medium',
      resource_id: '',
      start_date: '',
      end_date: '',
      ticket_data: {} 
    }
  });

  const selectedResourceId = form.watch('resource_id');

  useEffect(() => {
    if (isBooking) {
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
  }, [service.id, isBooking]);

  const executeSubmission = async (data: any) => {
    setIsSubmitting(true);
    try {
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
      onSuccess();
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

  return (
    <div className="flex flex-col gap-8 lg:p-0 pb-20 animate-in fade-in slide-in-from-top-4 duration-700 w-full">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 lg:p-10 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-all text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <Badge className="bg-blue-600 text-white border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                   <Sparkles className="h-3 w-3 mr-1.5" /> Formulir SIGAP
                 </Badge>
                 <div className="h-1 w-1 rounded-full bg-slate-700" />
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">SISTEM TERPADU</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                Pengajuan {service.name}
              </h1>
            </div>
          </div>
  
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl px-6 text-slate-300 hover:text-white hover:bg-slate-800 font-bold">
              Batal
            </Button>
            <div className={`px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2`}>
                <div className={`h-2 w-2 rounded-full animate-pulse ${
                    service.type === 'booking' ? 'bg-indigo-400' : 
                    service.type === 'repair' ? 'bg-orange-400' : 'bg-emerald-400'
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Mode {service.type}
                </span>
            </div>
          </div>
        </div>
        
        {service.type === 'repair' ? <Wrench className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" /> : 
         service.type === 'booking' ? <CalendarIcon className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" /> :
         <BookText className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" />}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-6 pt-6 flex flex-row items-center gap-4">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Detail Pengajuan</CardTitle>
                  <p className="text-slate-500 text-sm italic">Lengkapi informasi di bawah untuk mengajukan layanan.</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="title" rules={{required: "Judul wajib diisi"}} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Judul Pengajuan</FormLabel>
                      <FormControl><Input placeholder="Contoh: Peminjaman Aula untuk Rapat" {...field} className="rounded-xl h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Rendah</SelectItem>
                          <SelectItem value="medium">Normal</SelectItem>
                          <SelectItem value="high">Tinggi</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" rules={{required: "Deskripsi wajib diisi"}} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi / Alasan</FormLabel>
                    <FormControl><Textarea placeholder="Jelaskan kebutuhan Anda..." className="min-h-[120px] rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {isBooking && (
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" /> Informasi Jadwal
                    </h3>
                    <FormField control={form.control} name="resource_id" rules={{required: "Pilih unit"}} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih Unit / Ruangan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder={loadingResources ? "Memuat..." : "Pilih salah satu"} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {resources.map((res) => (
                              <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {selectedResourceId && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <ResourceCalendar resourceId={selectedResourceId} onDateSelect={(date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          form.setValue('start_date', `${dateStr}T08:00`);
                          form.setValue('end_date', `${dateStr}T09:00`);
                        }} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="start_date" render={({ field }) => (
                        <FormItem><FormLabel>Waktu Mulai</FormLabel><FormControl><Input type="datetime-local" className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="end_date" render={({ field }) => (
                        <FormItem><FormLabel>Waktu Selesai</FormLabel><FormControl><Input type="datetime-local" className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {service.form_schema && service.form_schema.length > 0 && (
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" /> Data Tambahan
                    </h3>
                    <DynamicFormRenderer schema={service.form_schema} form={form} />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white gap-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-1">
                 <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">Konfirmasi Pengajuan</p>
                 <h3 className="text-xl font-bold">Siap untuk mengirim?</h3>
                 <p className="text-slate-400 text-sm italic">Layanan: {service.name}</p>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <Button type="button" variant="ghost" className="flex-1 sm:flex-none h-14 px-8 rounded-2xl hover:bg-white/10 text-slate-300" onClick={onBack}>Batal</Button>
                 <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-900/20">
                   {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                   Kirim Sekarang
                 </Button>
               </div>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog open={conflictDialog.open} onOpenChange={(open) => !open && setConflictDialog(prev => ({...prev, open: false}))}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2"><AlertTriangle /> Jadwal Bentrok</AlertDialogTitle>
            <AlertDialogDescription>Terdapat pengajuan lain di waktu yang sama. Ingin tetap melanjutkan?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictDialog(prev => ({...prev, open: false}))}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => conflictDialog.data && executeSubmission(conflictDialog.data)} className="bg-amber-600">Tetap Ajukan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};