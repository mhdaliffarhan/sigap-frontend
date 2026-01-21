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

  if (loading || !service) return <div>Memuat...</div>;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Pengajuan: {service.name}</CardTitle>
          <p className="text-muted-foreground">{service.description}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* === BAGIAN 1: IDENTITAS UMUM === */}
              <div className="space-y-4">
                <FormField control={form.control} name="title" rules={{ required: "Judul wajib diisi" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Pengajuan</FormLabel>
                      <FormControl><Input placeholder="Contoh: Peminjaman Mobil ke Dinas X" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Tambahan</FormLabel>
                      <FormControl><Textarea placeholder="Jelaskan kebutuhan Anda..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === BAGIAN 2: JADWAL & RESOURCE (Khusus Tipe Booking) === */}
              {service.type === 'booking' && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-4">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">Pilih Jadwal & Unit</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="start_date" rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mulai</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="end_date" rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selesai</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Dropdown Resource (Hanya muncul jika tanggal sudah diisi) */}
                  {startDate && endDate && (
                    <FormField control={form.control} name="resource_id" rules={{ required: "Pilih unit" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pilih Unit Tersedia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Unit (Mobil/Ruangan)..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {resources.length > 0 ? resources.map(res => (
                                <SelectItem key={res.id} value={res.id}>
                                  {res.name} (Kapasitas: {res.capacity || '-'})
                                </SelectItem>
                              )) : (
                                <div className="p-2 text-sm text-red-500">Tidak ada unit tersedia di jam ini</div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* === BAGIAN 3: FORM DINAMIS (The Magic!) === */}
              {/* Komponen ini otomatis membuat input sesuai JSON dari DB */}
              <SmartFormBuilder 
                form={form} 
                schema={service.form_schema} 
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
                <Button type="submit" size="lg">Kirim Pengajuan</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}