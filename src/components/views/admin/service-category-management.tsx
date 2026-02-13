import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form'; // [NEW] Added useWatch
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'; // [NEW] Added FormDescription
import { toast } from 'sonner';
import { Settings, Pencil, Trash2, Plus, Loader2, FileText, Calendar, Wrench, Users, TrafficCone } from 'lucide-react'; // [NEW] Added Icons
import ServiceCategoryDetail from './service-category-detail';
import { Separator } from '@/components/ui/separator'; // [NEW] Added Separator

export default function ServiceCategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // [NEW] State untuk list user (calon assignee)
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Form Schema
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'booking',
      is_active: true,
      form_schema: [],
      // === [NEW] Default Values Traffic Control ===
      target_role: 'admin_layanan', // Default role
      assignment_type: 'auto',      // Default Auto (Algoritma)
      default_assignee_id: ''       // Optional
    }
  });

  // [NEW] Watcher untuk memantau perubahan assignment_type
  const assignmentType = useWatch({ control: form.control, name: 'assignment_type' });
  const targetRole = useWatch({ control: form.control, name: 'target_role' });

  // Load Categories & Users
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Load Categories
      const resCat = await api.get('/service-categories');
      let dataToSet = [];
      if (Array.isArray(resCat)) dataToSet = resCat;
      else if (resCat?.data && Array.isArray(resCat.data)) dataToSet = resCat.data;
      else if (resCat?.data?.data && Array.isArray(resCat.data.data)) dataToSet = resCat.data.data;
      setCategories(dataToSet);

      // 2. [NEW] Load Users (untuk dropdown Direct Assignment)
      // Idealnya endpoint ini memfilter user aktif saja
      const resUsers = await api.get('/users'); 
      const usersList = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data?.data || []);
      setUsers(usersList);

    } catch (e) {
      toast.error("Gagal memuat data");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData() }, []);

  const openModal = () => {
    form.reset({ 
      name: '', 
      description: '', 
      type: 'booking', 
      is_active: true, 
      form_schema: [],
      // [NEW] Reset Traffic Config
      target_role: 'admin_layanan',
      assignment_type: 'auto',
      default_assignee_id: ''
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: any) => {
    // [NEW] Validasi Manual Sederhana
    if (data.assignment_type === 'direct' && !data.default_assignee_id) {
      form.setError('default_assignee_id', { type: 'manual', message: 'User wajib dipilih untuk metode Langsung' });
      return;
    }

    // Bersihkan assignee jika bukan direct
    if (data.assignment_type !== 'direct') {
      data.default_assignee_id = null;
    }

    try {
      await api.post('/service-categories', data);
      toast.success("Layanan berhasil dibuat");
      setIsOpen(false);
      loadInitialData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Gagal menyimpan layanan");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus layanan ini?")) return;
    try {
      await api.delete(`/service-categories/${id}`);
      toast.success("Layanan dihapus");
      loadInitialData();
    } catch(e) { toast.error("Gagal menghapus"); }
  }

  const handleManage = (id: string) => {
    setSelectedCategoryId(id);
    setViewState('detail');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedCategoryId(null);
    loadInitialData();
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'booking': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'repair': return <Wrench className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-green-500" />;
    }
  }

  // Helper untuk filter user berdasarkan role yang dipilih (Opsional, visual only)
  const filteredUsers = targetRole 
    ? users.filter(u => {
        // Cek role string atau array roles
        const uRoles = Array.isArray(u.roles) ? u.roles : [u.role];
        return uRoles.includes(targetRole);
      })
    : users;

  // RENDER UTAMA: Switch View
  if (viewState === 'detail' && selectedCategoryId) {
    return <ServiceCategoryDetail categoryId={selectedCategoryId} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Katalog Layanan</h2>
          <p className="text-muted-foreground mt-1">Kelola jenis layanan, formulir input, dan alur penugasan (Traffic Control).</p>
        </div>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Buat Layanan Baru
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-gray-100/80">
            <TableRow>
              <TableHead className="w-[300px] border-r border-b font-semibold text-gray-900 pl-4">Nama Layanan</TableHead>
              <TableHead className="w-[150px] border-r border-b font-semibold text-gray-900">Tipe</TableHead>
              {/* [NEW] Kolom Config */}
              <TableHead className="w-[200px] border-r border-b font-semibold text-gray-900">Strategi Penugasan</TableHead>
              <TableHead className="w-[120px] border-r border-b font-semibold text-gray-900 text-center">Status</TableHead>
              <TableHead className="w-[150px] border-b font-semibold text-gray-900 text-center px-2">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600"/>Memuat...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-500">Belum ada layanan.</TableCell></TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="group hover:bg-blue-50/40">
                  <TableCell className="border-r border-b font-medium bg-white group-hover:bg-blue-50/40 pl-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-slate-100 rounded-lg">{getTypeIcon(cat.type)}</div>
                      <div>
                        <div className="text-gray-900 font-semibold">{cat.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{cat.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-b"><span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs font-medium">{cat.type}</span></TableCell>
                  
                  {/* [NEW] Tampilan Strategi */}
                  <TableCell className="border-r border-b">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="capitalize">{cat.target_role || 'Admin Layanan'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrafficCone className="h-3 w-3 text-gray-400" />
                        <span className="capitalize">
                          {cat.assignment_type === 'auto' ? 'Otomatis' : 
                           cat.assignment_type === 'direct' ? 'Langsung' : 'Manual (Pool)'}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="border-r border-b text-center">
                    {cat.is_active ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">Aktif</span> : <span className="text-slate-400 text-xs bg-slate-50 px-2 py-1 rounded-full">Non-Aktif</span>}
                  </TableCell>
                  <TableCell className="border-b text-center bg-white/50 group-hover:bg-blue-50/40">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleManage(cat.id)}>
                        <Settings className="h-3.5 w-3.5 mr-1" /> Kelola
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(cat.id)}>
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

      {/* MODAL CREATE DENGAN KONFIGURASI TRAFFIC */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Layanan Baru</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* SECTION 1: INFO DASAR */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Informasi Dasar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Nama Layanan</FormLabel><FormControl><Input placeholder="Contoh: Peminjaman Aula" {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Tipe Layanan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="booking">Booking (peminjaman)</SelectItem>
                          <SelectItem value="repair">Perbaikan (repair)</SelectItem>
                          <SelectItem value="service">Layanan Umum (general)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Deskripsi Singkat</FormLabel><FormControl><Input placeholder="Keterangan..." {...field}/></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <Separator className="my-4" />

              {/* SECTION 2: TRAFFIC CONTROL (NEW) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrafficCone className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pengaturan Lalu Lintas Tiket</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* PILIH ROLE */}
                  <FormField control={form.control} name="target_role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Penanggung Jawab</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="admin_layanan">Admin Layanan (Default)</SelectItem>
                          <SelectItem value="admin_penyedia">Admin Penyedia/Gudang</SelectItem>
                          <SelectItem value="teknisi">Teknisi IT / Umum</SelectItem>
                          <SelectItem value="staff_ga">Staff Umum (GA)</SelectItem>
                          <SelectItem value="kepala_bagian">Kepala Bagian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        Divisi mana yang menangani tiket ini?
                      </FormDescription>
                    </FormItem>
                  )} />

                  {/* PILIH STRATEGI */}
                  <FormField control={form.control} name="assignment_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Pembagian Tugas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="auto">🤖 Otomatis (Smart)</SelectItem>
                          <SelectItem value="manual">✋ Manual (Kolam Tiket)</SelectItem>
                          <SelectItem value="direct">🎯 Langsung ke Personil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        {field.value === 'auto' && 'Sistem memilih user yang paling santai (beban terendah).'}
                        {field.value === 'manual' && 'Tiket masuk antrian, admin/staff harus klaim manual.'}
                        {field.value === 'direct' && 'Tiket selalu diberikan ke satu orang spesifik.'}
                      </FormDescription>
                    </FormItem>
                  )} />

                  {/* PILIH USER (HANYA JIKA DIRECT) */}
                  {assignmentType === 'direct' && (
                    <FormField control={form.control} name="default_assignee_id" render={({ field }) => (
                      <FormItem className="col-span-2 animate-in fade-in zoom-in-95 duration-200">
                        <FormLabel>Pilih Petugas Spesifik</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih User..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((u: any) => (
                                <SelectItem key={u.id} value={String(u.id)}>
                                  {u.name} ({u.role})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-xs text-center text-muted-foreground">Tidak ada user dengan role {targetRole}</div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-600">
                  {form.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                  Simpan Layanan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}