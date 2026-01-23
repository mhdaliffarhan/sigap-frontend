// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketProgressTracker } from "./ticket-progress-tracker";
import { TicketProgressTrackerZoom } from "./ticket-progress-tracker-zoom";
import { WorkOrderForm } from "@/components/views/work-orders/work-order-form";
import { ZoomAdminReviewModal } from "@/components/views/zoom";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRightLeft, CheckCircle, Lock, ShieldAlert } from "lucide-react"; // Tambah ShieldAlert icon
import type { User } from "@/types";
import { motion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getTickets, getUsersSync, getWorkOrdersByTicket } from "@/lib/storage";
import type { ViewType } from "@/components/main-layout";
import { DynamicTicketInfo } from './dynamic-ticket-info';
import { DynamicWorkflowActions } from './dynamic-workflow-actions';
import { TicketDetailHeader, TicketDetailInfo } from "./ticket-detail-info";
import { TicketDetailAlerts } from "./ticket-detail-alerts";
import { TicketDiagnosisForm } from "./ticket-diagnosis-form";
import { ResolveTicketDialog, TransferTicketDialog } from './ticket-action-dialogs';
import { useTicketComments } from "@/hooks/useTicketComments";
import {
  useAdminLayananDialogs,
  useDiagnosaDialogs,
  useWorkOrderDialogs,
  useCommentState,
  useZoomReviewModal,
} from "./ticket-detail-hooks";

interface TicketDetailProps {
  ticketId: string;
  currentUser: User;
  activeRole?: string;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketId,
  currentUser,
  activeRole,
  onBack,
}) => {
  // === ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ===
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [ticketDetail, setTicketDetail] = React.useState<any>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(true);
  const [diagnosisSubmitCallback, setDiagnosisSubmitCallback] = React.useState<
    (() => Promise<void>) | null
  >(null);
  const [showDiagnosisConfirm, setShowDiagnosisConfirm] = React.useState(false);

  // State untuk Dialog Aksi PJ
  const [resolveOpen, setResolveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Multi-role support
  const effectiveRole = activeRole || currentUser.role;

  const tickets = useMemo(() => getTickets(), [refreshKey]);
  const users = getUsersSync();

  // Import state dari custom hooks
  const adminDialogs = useAdminLayananDialogs();
  const diagnosaDialog = useDiagnosaDialogs();
  const workOrderDialog = useWorkOrderDialogs();
  const { comment, setComment } = useCommentState();
  const { showZoomReviewModal, setShowZoomReviewModal } = useZoomReviewModal();
  
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const {
    comments,
    loading: commentsLoading,
    hasMore,
    fetchComments,
    loadMoreComments,
    addComment,
  } = useTicketComments();

  React.useEffect(() => {
    const fetchTicketDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await api.get<any>(`tickets/${ticketId}`);
        const ticketData = response.data || response;
        setTicketDetail(ticketData);
      } catch (error) {
        console.error("Failed to fetch ticket detail:", error);
        toast.error("Gagal memuat detail tiket");
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchTicketDetail();
  }, [ticketId, refreshKey]);

  React.useEffect(() => {
    fetchComments(ticketId);
  }, [ticketId, fetchComments]);

  const ticket = ticketDetail || tickets.find((t) => t.id === Number(ticketId));

  const [technicianStats, setTechnicianStats] = React.useState<
    Record<string, number>
  >({});

  React.useEffect(() => {
    const fetchTechnicianStats = async () => {
      try {
        const response = await api.get<any[]>("technician-stats");
        const stats = response.reduce((acc, curr) => {
          acc[curr.id] = curr.active_tickets;
          return acc;
        }, {} as Record<string, number>);
        setTechnicianStats(stats);
      } catch (error) {
        console.error("Failed to fetch technician stats:", error);
      }
    };

    if (adminDialogs.showAssignDialog) {
      fetchTechnicianStats();
    }
  }, [adminDialogs.showAssignDialog]);

  const technicians = useMemo(
    () =>
      users.filter((u) => {
        const userRoles = Array.isArray(u.roles)
          ? u.roles
          : u.role
          ? [u.role]
          : [];
        return userRoles.includes("teknisi");
      }),
    [users]
  );

  if (loadingDetail) {
    return (
      <div className="text-center py-12">
        <Spinner className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <p className="text-gray-500">Memuat detail tiket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Tiket tidak ditemukan</p>
        <Button onClick={onBack} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const ticketOwner = users.find((u) => u.id === ticket.userId);
  const assignedUser = ticket.assignedTo
    ? users.find((u) => u.id === ticket.assignedTo)
    : null;

  const canComplete =
    effectiveRole === "pegawai" &&
    ticket.userId === currentUser.id &&
    ["waiting_for_submitter"].includes(ticket.status as any);

  // --- [UPDATE] LOGIKA HAK AKSES SUPER ADMIN & PJ ---
  
  // 1. Cek apakah Super Admin (Intervensi Penuh)
  const isSuperAdmin = effectiveRole === 'super_admin' || (Array.isArray(currentUser.roles) && currentUser.roles.includes('super_admin'));

  // 2. Cek apakah PJ (Normal Flow)
  const isAssignee = ticket.current_assignee_role && (
    Array.isArray(currentUser.roles) 
      ? currentUser.roles.includes(ticket.current_assignee_role) 
      : currentUser.role === ticket.current_assignee_role
  );
  
  // 3. User bisa bertindak jika: (Dia PJ ATAU Dia Super Admin) DAN (Status Tiket Aktif)
  const canAct = (isAssignee || isSuperAdmin) && ['submitted', 'in_progress', 'on_hold', 'approved'].includes(ticket.status);

  // 4. Alert Warning: Punya Role tapi Salah Mode (Hanya muncul jika BUKAN Super Admin)
  const hasRightRoleButWrongMode = !isAssignee && !isSuperAdmin && ticket.current_assignee_role && 
    (Array.isArray(currentUser.roles) && currentUser.roles.includes(ticket.current_assignee_role));

  // =================================================

  const handleApprove = async () => {
    if (ticket.type === "perbaikan") {
      adminDialogs.setShowApproveDialog(false);
      adminDialogs.setShowAssignDialog(true);
      return;
    }
    try {
      await api.patch(`tickets/${ticketId}/approve`, {});
      toast.success("Tiket berhasil disetujui");
      adminDialogs.setShowApproveDialog(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to approve ticket:", error);
      toast.error(error?.body?.message || "Gagal menyetujui tiket");
    }
  };

  const handleReject = async () => {
    if (!adminDialogs.rejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }
    try {
      const endpoint =
        ticket.type === "zoom_meeting"
          ? `tickets/${ticketId}/reject-zoom`
          : `tickets/${ticketId}/reject`;

      await api.patch(endpoint, {
        reason: adminDialogs.rejectReason,
      });
      toast.success("Tiket berhasil ditolak");
      adminDialogs.setShowRejectDialog(false);
      adminDialogs.setRejectReason("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to reject ticket:", error);
      toast.error(error?.body?.message || "Gagal menolak tiket");
    }
  };

  const handleAssign = async () => {
    if (!adminDialogs.selectedTechnician) {
      toast.error("Pilih teknisi terlebih dahulu");
      return;
    }
    try {
      await api.patch(`tickets/${ticketId}/assign`, {
        assigned_to: adminDialogs.selectedTechnician,
      });
      toast.success("Tiket berhasil ditugaskan");
      adminDialogs.setShowAssignDialog(false);
      adminDialogs.setSelectedTechnician("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to assign ticket:", error);
      toast.error(error?.body?.message || "Gagal menugaskan tiket");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }
    if (isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      await addComment(ticketId, comment);
      toast.success("Komentar berhasil dikirim");
      setComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Gagal mengirim komentar");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRequestStatusChange = (callback: () => Promise<void>) => {
    setDiagnosisSubmitCallback(() => callback);
    diagnosaDialog.setShowStatusChangeConfirm(true);
  };

  const handleStatusChangeOnDiagnosisSubmit = async () => {
    if (ticket.status === "assigned") {
      try {
        await api.patch(`tickets/${ticketId}/status`, {
          status: "in_progress",
        });
        toast.success("Status tiket berhasil diubah menjadi In Progress");
        diagnosaDialog.setShowStatusChangeConfirm(false);
        setRefreshKey((prev) => prev + 1);

        setTimeout(async () => {
          if (diagnosisSubmitCallback) {
            await diagnosisSubmitCallback();
            setDiagnosisSubmitCallback(null);
          }
        }, 500);
      } catch (error: any) {
        console.error("Failed to change status:", error);
        toast.error(error?.body?.message || "Gagal mengubah status tiket");
        diagnosaDialog.setShowStatusChangeConfirm(false);
        setDiagnosisSubmitCallback(null);
      }
    }
  };

  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // === RENDER ===
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <TicketDetailHeader
        ticket={ticket}
        currentUser={currentUser}
        canComplete={canComplete}
        onBack={onBack}
        onShowCompleteDialog={() => {}}
      />

      {/* --- PANEL AKSI PJ / SUPER ADMIN --- */}
      {canAct && (
        <Card className={`shadow-sm animate-in slide-in-from-top-2 ${isSuperAdmin ? 'border-purple-200 bg-purple-50/20' : 'border-blue-200 bg-blue-50/20'}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className={`font-semibold flex items-center gap-2 ${isSuperAdmin ? 'text-purple-900' : 'text-blue-900'}`}>
                {isSuperAdmin ? <ShieldAlert className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} 
                {isSuperAdmin ? "Intervensi Super Admin" : "Aksi Penanganan"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {isSuperAdmin 
                  ? "Anda memiliki akses penuh untuk mengelola tiket ini." 
                  : "Anda sedang bertugas sebagai PJ tiket ini. Silakan proses."}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <Button 
                 variant="outline" 
                 onClick={() => setTransferOpen(true)} 
                 className={`flex-1 sm:flex-none hover:bg-opacity-50 ${isSuperAdmin ? 'border-purple-200 text-purple-700' : 'border-blue-200 text-blue-700'}`}
               >
                 <ArrowRightLeft className="mr-2 h-4 w-4"/> Delegasi
               </Button>
               <Button 
                 onClick={() => setResolveOpen(true)} 
                 className={`flex-1 sm:flex-none text-white ${isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
               >
                 <CheckCircle className="mr-2 h-4 w-4"/> Selesaikan
               </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- ALERT: PUNYA ROLE TAPI SALAH MODE --- */}
      {hasRightRoleButWrongMode && (
        <Card className="border-amber-200 bg-amber-50/30 border-dashed">
          <CardContent className="p-3 flex items-center gap-3 text-sm text-amber-800">
            <Lock className="h-4 w-4" />
            <span>
              Tiket ini ditujukan untuk role <b>{ticket.current_assignee_role}</b>. 
              Switch role Anda untuk memprosesnya.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Alerts Legacy */}
      {!ticket.service_category && (
        <TicketDetailAlerts
          ticket={ticket}
          currentUser={currentUser}
          activeRole={activeRole}
          onShowReviewDialog={() => {
            if (ticket.type === "perbaikan") {
              adminDialogs.setShowAssignDialog(true);
            } else {
              adminDialogs.setShowApproveDialog(true);
            }
          }}
          onShowRejectDialog={() => adminDialogs.setShowRejectDialog(true)}
          onShowAssignDialog={() => adminDialogs.setShowAssignDialog(true)}
          onShowDiagnosaDialog={() => setShowDiagnosisConfirm(true)}
          onShowSparepartDialog={() =>
            workOrderDialog.setShowSparepartDialog(true)
          }
          getWorkOrdersByTicket={getWorkOrdersByTicket}
          onUpdate={() => setRefreshKey((prev) => prev + 1)}
        />
      )}

      <DynamicTicketInfo ticket={ticket} />

      {/* Info */}
      <TicketDetailInfo
        ticket={ticket}
        ticketOwner={ticketOwner}
        assignedUser={assignedUser || undefined}
        comment={comment}
        onCommentChange={setComment}
        onAddComment={handleAddComment}
        isSubmittingComment={isSubmittingComment}
        getWorkOrdersByTicket={getWorkOrdersByTicket}
        comments={comments}
        commentsLoading={commentsLoading}
        hasMore={hasMore}
        onLoadMoreComments={() => loadMoreComments(ticketId)}
      />

      <div className="bg-white dark:bg-slate-900 rounded-lg border p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-2 text-slate-500 uppercase tracking-wider">
          Riwayat Tindak Lanjut (Workflow)
        </h3>
        <DynamicWorkflowActions 
          ticketId={ticketId} 
          onUpdate={refreshData}
        />
      </div>

      {/* Progress Tracker */}
      {ticket.type === "perbaikan" && <TicketProgressTracker ticket={ticket} />}
      {ticket.type === "zoom_meeting" && (
        <TicketProgressTrackerZoom ticket={ticket} />
      )}

      {/* ============== DIALOGS ============== */}

      <ResolveTicketDialog 
         open={resolveOpen} 
         onOpenChange={setResolveOpen} 
         ticket={ticket} 
         onSuccess={refreshData} 
      />
      <TransferTicketDialog 
         open={transferOpen} 
         onOpenChange={setTransferOpen} 
         ticket={ticket} 
         onSuccess={refreshData} 
      />

      {/* Approve */}
      <AlertDialog
        open={adminDialogs.showApproveDialog}
        onOpenChange={adminDialogs.setShowApproveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <Dialog
        open={adminDialogs.showRejectDialog}
        onOpenChange={adminDialogs.setShowRejectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tiket</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={adminDialogs.rejectReason}
            onChange={(e) => adminDialogs.setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => adminDialogs.setShowRejectDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign */}
      <Dialog
        open={adminDialogs.showAssignDialog}
        onOpenChange={adminDialogs.setShowAssignDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign ke Teknisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={adminDialogs.selectedTechnician}
              onValueChange={adminDialogs.setSelectedTechnician}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih teknisi" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({technicianStats[tech.id] || 0} aktif)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => adminDialogs.setShowAssignDialog(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button onClick={handleAssign} className="cursor-pointer">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={diagnosaDialog.showStatusChangeConfirm}
        onOpenChange={diagnosaDialog.setShowStatusChangeConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            Ini akan mengubah status tiket menjadi{" "}
            <span className="font-semibold text-blue-600">In Progress</span>.
            Lanjutkan?
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChangeOnDiagnosisSubmit}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosis Confirmation Dialog */}
      <AlertDialog
        open={showDiagnosisConfirm}
        onOpenChange={setShowDiagnosisConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ticket?.diagnosis ? "Ubah Diagnosis?" : "Isi Diagnosis?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            {ticket?.diagnosis
              ? "Anda akan mengubah hasil diagnosis sebelumnya. Pastikan informasi baru sudah diperiksa dengan teliti."
              : "Mulai dengan mengisi form diagnosis untuk menentukan kondisi barang dan opsi perbaikan."}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiagnosisConfirm(false);
                diagnosaDialog.setShowDiagnosaDialog(true);
              }}
              className="cursor-pointer"
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa Form */}
      <TicketDiagnosisForm
        ticketId={ticketId}
        ticketNumber={ticket.ticketNumber}
        open={diagnosaDialog.showDiagnosaDialog}
        onOpenChange={(open) => {
          diagnosaDialog.setShowDiagnosaDialog(open);
        }}
        existingDiagnosis={(ticket as any).diagnosis || null}
        onDiagnosisSubmitted={() => {
          setRefreshKey((prev) => prev + 1);
        }}
        ticketStatus={ticket.status}
        onRequestStatusChange={handleRequestStatusChange}
      />

      {/* Work Order Form */}
      <WorkOrderForm
        isOpen={workOrderDialog.showSparepartDialog}
        onClose={() => workOrderDialog.setShowSparepartDialog(false)}
        ticketId={Number(ticketId)}
        ticketStatus={ticket?.status || "in_progress"}
        workOrderCount={getWorkOrdersByTicket(ticketId).length}
        existingWorkOrders={getWorkOrdersByTicket(ticketId)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Zoom Modal */}
      {showZoomReviewModal && ticket.type === "zoom_meeting" && (
        <ZoomAdminReviewModal
          booking={ticket}
          onClose={() => setShowZoomReviewModal(false)}
          onUpdate={() => {
            setShowZoomReviewModal(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </motion.div>
  );
};