import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { roleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Shield, Loader2 } from 'lucide-react';

export default function RoleManagement() {
  // Inisialisasi dengan array kosong []
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const form = useForm({
    defaultValues: { code: '', name: '', description: '' }
  });

  const loadRoles = async () => {
    setLoading(true);
    try {
      const result = await roleApi.getAll();
      
      // Validasi Ekstra: Pastikan result adalah array
      if (Array.isArray(result)) {
        setRoles(result);
      } else if (result?.data && Array.isArray(result.data)) {
        // Jaga-jaga jika formatnya { data: [...] }
        setRoles(result.data);
      } else {
        console.warn("Format role tidak valid:", result);
        setRoles([]); // Fallback ke array kosong
      }
    } catch (error) {
      console.error("Gagal memuat roles:", error);
      toast.error("Gagal memuat data role");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const onSubmit = async (data: any) => {
    try {
      if (editingRole) {
        await roleApi.update(editingRole.id, data);
        toast.success('Role berhasil diperbarui');
      } else {
        await roleApi.create(data);
        toast.success('Role berhasil dibuat');
      }
      setIsOpen(false);
      loadRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus role ini?')) return;
    try {
      await roleApi.delete(id);
      toast.success('Role dihapus');
      loadRoles();
    } catch (error) {
      toast.error('Gagal menghapus role');
    }
  };

  const openModal = (role: any = null) => {
    setEditingRole(role);
    if (role) {
      form.reset({ code: role.code, name: role.name, description: role.description });
    } else {
      form.reset({ code: '', name: '', description: '' });
    }
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Role</h2>
          <p className="text-muted-foreground">Kelola hak akses dan jabatan sistem.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Role
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode (Slug)</TableHead>
                <TableHead>Nama Role</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada role yang tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                // Safe Map: roles dijamin array karena inisialisasi dan validasi loadRoles
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-xs">{role.code}</TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-500" /> {role.name}
                    </TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(role)}>
                        <Pencil className="h-4 w-4 text-orange-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Tambah Role Baru'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name"
                rules={{ required: "Nama role wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Role</FormLabel>
                    <FormControl><Input placeholder="Contoh: Admin General Affair" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="code"
                rules={{ required: "Kode role wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Role (Slug)</FormLabel>
                    <FormControl><Input placeholder="Contoh: admin_ga" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Gunakan huruf kecil dan garis bawah (snake_case).</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl><Input placeholder="Keterangan tugas..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}