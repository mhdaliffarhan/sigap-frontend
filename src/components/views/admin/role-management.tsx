import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { roleApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Trash2, Plus, Shield, Loader2, Info } from "lucide-react";

export default function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Role</h1>
          <p className="text-muted-foreground">
            Kelola hak akses dan penugasan petugas secara dinamis.
          </p>
        </div>
        <div className="flex items-center gap-3 max-md:w-full">
          <Button 
            onClick={() => openModal()} 
            className="bg-blue-600 hover:bg-blue-700 max-md:w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Role Baru
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden shadow-sm border-slate-200">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[60px] border-r border-b font-semibold text-center text-slate-700">No</TableHead>
              <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 px-4">
                Kode / API Slug
              </TableHead>
              <TableHead className="w-[250px] border-r border-b font-semibold text-slate-700 px-4">
                Nama Jabatan
              </TableHead>
              <TableHead className="border-r border-b font-semibold text-slate-700 px-4">
                 Deskripsi Tugas
              </TableHead>
              <TableHead className="w-[120px] border-b font-semibold text-slate-700 text-center px-4">
                Kelola
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <span className="text-sm font-medium">Menyinkronkan data role...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Shield className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-bold text-slate-500 text-lg">Belum Ada Role</p>
                    <p className="text-sm text-slate-400 max-w-[250px] mx-auto mt-1">Daftar role diperlukan untuk menentukan penanggung jawab layanan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((role, idx) => (
                <TableRow
                  key={role.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="border-r border-b font-medium text-center text-slate-500">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </TableCell>

                  <TableCell className="border-r border-b font-medium bg-white group-hover:bg-transparent px-4">
                    <Badge variant="outline" className="font-mono text-xs uppercase bg-slate-50 text-slate-600 border-slate-200">
                      {role.code}
                    </Badge>
                  </TableCell>

                  <TableCell className="border-r border-b font-medium text-slate-900 bg-white group-hover:bg-transparent px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      {role.name}
                    </div>
                  </TableCell>

                  <TableCell className="border-r border-b text-sm text-slate-500 bg-white group-hover:bg-transparent px-4 max-w-md truncate italic">
                    {role.description || "Tidak ada deskripsi spesifik."}
                  </TableCell>

                  <TableCell className="border-b text-center bg-white/50 group-hover:bg-transparent px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-600 border border-blue-200 hover:bg-blue-50"
                        onClick={() => openModal(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700"
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
        </CardContent>
        {/* Pagination Implementation */}
        {roles.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-sm max-md:flex-col max-md:gap-4">
            <div className="text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, roles.length)} - {Math.min(currentPage * itemsPerPage, roles.length)} dari {roles.length} data
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(roles.length / itemsPerPage) }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 p-0 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(roles.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(roles.length / itemsPerPage)}
                className="h-8 px-3"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role Jabatan" : "Tambah Role Baru"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingRole ? "Perbarui informasi penanggung jawab sistem." : "Definisikan role baru untuk alur kerja tiket SIGAP."}
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Nama role wajib diisi" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 font-semibold">Nama Jabatan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Admin General Affair"
                        className="border-slate-200"
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
                    <FormLabel className="text-slate-600 font-semibold">Kode API (Slug)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: admin_ga"
                        {...field}
                        disabled={!!editingRole} 
                        className={`${!!editingRole ? "bg-slate-100 text-slate-500 cursor-not-allowed italic" : "border-slate-200"}`}
                      />
                    </FormControl>
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                      <Info className="h-3 w-3" />
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
                    <FormLabel className="text-slate-600 font-semibold">Deskripsi Tugas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan cakupan tugas role ini..." 
                        className="border-slate-200 min-h-[80px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingRole ? "Simpan Perubahan" : "Buat Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}