import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { roleApi, ticketActionApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle, ArrowRightLeft, FileInput } from 'lucide-react';
import { DynamicFormRenderer } from '@/components/dynamic-engine/form-renderer';

// --- DIALOG 1: RESOLVE (SELESAIKAN TIKET) ---
interface ResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onSuccess: () => void;
}

export const ResolveTicketDialog: React.FC<ResolveDialogProps> = ({ open, onOpenChange, ticket, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Ambil Schema Action dari layanan tiket ini
  const actionSchema = ticket?.service_category?.action_schema || [];
  
  const form = useForm({
    defaultValues: {
      notes: '',
      action_data: {} // Tempat menampung jawaban form dinamis
    }
  });

  const onSubmit = async (data: any) => {
    console.log("Payload:", data);
    setLoading(true);
    try {
      await ticketActionApi.resolve(ticket.id, {
        notes: data.notes,
        action_data: data.action_data
      });
      toast.success("Tiket berhasil diselesaikan!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyelesaikan tiket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" /> Selesaikan Tiket
          </DialogTitle>
          <DialogDescription>
            Isi laporan pengerjaan di bawah ini untuk menutup tiket.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* RENDER FORM DINAMIS (Jika ada schema dari admin) */}
            {actionSchema.length > 0 ? (
              <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <FileInput className="h-4 w-4" /> Data Laporan Wajib
                </div>
                <DynamicFormRenderer 
                  schema={actionSchema} 
                  form={form} 
                  prefix="action_data" 
                />
              </div>
            ) : (
              <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
                Tidak ada formulir khusus untuk layanan ini. Cukup isi catatan pengerjaan.
              </div>
            )}

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan Pengerjaan / Feedback</FormLabel>
                <FormControl>
                  <Textarea placeholder="Jelaskan apa yang telah dikerjakan..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Simpan & Selesaikan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


// --- DIALOG 2: TRANSFER (DELEGASI TIKET) ---
interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onSuccess: () => void;
}

export const TransferTicketDialog: React.FC<TransferDialogProps> = ({ open, onOpenChange, ticket, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  // Load Roles saat dialog dibuka
  useEffect(() => {
    if (open && roles.length === 0) {
      roleApi.getAll().then((res: any) => {
        setRoles(Array.isArray(res) ? res : res.data || []);
      });
    }
  }, [open]);

  const form = useForm({
    defaultValues: {
      to_role: '',
      notes: ''
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ticketActionApi.transfer(ticket.id, data);
      toast.success("Tiket berhasil didelegasikan");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal mendelegasikan tiket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" /> Delegasi / Transfer Tiket
          </DialogTitle>
          <DialogDescription>
            Oper tiket ini ke unit kerja atau role lain untuk penanganan lebih lanjut.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField control={form.control} name="to_role" rules={{required: "Tujuan wajib dipilih"}} render={({ field }) => (
              <FormItem>
                <FormLabel>Oper Ke Bagian Mana?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih Role Tujuan" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.code}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" rules={{required: "Alasan wajib diisi"}} render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan / Instruksi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Contoh: Mohon cek ketersediaan sparepart..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Kirim Transfer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};