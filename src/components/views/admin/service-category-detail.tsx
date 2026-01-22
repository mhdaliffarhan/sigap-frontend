import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api, resourceApi, serviceCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Pencil, Trash2, Box, Users, Settings, LayoutList, Loader2 } from 'lucide-react';
import { SchemaBuilder } from './service-schema-builder';

interface ServiceCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

export default function ServiceCategoryDetail({ categoryId, onBack }: ServiceCategoryDetailProps) {
  const [category, setCategory] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Resource
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const settingsForm = useForm();
  const resourceForm = useForm({
    defaultValues: { name: '', description: '', capacity: 0, is_active: true }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Category Detail
      const catData = await serviceCategoryApi.getOne(categoryId);
      setCategory(catData);
      
      settingsForm.reset({
        name: catData.name,
        description: catData.description,
        type: catData.type,
        is_active: Boolean(catData.is_active),
        form_schema: catData.form_schema || []
      });

      // 2. Load Resources (Safe Fetch)
      try {
        const resData = await resourceApi.getByCategory(categoryId);
        setResources(Array.isArray(resData) ? resData : []);
      } catch (err) {
        console.warn("Gagal load resources (mungkin belum ada)", err);
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

  const onSaveSettings = async (data: any) => {
    try {
      await serviceCategoryApi.update(categoryId, data);
      toast.success("Pengaturan & Form Schema tersimpan!");
      loadData(); 
    } catch (e) {
      toast.error("Gagal menyimpan pengaturan");
    }
  };

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
      
      // Reload resources
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
    <div className="space-y-6">
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
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" /> Pengaturan & Form
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Box className="h-4 w-4" /> Daftar Resource
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SETTINGS & SCHEMA */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kolom Kiri: Info Dasar */}
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-base">Informasi Layanan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={settingsForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Layanan</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="is_active" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Status Aktif</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mb-6">
                      <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                    </Button>
                  </CardContent>
                </Card>

                {/* Kolom Kanan: Schema Builder */}
                <Card className="md:col-span-2 border-blue-100 shadow-md">
                  <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                          <LayoutList className="h-4 w-4"/> Desain Formulir Input
                        </CardTitle>
                        <CardDescription className="text-blue-700/70">
                          Tentukan pertanyaan yang harus diisi pengguna saat mengajukan layanan ini.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField control={settingsForm.control} name="form_schema" render={({ field }) => (
                      <SchemaBuilder value={field.value} onChange={field.onChange} />
                    )} />
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* TAB 2: RESOURCES */}
        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Manajemen Resource</CardTitle>
                <CardDescription>
                  Unit aset yang tersedia untuk layanan ini.
                </CardDescription>
              </div>
              <Button onClick={() => openResourceModal()} size="sm" className="bg-blue-600">
                <Plus className="mr-2 h-4 w-4" /> Tambah Resource
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden mb-6">
                <Table>
                  <TableHeader className="bg-gray-100/80">
                    <TableRow>
                      <TableHead className="w-[300px]">Nama Resource</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="w-[100px] text-center">Kapasitas</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Aksi</TableHead>
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
                        <TableRow key={res.id} className="hover:bg-blue-50/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-slate-500" /> {res.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{res.description || '-'}</TableCell>
                          <TableCell className="text-center">
                            {res.capacity ? <span className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded"><Users className="h-3 w-3"/> {res.capacity}</span> : '-'}
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

      {/* Modal Resource */}
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