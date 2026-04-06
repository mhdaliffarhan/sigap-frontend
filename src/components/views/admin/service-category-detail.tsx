import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { api, resourceApi, serviceCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Plus, Pencil, Trash2, Box, Settings,
  LayoutList, Loader2, FileInput, CalendarClock, TrafficCone
} from 'lucide-react';
import { SchemaBuilder, type FormFieldSchema } from './service-schema-builder';

interface ServiceCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

export default function ServiceCategoryDetail({ categoryId, onBack }: ServiceCategoryDetailProps) {
  const [category, setCategory] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]); // [NEW] roles state
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

      // --- KONFIGURASI TRAFFIC  ---
      target_role: '', // Legacy
      handling_role_id: '', // New
      assignment_type: 'auto',
      default_assignee_id: '',

      is_resource_based: false,

      // --- SCHEMA ---
      form_schema: [] as FormFieldSchema[],
      action_schema: [] as FormFieldSchema[],
    },
  });

  const assignmentType = useWatch({ control: settingsForm.control, name: 'assignment_type' });
  const handlingRoleId = useWatch({ control: settingsForm.control, name: 'handling_role_id' });
  const targetRole = useWatch({ control: settingsForm.control, name: 'target_role' }); // Keep for legacy

  // Form Resource (Modal)
  const resourceForm = useForm({
    defaultValues: { name: '', description: '', capacity: 0, is_active: true }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Parallel Load: Category, Users, Roles
      const [catData, usersRes, rolesRes] = await Promise.all([
        serviceCategoryApi.getOne(categoryId),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/roles').catch(() => ({ data: [] }))
      ]);

      const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []);
      setUsers(usersList);
      setRoles(rolesList);
      setCategory(catData);

      // Reset Form dengan Data dari DB
      settingsForm.reset({
        name: catData.name,
        description: catData.description || '',
        type: catData.type,
        is_active: Boolean(catData.is_active),

        // Populate Traffic Config
        target_role: catData.target_role || '',
        handling_role_id: catData.handling_role_id || '',
        assignment_type: catData.assignment_type || 'auto',
        default_assignee_id: catData.default_assignee_id ? String(catData.default_assignee_id) : '',

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
    if (categoryId) loadData();
  }, [categoryId]);

  // Helper filter user sesuai role (Dinamis)
  const filteredUsers = handlingRoleId
    ? users.filter((u: any) => {
      // Cek matching role_id atau code (untuk safety)
      return u.role_id === handlingRoleId || (u.role && roles.find(r => r.id === handlingRoleId)?.code === u.role);
    })
    : users;

  // --- HANDLERS UTAMA ---

  const onSaveSettings = async (data: any) => {
    // Validasi Manual untuk Direct Assignment
    if (data.assignment_type === 'direct' && !data.default_assignee_id) {
      settingsForm.setError('default_assignee_id', { type: 'manual', message: 'Wajib memilih petugas' });
      toast.error("Pilih petugas untuk metode Langsung");
      return;
    }

    // Bersihkan jika bukan direct
    if (data.assignment_type !== 'direct') {
      data.default_assignee_id = null;
    }

    try {
      await serviceCategoryApi.update(categoryId, data);
      toast.success("Pengaturan berhasil disimpan!");
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Gagal menyimpan pengaturan");
    }
  };

  // --- HANDLERS RESOURCE ---

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

      const updatedRes = await resourceApi.getByCategory(categoryId);
      setResources(Array.isArray(updatedRes) ? updatedRes : []);
    } catch (e) {
      toast.error("Gagal menyimpan resource");
    }
  };

  const onDeleteResource = async (id: string) => {
    if (!confirm("Hapus resource ini?")) return;
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
    <div className="flex flex-col gap-10 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Detail: Signature Style */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="rounded-full h-10 w-10 border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {category?.name || 'Loading...'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-[10px] uppercase border-slate-200 bg-slate-50">
                #{categoryId.substring(0, 8)}
              </Badge>
              <Badge
                variant={category.is_active ? "secondary" : "outline"}
                className={`capitalize text-[10px] ${category.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500'}`}
              >
                {category.is_active ? 'Aktif' : 'Non-Aktif'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-md border-slate-200 text-slate-600">Batal</Button>
          <Button
            onClick={settingsForm.handleSubmit(onSaveSettings)}
            className="rounded-md bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
          </Button>
        </div>
      </div>

      <Form {...settingsForm}>
        <form onSubmit={settingsForm.handleSubmit(onSaveSettings)}>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* KOLOM KIRI (2/3): Konfigurasi & Schema */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* CARD 1: KONFIGURASI UTAMA */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" /> Pengaturan Umum
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={settingsForm.control} name="name" rules={{ required: "Nama wajib diisi" }} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Nama Layanan</FormLabel>
                        <FormControl><Input {...field} className="border-slate-200 focus:ring-blue-500" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={settingsForm.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Tipe Layanan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="booking">Booking (Peminjaman)</SelectItem>
                            <SelectItem value="repair">Perbaikan (Ticketing)</SelectItem>
                            <SelectItem value="service">Layanan Umum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={settingsForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-semibold">Deskripsi</FormLabel>
                      <FormControl><Textarea className="min-h-[80px] border-slate-200 focus:ring-blue-500" {...field} /></FormControl>
                      <FormDescription className="text-xs italic text-slate-400">Jelaskan fungsi layanan ini secara singkat untuk user.</FormDescription>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* CARD 2: WORKFLOW & TRAFFIC */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <TrafficCone className="h-4 w-4 text-indigo-500" /> Lalu Lintas & Alur Kerja
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={settingsForm.control} name="handling_role_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Role Penanggung Jawab</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="border-slate-200"><SelectValue placeholder="Pilih Role" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {roles.map((r: any) => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={settingsForm.control} name="assignment_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Metode Pembagian Tugas</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="auto">🤖 Otomatis (Smart)</SelectItem>
                            <SelectItem value="manual">✋ Manual (Pool)</SelectItem>
                            <SelectItem value="direct">🎯 Langsung (Personal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  {assignmentType === 'direct' && (
                    <FormField control={settingsForm.control} name="default_assignee_id" render={({ field }) => (
                      <FormItem className="animate-in fade-in zoom-in-95 duration-200 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <FormLabel className="text-blue-900 font-bold">Petugas Spesifik</FormLabel>
                          <FormDescription className="text-xs text-blue-700/70">Tiket akan langsung ditujukan ke user ini.</FormDescription>
                        </div>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="w-[240px] bg-white border-blue-200"><SelectValue placeholder="Pilih User..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((u: any) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-xs text-center text-muted-foreground">Tidak ada user di role ini</div>
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  )}
                </CardContent>
              </Card>

              {/* CARD 3: SCHEMA PENGAUAN (USER) */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <LayoutList className="h-4 w-4 text-blue-500" /> Desain Formulir Pengajuan (User)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <FormField control={settingsForm.control} name="form_schema" render={({ field }) => (
                    <SchemaBuilder value={field.value} onChange={field.onChange} />
                  )} />
                </CardContent>
              </Card>

              {/* CARD 4: SCHEMA TINDAK LANJUT (PJ) */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50 border-orange-100 bg-orange-50/20">
                  <CardTitle className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                    <FileInput className="h-4 w-4" /> Desain Laporan Tindak Lanjut (Petugas)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <FormField control={settingsForm.control} name="action_schema" render={({ field }) => (
                    <SchemaBuilder value={field.value} onChange={field.onChange} />
                  )} />
                </CardContent>
              </Card>
            </div>

            {/* KOLOM KANAN (1/3): Summary & Resources */}
            <div className="flex flex-col gap-8">

              {/* CARD 5: STATUS & RECAP */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ringkasan Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-6 pb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Dibuat Oleh</span>
                      <span className="text-xs font-bold text-slate-700">Admin</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <FormField control={settingsForm.control} name="is_active" render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel className="text-xs text-slate-500 font-medium">Status Publikasi</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <Separator className="bg-slate-100" />
                    <FormField control={settingsForm.control} name="is_resource_based" render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3 w-3 text-blue-500" />
                          <FormLabel className="text-xs text-slate-500 font-medium">Mode Jadwal</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              {/* CARD 6: RESOURCE MANAGEMENT */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Box className="h-4 w-4 text-blue-500" /> Resources
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => openResourceModal()} className="h-6 w-6 text-blue-600 hover:bg-blue-50">
                    <Plus className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 pb-6">
                  <div className="divide-y divide-slate-100">
                    {resources.length === 0 ? (
                      <div className="p-8 text-center text-[10px] text-slate-400 italic">Belum ada resource.</div>
                    ) : (
                      resources.map((res) => (
                        <div key={res.id} className="p-5 hover:bg-slate-50 transition-colors group">
                          <div className="flex items-start justify-between">
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-700 truncate">{res.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{res.description || 'Peralatan/Aset'}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" onClick={() => openResourceModal(res)}>
                                <Pencil className="h-3.3 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => onDeleteResource(res.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {res.is_active ?
                              <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold">AKTIF</span> :
                              <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">NON</span>
                            }
                            {res.capacity > 0 && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">Kapasitas: {res.capacity}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </form>
      </Form>

      {/* Modal Resource */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Tambah Resource Baru'}</DialogTitle>
          </DialogHeader>
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit(onSaveResource)} className="space-y-4">
              <FormField control={resourceForm.control} name="name" rules={{ required: true }} render={({ field }) => (
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