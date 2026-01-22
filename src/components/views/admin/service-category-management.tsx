import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Settings, Pencil, Trash2, Plus, Layers, Loader2, FileText, Calendar, Wrench } from 'lucide-react';
import ServiceCategoryDetail from './service-category-detail';

export default function ServiceCategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Form hanya untuk Create Basic Info
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'booking',
      is_active: true,
      form_schema: [] // Kosong saat create awal
    }
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-categories');
      let dataToSet = [];
      if (Array.isArray(res)) dataToSet = res;
      else if (res?.data && Array.isArray(res.data)) dataToSet = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) dataToSet = res.data.data;
      
      setCategories(dataToSet);
    } catch (e) {
      toast.error("Gagal memuat kategori");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories() }, []);

  const openModal = () => {
    form.reset({ name: '', description: '', type: 'booking', is_active: true, form_schema: [] });
    setIsOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const res = await api.post('/service-categories', data);
      toast.success("Layanan dibuat");
      setIsOpen(false);
      loadCategories();
      
      // Opsional: Langsung arahkan ke detail setelah create agar bisa setting resource
      // const newId = res.data?.data?.id || res.data?.id;
      // if (newId) handleManage(newId);

    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal menyimpan");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus layanan ini?")) return;
    try {
      await api.delete(`/service-categories/${id}`);
      toast.success("Layanan dihapus");
      loadCategories();
    } catch(e) { toast.error("Gagal menghapus"); }
  }

  const handleManage = (id: string) => {
    setSelectedCategoryId(id);
    setViewState('detail');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedCategoryId(null);
    loadCategories();
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'booking': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'repair': return <Wrench className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-green-500" />;
    }
  }

  // RENDER UTAMA: Switch View
  if (viewState === 'detail' && selectedCategoryId) {
    return <ServiceCategoryDetail categoryId={selectedCategoryId} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Katalog Layanan</h2>
          <p className="text-muted-foreground mt-1">Kelola jenis layanan, formulir input, dan resource.</p>
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
              <TableHead className="w-[120px] border-r border-b font-semibold text-gray-900 text-center">Status</TableHead>
              <TableHead className="w-[150px] border-b font-semibold text-gray-900 text-center px-2">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600"/>Memuat...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">Belum ada layanan.</TableCell></TableRow>
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

      {/* MODAL SIMPLE CREATE */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Layanan Baru</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nama Layanan</FormLabel><FormControl><Input placeholder="Contoh: Peminjaman Aula" {...field}/></FormControl><FormMessage/></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Input placeholder="Keterangan..." {...field}/></FormControl></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}