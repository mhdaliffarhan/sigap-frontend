import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api, resourceApi, availabilityApi } from '@/lib/api'; // Pastikan availabilityApi diimport
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { ArrowLeft, Send, Loader2, Info, Calendar as CalendarIcon, Package, AlertCircle, AlertTriangle } from 'lucide-react';
import { DynamicFormRenderer } from '@/components/dynamic-engine/form-renderer';
import { Separator } from "@/components/ui/separator";
import { ResourceCalendar } from './resource-calendar';
import { format, areIntervalsOverlapping, parseISO } from 'date-fns';

interface CreateTicketDynamicProps {
  currentUser: any;
  service: any; // Object Service Category yang dipilih dari Katalog
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
  
  // State untuk Dialog Konflik
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    data: any | null; // Data form yang akan dikirim
    conflictInfo: any | null; // Info tiket yang bentrok
  }>({ open: false, data: null, conflictInfo: null });

  // Cek apakah tipe layanan adalah booking
  const isBooking = service.type === 'booking';

  // Setup React Hook Form
  const form = useForm({
    defaultValues: {
      title: `Pengajuan: ${service.name}`,
      description: '',
      priority: 'medium',
      
      // Field khusus Booking
      resource_id: '',
      start_date: '',
      end_date: '',
      
      ticket_data: {} // Container untuk data dinamis
    }
  });

  // Pantau perubahan resource_id untuk memunculkan kalender
  const selectedResourceId = form.watch('resource_id');

  // Load Resources jika tipe booking
  useEffect(() => {
    if (isBooking) {
      const fetchResources = async () => {
        setLoadingResources(true);
        try {
          const res = await resourceApi.getByCategory(service.id);
          // Filter hanya resource yang aktif
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

  // --- FUNGSI UTAMA: KIRIM DATA ---
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

  // --- VALIDASI SEBELUM SUBMIT ---
  const onSubmit = async (data: any) => {
    // Jika BUKAN booking, langsung kirim
    if (!isBooking || !data.resource_id || !data.start_date || !data.end_date) {
      await executeSubmission(data);
      return;
    }

    // Jika BOOKING, cek bentrok dulu
    setIsSubmitting(true);
    try {
      // 1. Ambil semua jadwal untuk resource ini
      // Kita pakai endpoint getEvents yang sudah ada untuk ResourceCalendar
      const events = await availabilityApi.getEvents(data.resource_id);
      
      const userStart = new Date(data.start_date);
      const userEnd = new Date(data.end_date);

      // 2. Cari Tiket yang Bentrok (Overlap)
      const conflict = events.find((ev: any) => {
        // Abaikan tiket yang sudah batal/ditolak
        if (['cancelled', 'rejected', 'closed_unrepairable'].includes(ev.status)) return false;

        const evStart = new Date(ev.start_date);
        const evEnd = new Date(ev.end_date);

        // Cek overlap menggunakan date-fns
        return areIntervalsOverlapping(
          { start: userStart, end: userEnd },
          { start: evStart, end: evEnd }
        );
      });

      if (conflict) {
        // --- LOGIKA VALIDASI ---
        const hardBlockStatuses = ['approved', 'assigned', 'in_progress', 'completed', 'resolved', 'closed'];
        
        if (hardBlockStatuses.includes(conflict.status)) {
          // KASUS 1: Sudah DISETUJUI -> BLOKIR TOTAL
          toast.error("Jadwal Tidak Tersedia", {
            description: `Bentrok dengan tiket #${conflict.ticketNumber || 'Lain'} (Status: ${conflict.status}). Silakan pilih waktu lain.`,
            duration: 5000,
          });
          setIsSubmitting(false); // Stop loading
          return; // JANGAN LANJUT
        } else {
          // KASUS 2: Masih PENGAJUAN (Submitted) -> WARNING
          // Tampilkan Dialog Konfirmasi
          setConflictDialog({
            open: true,
            data: data, // Simpan data form untuk dikirim nanti jika user maksa
            conflictInfo: conflict
          });
          setIsSubmitting(false); // Pause loading waiting for user input
          return;
        }
      }

      // Jika tidak ada bentrok, lanjut kirim
      await executeSubmission(data);

    } catch (error) {
      console.error("Gagal cek ketersediaan", error);
      // Jika gagal cek (misal internet mati), tanya user mau nekat atau tidak?
      // Untuk aman, kita biarkan error atau bypass (disini kita coba submit aja)
      await executeSubmission(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header Navigasi */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Katalog
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Header Card yang Menyatu */}
        <div className="border-b bg-slate-50/50 p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-blue-100 rounded-lg text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{service.name}</h1>
              <p className="text-slate-500 mt-1">{service.description || "Lengkapi formulir di bawah ini untuk mengajukan layanan."}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            
            <CardContent className="p-6 space-y-8">
              
              {/* BAGIAN 1: INFORMASI UTAMA */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Informasi Pengajuan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" rules={{required: "Judul wajib diisi"}} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Judul Pengajuan <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Contoh: Peminjaman Aula untuk Rapat Koordinasi" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                    <FormLabel>Deskripsi / Alasan Kebutuhan <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan detail kebutuhan Anda..." 
                        className="min-h-[100px] resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* BAGIAN 2: BOOKING INFO (Hanya muncul jika tipe Booking) */}
              {isBooking && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Detail Peminjaman
                    </h3>
                    
                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100 space-y-6">
                      {/* Pilih Resource */}
                      <FormField control={form.control} name="resource_id" rules={{required: "Pilih unit yang akan dipinjam"}} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pilih Unit / Ruangan <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder={loadingResources ? "Memuat..." : "Pilih salah satu"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {resources.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">Tidak ada unit tersedia</div>
                              ) : (
                                resources.map((res) => (
                                  <SelectItem key={res.id} value={res.id}>
                                    <span className="font-medium">{res.name}</span> 
                                    {res.capacity && <span className="text-muted-foreground text-xs ml-2">({res.capacity} Orang)</span>}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* --- KALENDER KETERSEDIAAN (Muncul saat resource dipilih) --- */}
                      {selectedResourceId && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                           <div className="mb-2 flex items-center justify-between">
                              <FormLabel>Cek Ketersediaan Jadwal</FormLabel>
                              <span className="text-xs text-muted-foreground">Klik tanggal untuk memilih otomatis</span>
                           </div>
                           <ResourceCalendar 
                             resourceId={selectedResourceId} 
                             onDateSelect={(date) => {
                               // Otomatis set tanggal booking saat tanggal diklik (default 08:00 - 09:00)
                               const dateStr = format(date, 'yyyy-MM-dd');
                               form.setValue('start_date', `${dateStr}T08:00`);
                               form.setValue('end_date', `${dateStr}T09:00`);
                               toast.info(`Tanggal ${dateStr} dipilih. Silakan sesuaikan jam.`);
                             }}
                           />
                        </div>
                      )}

                      {/* Tanggal Mulai & Selesai */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="start_date" rules={{required: "Wajib diisi"}} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mulai <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input type="datetime-local" className="bg-white" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="end_date" rules={{required: "Wajib diisi"}} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selesai <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input type="datetime-local" className="bg-white" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* BAGIAN 3: DYNAMIC FORM (Hanya muncul jika ada schema) */}
              {service.form_schema && service.form_schema.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Data Tambahan
                    </h3>
                    <div className="p-1">
                      {/* Renderer Engine */}
                      <DynamicFormRenderer schema={service.form_schema} form={form} />
                    </div>
                  </div>
                </>
              )}

            </CardContent>

            {/* Footer Action */}
            <CardFooter className="flex justify-end gap-3 bg-slate-50/50 p-6 border-t">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[140px]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>}
                Kirim Pengajuan
              </Button>
            </CardFooter>

          </form>
        </Form>
      </Card>

      {/* --- DIALOG KONFLIK JADWAL --- */}
      <AlertDialog open={conflictDialog.open} onOpenChange={(open) => {
          if(!open) setConflictDialog(prev => ({ ...prev, open: false }));
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Jadwal Tumpang Tindih
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Terdapat pengajuan lain pada rentang waktu yang sama:
              </p>
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-900 text-sm">
                <strong>Tiket #{conflictDialog.conflictInfo?.ticketNumber || 'Lain'}</strong><br/>
                Status: {conflictDialog.conflictInfo?.status?.replace('_', ' ').toUpperCase()}<br/>
                Waktu: {conflictDialog.conflictInfo?.start_date ? format(new Date(conflictDialog.conflictInfo.start_date), 'dd/MM HH:mm') : '-'} s/d {conflictDialog.conflictInfo?.end_date ? format(new Date(conflictDialog.conflictInfo.end_date), 'dd/MM HH:mm') : '-'}
              </div>
              <p>
                Karena tiket tersebut <strong>belum disetujui</strong> (masih status {conflictDialog.conflictInfo?.status}), Anda tetap dapat mengajukan tiket ini. 
                Namun, Admin akan menentukan siapa yang disetujui.
              </p>
              <p className="font-semibold text-slate-900">Apakah Anda ingin melanjutkan?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictDialog(prev => ({ ...prev, open: false }))}>
              Batal & Pilih Waktu Lain
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => conflictDialog.data && executeSubmission(conflictDialog.data)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Tetap Ajukan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};