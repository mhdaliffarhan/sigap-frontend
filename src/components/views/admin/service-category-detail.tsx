import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api, resourceApi, serviceCategoryApi, roleApi } from '@/lib/api'; // Pastikan roleApi sudah ada di lib/api.ts
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Save, Plus, Pencil, Trash2, Box, Users, Settings, 
  LayoutList, Loader2, GitPullRequest, FileInput, CalendarClock 
} from 'lucide-react';
import { SchemaBuilder, type FormFieldSchema } from './service-schema-builder'; // Import FormFieldSchema

interface ServiceCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

export default function ServiceCategoryDetail({ categoryId, onBack }: ServiceCategoryDetailProps) {
  const [category, setCategory] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]); // State untuk Role List
  const [loading, setLoading] = useState(true);
  
  // State Modal Resource
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  // Form Utama (Kategori Layanan)
  const settingsForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'service',
      is_active: true,
      
      // --- FIELD BARU WORKFLOW ---
      handling_role: '',      // PJ Default
      is_resource_based: false, // Butuh Kalender?
      
      // --- SCHEMA ---
      form_schema: [] as FormFieldSchema[],   // Input User
      action_schema: [] as FormFieldSchema[], // Output PJ
    },
  });

  // Form Resource (Modal)
  const resourceForm = useForm({
    defaultValues: { name: '', description: '', capacity: 0, is_active: true }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Parallel Load: Category & Roles
      const [catData, rolesRes] = await Promise.all([
        serviceCategoryApi.getOne(categoryId),
        roleApi.getAll().catch(() => []) // Fallback array kosong jika error
      ]);

      // Handle Roles Data Structure
      const rolesData = Array.isArray(rolesRes) ? rolesRes : rolesRes.data || [];
      setRoles(rolesData);
      
      setCategory(catData);
      
      // Reset Form dengan Data dari DB
      settingsForm.reset({
        name: catData.name,
        description: catData.description || '',
        type: catData.type,
        is_active: Boolean(catData.is_active),
        
        // Populate Workflow Data
        handling_role: catData.handling_role || '', // Default handling role
        is_resource_based: Boolean(catData.is_resource_based),
        
        // Populate Schemas
        form_schema: catData.form_schema || [],
        action_schema: catData.action_schema || [],
      });

      // 2. Load Resources (Safe Fetch)
      try {
        const resData = await resourceApi.getByCategory(categoryId);
        setResources(Array.isArray(resData) ? resData : []);
      } catch (err) {
        console.warn("Gagal load resources", err);
        setResources([]);
      }

    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data layanan");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if(categoryId) loadData(); 
  }, [categoryId]);

  // --- HANDLERS UTAMA ---

  const onSaveSettings = async (data: any) => {
    try {
      await serviceCategoryApi.update(categoryId, data);
      toast.success("Pengaturan & Workflow berhasil disimpan!");
      // Tidak perlu loadData() full, cukup update local state jika perlu
      // Tapi untuk aman loadData() oke juga.
      loadData(); 
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Gagal menyimpan pengaturan");
    }
  };

  // --- HANDLERS RESOURCE (Sama seperti sebelumnya) ---

  const openResourceModal = (res: any = null) => {
    setEditingResource(res);
    if (res) {
      resourceForm.reset({ 
        name: res.name, 
        description: res.description, 
        capacity: res.capacity, 
        is_active: Boolean(res.is_active) 
      });
    } else {
      resourceForm.reset({ name: '', description: '', capacity: 0, is_active: true });
    }
    setResourceModalOpen(true);
  };

  const onSaveResource = async (data: any) => {
    try {
      const payload = { ...data, service_category_id: categoryId };
      if (editingResource) {
        await resourceApi.update(editingResource.id, payload);
        toast.success("Resource diperbarui");
      } else {
        await resourceApi.create(payload);
        toast.success("Resource ditambahkan");
      }
      setResourceModalOpen(false);
      
      // Reload resources only
      const updatedRes = await resourceApi.getByCategory(categoryId);
      setResources(Array.isArray(updatedRes) ? updatedRes : []);
    } catch (e) {
      toast.error("Gagal menyimpan resource");
    }
  };

  const onDeleteResource = async (id: string) => {
    if(!confirm("Hapus resource ini?")) return;
    try {
      await resourceApi.delete(id);
      toast.success("Resource dihapus");
      const updatedRes = await resourceApi.getByCategory(categoryId);
      setResources(Array.isArray(updatedRes) ? updatedRes : []);
    } catch (e) { toast.error("Gagal menghapus"); }
  };

  if (loading || !category) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Kelola: {category.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
              {category.type}
            </span>
            <span className="text-slate-300">|</span>
            <span>{category.description || "Tidak ada deskripsi"}</span>
          </div>
        </div>
        {/* Tombol Simpan Global di Header agar mudah diakses */}
        <div className="ml-auto">
           <Button onClick={settingsForm.handleSubmit(onSaveSettings)} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Simpan Semua Perubahan
           </Button>
        </div>
      </div>

      <Form {...settingsForm}>
        <form onSubmit={settingsForm.handleSubmit(onSaveSettings)}>
          
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full max-w-[600px] grid-cols-3 bg-slate-100 p-1 mb-6">
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" /> Umum & Input
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <GitPullRequest className="h-4 w-4" /> Workflow & Output
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Box className="h-4 w-4" /> Daftar Resource
              </TabsTrigger>
            </TabsList>

            {/* --- TAB 1: SETTINGS & INPUT SCHEMA --- */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Kiri: Info Dasar */}
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-base">Informasi Dasar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={settingsForm.control} name="name" rules={{required: "Nama wajib diisi"}} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Layanan</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={settingsForm.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Layanan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="service">Service (Umum)</SelectItem>
                            <SelectItem value="booking">Booking (Peminjaman)</SelectItem>
                            <SelectItem value="repair">Repair (Perbaikan)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={settingsForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    
                    <FormField control={settingsForm.control} name="is_active" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Status Aktif</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Kanan: Form Input User */}
                <Card className="md:col-span-2 border-blue-200 shadow-sm">
                  <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                          <LayoutList className="h-4 w-4"/> Desain Form Pengajuan (User)
                        </CardTitle>
                        <CardDescription className="text-blue-700/70 text-xs mt-1">
                          Pertanyaan yang harus diisi User saat membuat tiket baru.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField control={settingsForm.control} name="form_schema" render={({ field }) => (
                      <SchemaBuilder value={field.value} onChange={field.onChange} />
                    )} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* --- TAB 2: WORKFLOW & OUTPUT SCHEMA (BARU) --- */}
            <TabsContent value="workflow" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Kiri: Konfigurasi PJ */}
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-base">Konfigurasi Penanganan</CardTitle>
                    <CardDescription>Siapa yang memproses tiket ini?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Pilih Role PJ */}
                    <FormField control={settingsForm.control} name="handling_role" rules={{required: "Role PJ wajib dipilih"}} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Penanggung Jawab (PJ)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {roles.length > 0 ? (
                              roles.map((role: any) => (
                                <SelectItem key={role.id} value={role.code}>
                                  {role.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-xs text-center text-muted-foreground">Loading roles...</div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Tiket baru akan otomatis diarahkan ke role ini.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Toggle Resource Based */}
                    <FormField control={settingsForm.control} name="is_resource_based" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-slate-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-blue-600"/> Mode Booking
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Aktifkan untuk layanan berbasis jadwal (Cek ketersediaan).
                          </FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Kanan: Desain Form Tindak Lanjut (Output) */}
                <Card className="md:col-span-2 border-orange-200 shadow-sm">
                  <CardHeader className="bg-orange-50/50 border-b border-orange-100 py-4">
                    <CardTitle className="text-base text-orange-900 flex items-center gap-2">
                      <FileInput className="h-5 w-5"/> Desain Laporan Tindak Lanjut (PJ)
                    </CardTitle>
                    <CardDescription className="text-orange-800/70 text-xs mt-1">
                      Data apa yang harus diisi oleh <b>Teknisi / Admin</b> saat menyelesaikan tiket? 
                      (Contoh: Diagnosa, Bukti Foto, Link Zoom)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField control={settingsForm.control} name="action_schema" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          {/* Reuse SchemaBuilder lagi, tapi bind ke action_schema */}
                          <SchemaBuilder 
                            value={field.value} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* --- TAB 3: RESOURCES (Sama seperti sebelumnya) --- */}
            <TabsContent value="resources">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div>
                    <CardTitle className="text-base">Manajemen Resource</CardTitle>
                    <CardDescription>Unit aset yang tersedia untuk layanan ini.</CardDescription>
                  </div>
                  <Button onClick={() => openResourceModal()} size="sm" className="bg-blue-600">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Resource
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-100/80">
                        <TableRow>
                          <TableHead>Nama Resource</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-center">Kapasitas</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Belum ada resource terdaftar.
                            </TableCell>
                          </TableRow>
                        ) : (
                          resources.map((res) => (
                            <TableRow key={res.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Box className="h-4 w-4 text-slate-500" /> {res.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{res.description || '-'}</TableCell>
                              <TableCell className="text-center">
                                {res.capacity ? <span className="text-xs bg-slate-100 px-2 py-1 rounded">{res.capacity}</span> : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {res.is_active ? 
                                  <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">Aktif</span> : 
                                  <span className="text-slate-400 text-xs bg-slate-50 px-2 py-1 rounded-full">Non-Aktif</span>
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openResourceModal(res)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => onDeleteResource(res.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </form>
      </Form>

      {/* Modal Resource tetap sama */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Tambah Resource Baru'}</DialogTitle>
          </DialogHeader>
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit(onSaveResource)} className="space-y-4">
              <FormField control={resourceForm.control} name="name" rules={{required: true}} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Resource</FormLabel>
                  <FormControl><Input placeholder="Contoh: Toyota Innova B 1234 XX" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={resourceForm.control} name="capacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas (Opsional)</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={resourceForm.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-col justify-end h-full pb-2">
                    <div className="flex items-center space-x-2">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>Tersedia?</FormLabel>
                    </div>
                  </FormItem>
                )} />
              </div>
              <FormField control={resourceForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl><Input placeholder="Warna, Lokasi, dll" {...field} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResourceModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-blue-600">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}