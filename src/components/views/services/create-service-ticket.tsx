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
  ArrowLeft, Calendar, 
  Send, Sparkles,
  BookText, Loader2, Wrench
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreateServiceTicket() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceCategory | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      resource_id: '',
      dynamic_form_data: {} 
    }
  });

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  useEffect(() => {
    if (slug) {
      dynamicServiceApi.getServiceBySlug(slug)
        .then(setService)
        .catch(() => toast.error("Layanan tidak ditemukan"))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  useEffect(() => {
    if (service?.type === 'booking' && startDate && endDate) {
      dynamicServiceApi.getResources(service.slug, startDate, endDate)
        .then(setResources)
        .catch(console.error);
    }
  }, [service, startDate, endDate]);

  const onSubmit = async (data: any) => {
    if (!service) return;
    try {
      await dynamicServiceApi.createTicket({
        service_category_id: service.id,
        ...data,
        dynamic_form_data: data.dynamic_form_data 
      });
      toast.success("Tiket berhasil dibuat!");
      navigate('/dashboard'); 
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
    <div className="flex flex-col gap-8 lg:p-0 pb-20 animate-in fade-in slide-in-from-top-4 duration-700 w-full">
      {/* HEADER SECTION - MODERN & PREMIUM */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 lg:p-10 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
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
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-2xl px-6 text-slate-300 hover:text-white hover:bg-slate-800 font-bold">
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
        
        {/* Decorative Elements */}
        {service.type === 'repair' ? <Wrench className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" /> : 
         service.type === 'booking' ? <Calendar className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" /> :
         <BookText className="absolute -right-8 -bottom-8 h-40 w-40 text-white opacity-5 rotate-12" />}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* CONTAINER AREA */}
            <div className="space-y-8">
              
               {/* SECTION 1: DETAIL PENGUJUAN */}
               <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-6 pt-6 flex flex-row items-center gap-4">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <BookText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Detail Pengajuan</CardTitle>
                    <p className="text-slate-500 text-sm italic">Berikan informasi lengkap mengenai kebutuhan Anda.</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <FormField control={form.control} name="title" rules={{ required: "Judul wajib diisi" }}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-bold text-slate-700 ml-1">Subjek Pengajuan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Peminjaman Kendaraan Operasional untuk Dinas" 
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-bold text-slate-700 ml-1">Deskripsi Tambahan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Berikan informasi tambahan jika diperlukan..." 
                            className="min-h-[120px] bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 leading-relaxed font-medium"
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

              {/* SECTION 3: BOOKING (Conditional) */}
              {service.type === 'booking' && (
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-6 pt-6 flex flex-row items-center gap-4">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                       <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">Jadwal & Reservasi</CardTitle>
                      <p className="text-slate-500 text-sm italic">Tentukan waktu dan pilih unit yang tersedia.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="start_date" rules={{ required: true }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waktu Mulai</FormLabel>
                            <FormControl><Input type="datetime-local" className="h-12 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="end_date" rules={{ required: true }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waktu Selesai</FormLabel>
                            <FormControl><Input type="datetime-local" className="h-12 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {startDate && endDate && (
                      <FormField control={form.control} name="resource_id" rules={{ required: "Pilih unit" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pilih Unit / Ruangan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl h-12">
                                  <SelectValue placeholder="-- Pilih Unit Tersedia --" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {resources.map(res => (
                                  <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white gap-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-1">
                 <p className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">Konfirmasi Pengajuan</p>
                 <h3 className="text-xl font-bold">Kirim pengajuan sekarang?</h3>
                 <p className="text-slate-400 text-sm italic">Pastikan data yang Anda masukkan sudah akurat.</p>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <Button type="button" variant="ghost" className="flex-1 sm:flex-none h-14 px-8 rounded-2xl hover:bg-white/10 text-slate-300" onClick={() => navigate(-1)}>Batal</Button>
                 <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-900/20">
                   {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                   Kirim Pengajuan
                 </Button>
               </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}