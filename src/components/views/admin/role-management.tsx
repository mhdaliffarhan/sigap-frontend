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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Shield, Loader2, Settings } from "lucide-react";

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
    <div className="flex flex-col gap-10 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Role
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola hak akses dan penugasan petugas secara dinamis.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => openModal()} 
          className="rounded-md bg-blue-600 hover:bg-blue-700 shadow-sm gap-2"
        >
          <Plus className="h-4 w-4" /> Tambah Role Baru
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] font-bold text-slate-500 uppercase text-[10px] tracking-wider pl-6 py-4">
                Kode / API Slug
              </TableHead>
              <TableHead className="w-[250px] font-bold text-slate-500 uppercase text-[10px] tracking-wider py-4">
                Nama Jabatan
              </TableHead>
              <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-wider py-4">
                Deskripsi Tugas
              </TableHead>
              <TableHead className="w-[120px] font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center pr-6 py-4">
                Kelola
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <span className="text-sm font-medium">Menyinkronkan data role...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Shield className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-bold text-slate-500 text-lg">Belum Ada Role</p>
                    <p className="text-sm text-slate-400 max-w-[250px] mx-auto mt-1">Daftar role diperlukan untuk menentukan penanggung jawab layanan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="group hover:bg-slate-50/80 transition-all duration-200 border-none"
                >
                  <TableCell className="pl-6 py-5">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase bg-slate-50 text-slate-600 border-slate-200 px-2 py-0.5">
                      {role.code}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-5">
                    <div className="font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      {role.name}
                    </div>
                  </TableCell>

                  <TableCell className="py-5 text-sm text-slate-500 max-w-md truncate italic">
                    {role.description || "Tidak ada deskripsi spesifik."}
                  </TableCell>

                  <TableCell className="pr-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        onClick={() => openModal(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        onClick={() => handleDelete(role.id)}
                      >
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

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
            <Shield className="absolute -right-8 -bottom-8 h-32 w-32 opacity-10 rotate-12" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingRole ? "Edit Role Jabatan" : "Tambah Role Baru"}
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                {editingRole ? "Perbarui informasi penanggung jawab sistem." : "Definisikan role baru untuk alur kerja tiket SIGAP."}
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Nama role wajib diisi" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold">Nama Jabatan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Admin General Affair"
                            className="bg-slate-50 border-slate-200 focus:ring-blue-500 h-11"
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
                        <FormLabel className="text-slate-600 font-bold">Kode API (Slug)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: admin_ga"
                            {...field}
                            disabled={!!editingRole} 
                            className={`h-11 ${!!editingRole ? "bg-slate-100 text-slate-500 cursor-not-allowed italic" : "bg-slate-50 border-slate-200"}`}
                          />
                        </FormControl>
                        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Settings className="h-3 w-3" />
                          {editingRole 
                            ? "Identitas teknis (slug) bersifat permanen untuk integritas data." 
                            : "Gunakan snake_case (huruf kecil & _) untuk referensi sistem."}
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
                        <FormLabel className="text-slate-600 font-bold">Deskripsi Tugas</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Jelaskan cakupan tugas role ini..." 
                            className="bg-slate-50 border-slate-200 focus:ring-blue-500 h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="h-11 rounded-md border-slate-200"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-11 rounded-md bg-blue-600 hover:bg-blue-700 px-8 shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    {editingRole ? "Simpan Perubahan" : "Buat Role Sekarang"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}