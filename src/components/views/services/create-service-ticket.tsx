// src/components/views/services/create-service-ticket.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { dynamicServiceApi } from '@/lib/api';
import type { ServiceCategory, Resource } from '@/types/dynamic-service';
import { SmartFormBuilder } from '@/components/dynamic-engine/SmartFormBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, Calendar, Clock, 
  Info, Send, Sparkles,
  LayoutGrid, BookText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CreateServiceTicket() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceCategory | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Inisialisasi Form
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      resource_id: '',
      dynamic_form_data: {} // Tempat jawaban form dinamis
    }
  });

  // Watch tanggal untuk cek ketersediaan resource
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  // 1. Load Data Layanan
  useEffect(() => {
    if (slug) {
      dynamicServiceApi.getServiceBySlug(slug)
        .then(setService)
        .catch(() => toast.error("Layanan tidak ditemukan"))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  // 2. Cek Ketersediaan Resource (Kalau tipe booking)
  useEffect(() => {
    if (service?.type === 'booking' && startDate && endDate) {
      // Fetch resource yang tersedia di tanggal tersebut
      dynamicServiceApi.getResources(service.slug, startDate, endDate)
        .then(setResources)
        .catch(console.error);
    }
  }, [service, startDate, endDate]);

  // 3. Submit Handler
  const onSubmit = async (data: any) => {
    if (!service) return;

    try {
      await dynamicServiceApi.createTicket({
        service_category_id: service.id,
        ...data,
        // Pastikan format dynamic_form_data sesuai
        dynamic_form_data: data.dynamic_form_data 
      });
      
      toast.success("Tiket berhasil dibuat!");
      navigate('/dashboard'); // Atau ke halaman list tiket
    } catch (error) {
      toast.error("Gagal membuat tiket");
      console.error(error);
    }
  };

  if (loading || !service) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Mempersiapkan formulir layanan...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:p-8 pb-20 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[10px] font-bold uppercase transition-all">
                 <Sparkles className="h-3 w-3 mr-1" /> Layanan SIGAP
               </Badge>
               <span className="text-slate-300">•</span>
               <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Baru</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Pengajuan {service.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl px-6 border-slate-200">
            Batal
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Mengirim..." : "Kirim Pengajuan Sekarang"}
            <Send className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: MAIN FORMS */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* SECTION 1: IDENTITAS PENGUJUAN */}
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
                      <BookText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Detail Pengajuan</CardTitle>
                      <p className="text-xs text-slate-400">Informasi dasar mengenai kebutuhan Anda</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <FormField control={form.control} name="title" rules={{ required: "Judul wajib diisi" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold">Judul / Keperluan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Peminjaman Kendaraan Operasional ke Lokasi X" 
                            className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold">Deskripsi Tambahan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Berikan informasi tambahan jika diperlukan agar kami dapat melayani Anda lebih baik..." 
                            className="min-h-[120px] bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SECTION 2: DINAMIS SCHEMAS */}
              <SmartFormBuilder 
                form={form} 
                schema={service.form_schema} 
              />
            </div>

        {/* RIGHT COLUMN: BOOKING & SIDEBAR */}
        <div className="space-y-8">
          {/* BOOKING SECTION (Conditional) */}
          {service.type === 'booking' && (
            <Card className="border-none shadow-sm overflow-hidden bg-indigo-600 text-white relative">
              <CardHeader className="px-8 pt-8 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Jadwal & Unit</CardTitle>
                    <p className="text-xs text-indigo-100">Khusus layanan reservasi</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-2 space-y-6 relative z-10">
                <div className="grid gap-4">
                  <FormField control={form.control} name="start_date" rules={{ required: true }}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Waktu Mulai</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="bg-white/10 border-white/20 text-white h-11 rounded-lg focus:ring-white/30"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="end_date" rules={{ required: true }}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Waktu Selesai</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="bg-white/10 border-white/20 text-white h-11 rounded-lg focus:ring-white/30"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {startDate && endDate && (
                  <div className="pt-4 border-t border-white/10">
                    <FormField control={form.control} name="resource_id" rules={{ required: "Pilih unit" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-2 block">Pilih Unit Tersedia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white text-indigo-900 border-none rounded-xl h-12 shadow-inner">
                                <SelectValue placeholder="-- Pilih Unit --" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl overflow-hidden shadow-xl border-none">
                              {resources.length > 0 ? resources.map(res => (
                                <SelectItem key={res.id} value={res.id} className="cursor-pointer">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{res.name}</span>
                                    {res.capacity && <span className="text-[10px] opacity-70">Kap: {res.capacity} orang</span>}
                                  </div>
                                </SelectItem>
                              )) : (
                                <div className="p-3 text-center">
                                  <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">Tidak ada unit tersedia</p>
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-200" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {!startDate && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center text-xs text-indigo-100 italic">
                    Tentukan waktu mulai & selesai untuk melihat ketersediaan unit.
                  </div>
                )}
              </CardContent>
              {/* Decoration */}
              <Calendar className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10 -rotate-12" />
            </Card>
          )}

          {/* HELP CARD */}
          <Card className="border-none shadow-sm bg-slate-50">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 leading-tight">Panduan Layanan</h4>
              <p className="text-xs text-slate-500 leading-relaxed italic mb-4">
                "Pastikan data yang Anda masukkan sudah benar. Anda dapat memantau progress pengajuan melalui dashboard setelah tiket terkirim."
              </p>
              <Separator className="my-4 bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <LayoutGrid className="h-3 w-3" /> Area Layanan: {service.type}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> Respon: &lt; 24 Jam
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}