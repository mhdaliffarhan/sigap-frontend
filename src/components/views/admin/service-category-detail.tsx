import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { api, resourceApi, serviceCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Save, Plus, Pencil, Trash2, Box, Settings, Users, Target,
  LayoutList, Loader2, FileInput, CalendarClock, ChevronRight,
  ToggleLeft, Workflow, Zap, UserCheck
} from 'lucide-react';
import { SchemaBuilder, type FormFieldSchema } from './service-schema-builder';

interface ServiceCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

type TabId = 'general' | 'form-schema' | 'action-schema' | 'resources';

export default function ServiceCategoryDetail({ categoryId, onBack }: ServiceCategoryDetailProps) {
  const [category, setCategory] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const settingsForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'service',
      is_active: true,
      target_role: '',
      handling_role_id: '',
      assignment_type: 'auto',
      default_assignee_id: '',
      is_resource_based: false,
      form_schema: [] as FormFieldSchema[],
      action_schema: [] as FormFieldSchema[],
    },
  });

  const assignmentType = useWatch({ control: settingsForm.control, name: 'assignment_type' });
  const handlingRoleId = useWatch({ control: settingsForm.control, name: 'handling_role_id' });
  const serviceType = useWatch({ control: settingsForm.control, name: 'type' });

  const resourceForm = useForm({
    defaultValues: { name: '', description: '', capacity: 0, is_active: true }
  });

  // Build tabs dynamically based on type
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Pengaturan Umum', icon: Settings },
    { id: 'form-schema', label: 'Formulir Pengajuan', icon: LayoutList },
    { id: 'action-schema', label: 'Laporan Tindak Lanjut', icon: FileInput },
    // Only show Resources tab for booking type
    ...(serviceType === 'booking' ? [{ id: 'resources' as TabId, label: 'Resources', icon: Box }] : []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
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

      settingsForm.reset({
        name: catData.name,
        description: catData.description || '',
        type: catData.type,
        is_active: Boolean(catData.is_active),
        target_role: catData.target_role || '',
        handling_role_id: catData.handling_role_id || '',
        assignment_type: catData.assignment_type || 'auto',
        default_assignee_id: catData.default_assignee_id ? String(catData.default_assignee_id) : '',
        is_resource_based: Boolean(catData.is_resource_based),
        form_schema: catData.form_schema || [],
        action_schema: catData.action_schema || [],
      });

      try {
        const resData = await resourceApi.getByCategory(categoryId);
        setResources(Array.isArray(resData) ? resData : []);
      } catch {
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

  // If tab is resources but type changed away from booking, reset to general
  useEffect(() => {
    if (activeTab === 'resources' && serviceType !== 'booking') {
      setActiveTab('general');
    }
  }, [serviceType, activeTab]);

  const filteredUsers = handlingRoleId
    ? users.filter((u: any) => {
      return u.role_id === handlingRoleId || (u.role && roles.find(r => r.id === handlingRoleId)?.code === u.role);
    })
    : users;

  // --- HANDLERS ---
  const onSaveSettings = async (data: any) => {
    if (data.assignment_type === 'direct' && !data.default_assignee_id) {
      settingsForm.setError('default_assignee_id', { type: 'manual', message: 'Wajib memilih petugas' });
      toast.error("Pilih petugas untuk metode Langsung");
      return;
    }
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

  const openResourceModal = (res: any = null) => {
    setEditingResource(res);
    if (res) {
      resourceForm.reset({ name: res.name, description: res.description, capacity: res.capacity, is_active: Boolean(res.is_active) });
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
    } catch {
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
    } catch { toast.error("Gagal menghapus"); }
  };

  if (loading || !category) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  // --- TAB CONTENT ---
  const renderGeneralTab = () => (
    <div className="space-y-8">
      {/* Section 1: Informasi Dasar */}
      <section className="space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" />
          Informasi Dasar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField control={settingsForm.control} name="name" rules={{ required: "Nama wajib diisi" }} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-600 font-semibold">Nama Layanan</FormLabel>
              <FormControl><Input {...field} className="border-slate-200" /></FormControl>
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
            <FormControl><Textarea className="min-h-[80px] border-slate-200" {...field} /></FormControl>
            <FormDescription className="text-xs italic text-slate-400">Jelaskan fungsi layanan ini secara singkat untuk user.</FormDescription>
          </FormItem>
        )} />
      </section>

      <Separator />

      {/* Section 2: Status & Mode – side by side */}
      <section className="space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <ToggleLeft className="h-4 w-4 text-blue-500" />
          Status & Mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={settingsForm.control} name="is_active" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <FormLabel className="text-sm text-slate-700 font-medium">Status Layanan</FormLabel>
                <FormDescription className="text-xs text-slate-400">
                  {field.value ? 'Layanan ini aktif dan terlihat oleh pengguna.' : 'Layanan ini non-aktif dan tersembunyi.'}
                </FormDescription>
              </div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField control={settingsForm.control} name="is_resource_based" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                  <FormLabel className="text-sm text-slate-700 font-medium">Mode Jadwal</FormLabel>
                </div>
                <FormDescription className="text-xs text-slate-400">
                  Layanan berbasis penjadwalan resource (ruangan, kendaraan, dll).
                </FormDescription>
              </div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>
      </section>

      <Separator />

      {/* Section 3: Alur Kerja & Penugasan */}
      <section className="space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Workflow className="h-4 w-4 text-indigo-500" />
          Alur Kerja & Penugasan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField control={settingsForm.control} name="handling_role_id" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Role Penanggung Jawab
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="border-slate-200"><SelectValue placeholder="Pilih Role" /></SelectTrigger></FormControl>
                <SelectContent>
                  {roles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs text-slate-400">Role yang bertanggung jawab menangani tiket ini.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={settingsForm.control} name="assignment_type" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                Metode Penugasan
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="auto">
                    <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-amber-500" /> Otomatis (Smart)</span>
                  </SelectItem>
                  <SelectItem value="manual">
                    <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-blue-500" /> Manual (Pool)</span>
                  </SelectItem>
                  <SelectItem value="direct">
                    <span className="flex items-center gap-2"><UserCheck className="h-3.5 w-3.5 text-green-500" /> Langsung (Personal)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs text-slate-400">Bagaimana tiket didistribusikan ke petugas.</FormDescription>
            </FormItem>
          )} />
        </div>

        {assignmentType === 'direct' && (
          <FormField control={settingsForm.control} name="default_assignee_id" render={({ field }) => (
            <FormItem className="animate-in fade-in zoom-in-95 duration-200 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex max-md:flex-col items-center justify-between gap-4">
              <div className="flex-1">
                <FormLabel className="text-blue-900 font-bold flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> Petugas Spesifik
                </FormLabel>
                <FormDescription className="text-xs text-blue-700/70">Tiket akan langsung ditujukan ke user ini.</FormDescription>
              </div>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="w-full md:w-[240px] bg-white border-blue-200"><SelectValue placeholder="Pilih User..." /></SelectTrigger></FormControl>
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
      </section>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Kelola aset/resource yang terkait dengan layanan ini.</p>
        <Button variant="outline" size="sm" onClick={() => openResourceModal()} className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 italic">Belum ada resource untuk layanan ini.</div>
        ) : (
          resources.map((res) => (
            <div key={res.id} className="p-5 hover:bg-slate-50 transition-colors group bg-white">
              <div className="flex items-start justify-between">
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 truncate">{res.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{res.description || 'Peralatan/Aset'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="icon" className="h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openResourceModal(res)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDeleteResource(res.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {res.is_active ?
                  <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold border border-green-200">AKTIF</span> :
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-bold border border-slate-200">NON</span>
                }
                {res.capacity > 0 && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-200">Kapasitas: {res.capacity}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'form-schema':
        return (
          <FormField control={settingsForm.control} name="form_schema" render={({ field }) => (
            <SchemaBuilder value={field.value} onChange={field.onChange} />
          )} />
        );
      case 'action-schema':
        return (
          <FormField control={settingsForm.control} name="action_schema" render={({ field }) => (
            <SchemaBuilder value={field.value} onChange={field.onChange} />
          )} />
        );
      case 'resources':
        return renderResourcesTab();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ===== BREADCRUMB + TITLE HEADER ===== */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div>
          <nav className="flex items-center gap-1.5 text-sm mb-2">
            <button onClick={onBack} className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
              Katalog Layanan
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium truncate max-w-[250px]">{category?.name}</span>
          </nav>
          <h1 className="text-3xl font-bold">{category?.name || 'Loading...'}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="font-mono text-[10px] uppercase border-slate-200 bg-slate-50">
              #{categoryId.substring(0, 8)}
            </Badge>
            <Badge
              variant="outline"
              className={`capitalize text-[10px] ${category.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
            >
              {category.is_active ? 'Aktif' : 'Non-Aktif'}
            </Badge>
          </div>
        </div>
      </div>

      {/* ===== TAB NAVIGATOR ===== */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="max-md:hidden">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <Form {...settingsForm}>
        <form onSubmit={settingsForm.handleSubmit(onSaveSettings)}>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              {renderTabContent()}
            </CardContent>
          </Card>

          {/* ===== STICKY SAVE BUTTON (Bottom Right) ===== */}
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </Form>

      {/* ===== Modal Resource ===== */}
      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent className="sm:max-w-md">
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}