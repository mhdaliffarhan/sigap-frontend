import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { roleApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Shield, Loader2 } from "lucide-react";

export default function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const form = useForm({
    defaultValues: { code: "", name: "", description: "" },
  });

  const loadRoles = async () => {
    setLoading(true);
    try {
      const result = await roleApi.getAll();
      if (Array.isArray(result)) {
        setRoles(result);
      } else if (result?.data && Array.isArray(result.data)) {
        setRoles(result.data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Gagal memuat roles:", error);
      toast.error("Gagal memuat data role");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      if (editingRole) {
        await roleApi.update(editingRole.id, data);
        toast.success("Role berhasil diperbarui");
      } else {
        await roleApi.create(data);
        toast.success("Role berhasil dibuat");
      }
      setIsOpen(false);
      loadRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus role ini?")) return;
    try {
      await roleApi.delete(id);
      toast.success("Role dihapus");
      loadRoles();
    } catch (error) {
      toast.error("Gagal menghapus role");
    }
  };

  const openModal = (role: any = null) => {
    setEditingRole(role);
    if (role) {
      form.reset({
        code: role.code,
        name: role.name,
        description: role.description,
      });
    } else {
      form.reset({ code: "", name: "", description: "" });
    }
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Manajemen Role
          </h2>
          <p className="text-muted-foreground mt-1">
            Kelola hak akses dan jabatan dalam sistem.
          </p>
        </div>
        <Button onClick={() => openModal()} className="gap-2 max-md:w-full">
          <Plus className="h-4 w-4" /> Tambah Role
        </Button>
      </div>

      {/* Container Tabel dengan Style Konsisten BMN Asset */}
      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-gray-100/80">
            <TableRow>
              <TableHead className="w-[180px] border-r border-b font-semibold text-gray-900 whitespace-nowrap pl-4">
                Kode Role (Slug)
              </TableHead>
              <TableHead className="w-[250px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Nama Role
              </TableHead>
              <TableHead className="min-w-[300px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Deskripsi
              </TableHead>
              <TableHead className="w-[100px] border-b font-semibold text-gray-900 whitespace-nowrap text-center px-2">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 border-b">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                    <span className="text-sm">Memuat data role...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-gray-500 border-b"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Shield className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="font-medium text-gray-900">
                      Belum ada role tersedia
                    </p>
                    <p className="text-sm">Silakan tambahkan role baru.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="group hover:bg-blue-50/40 transition-colors"
                >
                  {/* Kode Role */}
                  <TableCell className="border-r border-b font-mono text-xs pl-4 align-middle bg-gray-50/50 group-hover:bg-blue-50/40 text-gray-700">
                    {role.code}
                  </TableCell>

                  {/* Nama Role */}
                  <TableCell className="border-r border-b font-medium align-middle text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                      {role.name}
                    </div>
                  </TableCell>

                  {/* Deskripsi */}
                  <TableCell className="border-r border-b text-sm text-gray-600 align-middle">
                    {role.description || "-"}
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="border-b px-2 py-1 align-middle text-center whitespace-nowrap bg-white/50 group-hover:bg-blue-50/40">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-sm"
                        onClick={() => openModal(role)}
                        title="Edit Role"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-sm"
                        onClick={() => handleDelete(role.id)}
                        title="Hapus Role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Tambah Role Baru"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Nama role wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Role</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Admin General Affair"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                rules={{ required: "Kode role wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Role (Slug)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: admin_ga"
                        {...field}
                        // --- PERUBAHAN DI SINI ---
                        // Jika sedang edit (editingRole ada isinya), maka disabled
                        disabled={!!editingRole} 
                        className={!!editingRole ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                        // -------------------------
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      {editingRole 
                        ? "Kode role tidak dapat diubah karena digunakan sebagai ID sistem." 
                        : "Gunakan huruf kecil dan garis bawah (snake_case). Unik."}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Keterangan tugas..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingRole ? "Simpan Perubahan" : "Simpan Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}