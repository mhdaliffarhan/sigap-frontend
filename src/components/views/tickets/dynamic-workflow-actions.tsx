// src/components/views/tickets/dynamic-workflow-actions.tsx

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { SmartFormBuilder } from '@/components/dynamic-engine/SmartFormBuilder';
import { Form } from '@/components/ui/form';
import { workflowApi, type WorkflowAction } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

interface DynamicWorkflowActionsProps {
  ticketId: string;
  onUpdate: () => void; // Callback biar halaman refresh setelah aksi
}

export function DynamicWorkflowActions({ ticketId, onUpdate }: DynamicWorkflowActionsProps) {
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form hook untuk dialog input tambahan
  const form = useForm();

  // 1. Fetch tombol apa aja yang boleh dilihat user ini
  useEffect(() => {
    loadActions();
  }, [ticketId]);

  const loadActions = async () => {
    setLoading(true); // Pastikan loading state aktif
    try {
      const result = await workflowApi.getActions(ticketId);
      console.log("DEBUG WORKFLOW ACTIONS:", result); // Cek Console F12 kalau masih error
      
      // Pastikan yang disimpan ke state benar-benar ARRAY
      if (Array.isArray(result)) {
        setActions(result);
      } else {
        console.warn("Format response actions salah:", result);
        setActions([]);
      }
    } catch (error) {
      console.error("Gagal memuat aksi workflow", error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Klik Tombol
  const handleActionClick = (action: WorkflowAction) => {
    // Kalau butuh input form (misal: alasan tolak), buka dialog dulu
    if (action.require_form && action.require_form.length > 0) {
      setSelectedAction(action);
      form.reset(); // Reset form
    } else {
      // Kalau tombol langsung (misal: Approve), langsung eksekusi
      executeAction(action.id);
    }
  };

  // 3. Eksekusi ke Server
  const executeAction = async (transitionId: string, formData?: any) => {
    setSubmitting(true);
    try {
      await workflowApi.executeTransition(ticketId, transitionId, formData);
      toast.success("Status tiket berhasil diperbarui");
      setSelectedAction(null); // Tutup dialog jika ada
      onUpdate(); // Refresh halaman induk
      loadActions(); // Refresh tombol
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses aksi");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler submit form dialog
  const onDialogSubmit = (data: any) => {
    if (selectedAction) {
      executeAction(selectedAction.id, data);
    }
  };

  if (loading) return <div className="text-sm text-gray-400 py-2">Memuat opsi tindakan...</div>;; // Atau skeleton loading
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    return null; 
  }

  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-dashed">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant as any || 'default'}
          onClick={() => handleActionClick(action)}
          disabled={submitting}
          className="flex items-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {action.label}
          {!submitting && <ArrowRight className="h-4 w-4 opacity-50" />}
        </Button>
      ))}

      {/* DIALOG FORM (Muncul hanya jika tombol butuh input) */}
      <Dialog open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAction?.label}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)} className="space-y-4">
              {selectedAction?.require_form && (
                <SmartFormBuilder 
                  form={form} 
                  schema={selectedAction.require_form} 
                  prefix="" // Langsung di root object
                />
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedAction(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Memproses...' : 'Konfirmasi'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}