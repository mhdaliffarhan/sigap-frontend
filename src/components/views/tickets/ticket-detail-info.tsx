import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  FolderKanban,
  Package,
  Truck,
  FileText,
  Loader2,
  User as UserIcon,
  MapPin,
  Barcode,
  Clock
} from "lucide-react";
import type { User, Ticket } from "@/types";
import { TicketDiagnosisDisplay } from "@/components/views/tickets/ticket-diagnosis-display";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

// --- HELPER FUNCTION ---
const getInitials = (name: string = "") => {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper untuk akses properti yang mungkin beda format (snake_case vs camelCase)
const getTicketProp = (ticket: any, keySnake: string, keyCamel: string) => {
  return ticket[keySnake] ?? ticket[keyCamel];
};

// --- HEADER COMPONENT ---
interface TicketDetailHeaderProps {
  ticket: Ticket;
  currentUser: User;
  canComplete: boolean;
  onBack: () => void;
  onShowCompleteDialog: () => void;
}

export const TicketDetailHeader: React.FC<TicketDetailHeaderProps> = ({
  ticket,
  canComplete,
  onBack,
  onShowCompleteDialog,
}) => {
  // Ambil nomor tiket dengan aman (backend kirim ticket_number)
  const ticketNumber = getTicketProp(ticket, 'ticket_number', 'ticketNumber');

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-full h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-xs">
              #{ticketNumber || ticket.id}
            </Badge>
            <Badge
              variant={
                ["closed", "selesai", "approved", "resolved", "completed"].includes(ticket.status)
                  ? "default"
                  : ["rejected", "cancelled", "closed_unrepairable"].includes(ticket.status)
                  ? "destructive"
                  : "secondary"
              }
              className="capitalize"
            >
              {ticket.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canComplete && (
          <Button
            onClick={onShowCompleteDialog}
            className="bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Konfirmasi Selesai
          </Button>
        )}
      </div>
    </div>
  );
};

// --- INFO & CHAT COMPONENT ---
interface TicketDetailInfoProps {
  ticket: Ticket;
  ticketOwner: User | undefined;
  assignedUser: User | undefined;
  comment: string;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  isSubmittingComment: boolean;
  getWorkOrdersByTicket: (ticketId: string) => any[];
  comments: any[];
  commentsLoading: boolean;
  hasMore: boolean;
  onLoadMoreComments: () => void;
}

export const TicketDetailInfo: React.FC<TicketDetailInfoProps> = ({
  ticket,
  ticketOwner: propTicketOwner,
  assignedUser: propAssignedUser,
  comment,
  onCommentChange,
  onAddComment,
  isSubmittingComment,
  getWorkOrdersByTicket,
  comments,
  commentsLoading,
  hasMore,
  onLoadMoreComments,
}) => {
  const [assetData, setAssetData] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // PRIORITASKAN DATA DARI OBJEK TICKET (Backend Relations)
  // Backend mengirim 'user' (pelapor) dan 'assigned_user' (PJ) di dalam resource ticket
  const activeTicketOwner = (ticket as any).user || propTicketOwner;
  const activeAssignedUser = (ticket as any).assigned_user || propAssignedUser;

  // Auto scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  // Fetch asset data
  useEffect(() => {
    const fetchAssetData = async () => {
      const perbaikanTicket = ticket as any;
      if (
        ticket.type !== "perbaikan" ||
        !perbaikanTicket.kode_barang || // Pake key snake_case sesuai backend
        !perbaikanTicket.nup
      ) {
        // Coba check camelCase if snake_case fail
        if(!perbaikanTicket.assetCode || !perbaikanTicket.assetNUP) return;
      }

      const code = perbaikanTicket.kode_barang || perbaikanTicket.assetCode;
      const nup = perbaikanTicket.nup || perbaikanTicket.assetNUP;

      try {
        setLoadingAsset(true);
        const response = await api.get<{ asset: any }>(
          `assets/search/by-code-nup?asset_code=${code}&asset_nup=${nup}`
        );
        if ((response as any).asset) {
          setAssetData((response as any).asset);
        }
      } catch (error) {
        console.error("Error fetching asset data:", error);
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAssetData();
  }, [ticket]);

  // Fetch diagnosis
  const handleOpenDiagnosisModal = async () => {
    if (!ticket.id) return;
    try {
      setLoadingDiagnosis(true);
      const response = await api.get<{ success: boolean; data: any }>(
        `/tickets/${ticket.id}/diagnosis`
      );
      if ((response as any).success && (response as any).data) {
        setDiagnosisData((response as any).data);
      }
    } catch (error) {
      console.error("Error fetching diagnosis data:", error);
    } finally {
      setLoadingDiagnosis(false);
    }
    setShowDiagnosisModal(true);
  };

  const attachmentList = Array.isArray((ticket as any).attachments)
    ? (ticket as any).attachments
    : [];

  // Helper render role badge
  const renderRoleBadge = (role: string) => {
    if(!role) return null;
    let colorClass = "bg-gray-100 text-gray-600";
    if(role.includes('admin')) colorClass = "bg-purple-100 text-purple-700";
    if(role.includes('teknisi')) colorClass = "bg-orange-100 text-orange-700";
    if(role.includes('super')) colorClass = "bg-red-100 text-red-700";
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ml-2 ${colorClass}`}>
        {role.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KOLOM KIRI: DISKUSI & TIMELINE (2/3 Lebar) */}
      <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
        
        {/* DISKUSI CARD */}
        <Card className="flex flex-col h-[600px] shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <MessageSquare className="h-4 w-4 text-blue-500" /> Diskusi & Aktivitas
            </CardTitle>
          </CardHeader>
          
          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30" ref={scrollRef}>
            {commentsLoading && comments.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Belum ada diskusi. Mulai percakapan sekarang.
              </div>
            ) : (
              <>
                {hasMore && (
                  <div className="text-center mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onLoadMoreComments} 
                      disabled={commentsLoading}
                      className="text-xs text-slate-500"
                    >
                      {commentsLoading ? "Memuat..." : "Load pesan lama"}
                    </Button>
                  </div>
                )}
                {comments.map((c: any) => {
                  const isSystem = c.user_role === 'system';
                  
                  if (isSystem) {
                    return (
                        <div key={c.id} className="flex justify-center my-4">
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {c.content} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: id })}
                            </span>
                        </div>
                    )
                  }

                  return (
                    <div key={c.id} className="flex gap-3 group">
                      <Avatar className="h-8 w-8 mt-1 border border-slate-200 shrink-0">
                        <AvatarImage src={c.user?.avatar || c.user?.avatar_url} />
                        <AvatarFallback className="bg-white text-[10px] text-slate-600 font-bold">
                          {getInitials(c.user?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 max-w-[85%]">
                        <div className="flex items-center flex-wrap gap-1 mb-1">
                          <span className="text-xs font-bold text-slate-700">
                            {c.user?.name || "User"}
                          </span>
                          {/* Role Badge */}
                          {c.user_role && renderRoleBadge(c.user_role)}
                          
                          <span className="text-[10px] text-slate-400 ml-1">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: id })}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm text-slate-700 shadow-sm relative">
                          <p className="whitespace-pre-wrap leading-relaxed">{c.comment || c.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-3 items-end">
              <Textarea 
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Tulis balasan atau catatan..."
                className="min-h-[40px] max-h-[120px] resize-none focus-visible:ring-blue-500 py-3"
              />
              <Button 
                onClick={onAddComment} 
                disabled={isSubmittingComment || !comment.trim()}
                className="h-[40px] w-[40px] p-0 bg-blue-600 hover:bg-blue-700 shrink-0 rounded-full"
              >
                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 ml-0.5" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* WORK ORDERS (Legacy) */}
        {ticket.type === "perbaikan" && getWorkOrdersByTicket(ticket.id).length > 0 && (
            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" /> Work Orders
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {getWorkOrdersByTicket(ticket.id).map((wo) => (
                        <div key={wo.id} className="bg-slate-50 rounded-lg p-3 border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {wo.type === "sparepart" ? (
                                    <Package className="h-4 w-4 text-purple-600" />
                                ) : (
                                    <Truck className="h-4 w-4 text-orange-600" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">{wo.type === 'sparepart' ? 'Permintaan Sparepart' : 'Jasa Vendor'}</p>
                                    <p className="text-xs text-slate-500">{new Date(wo.createdAt).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase">
                                {wo.status.replace("_", " ")}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
      </div>

      {/* KOLOM KANAN: METADATA (1/3 Lebar) */}
      <div className="space-y-6 order-1 lg:order-2">
        
        {/* CARD 1: PELAPOR & PJ */}
        <Card>
          <CardHeader className="pb-3 border-b bg-slate-50/30">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Orang Terkait
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mb-6">
            {/* Pelapor */}
            <div className="p-4 flex items-center gap-3 border-b border-dashed">
                <Avatar className="h-9 w-9 border">
                    <AvatarFallback>{getInitials(activeTicketOwner?.name || "?")}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <p className="text-xs text-slate-500 mb-0.5">Pelapor</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                        {activeTicketOwner?.name || "Tidak diketahui"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                        {activeTicketOwner?.unit_kerja || activeTicketOwner?.unitKerja || activeTicketOwner?.jabatan || "Pegawai"}
                    </p>
                </div>
            </div>

            {/* PJ */}
            <div className="p-4 flex items-center gap-3">
                {activeAssignedUser ? (
                    <>
                        <Avatar className="h-9 w-9 border bg-blue-50 text-blue-600">
                            <AvatarFallback>{getInitials(activeAssignedUser.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-slate-500 mb-0.5">Penanggung Jawab</p>
                            <p className="text-sm font-bold text-slate-900">{activeAssignedUser.name}</p>
                            <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                {activeAssignedUser.role?.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3 w-full opacity-60">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-dashed">
                            <UserIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Penanggung Jawab</p>
                            <p className="text-sm italic text-slate-400">
                                {ticket.status === 'resolved' || ticket.status === 'completed' 
                                  ? "Selesai (Arsip)" 
                                  : (ticket as any).current_assignee_role 
                                    ? `Menunggu ${(ticket as any).current_assignee_role.replace('_', ' ')}`
                                    : "Belum ditugaskan"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: INFORMASI ASET (Khusus Perbaikan) */}
        {ticket.type === "perbaikan" && (
            <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/30">
                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Aset Terkait
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {loadingAsset ? (
                        <div className="text-center py-4 text-xs text-slate-400">Memuat data aset...</div>
                    ) : (
                        <>
                            <div className="flex items-start gap-3">
                                <Package className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Nama Barang</p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {assetData?.asset_name || (ticket as any).assetName || (ticket as any).nama_barang || "-"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Barcode className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Kode / NUP</p>
                                        <p className="text-xs font-mono bg-slate-100 px-1 rounded inline-block mt-0.5">
                                            {(ticket as any).kode_barang || (ticket as any).assetCode} / {(ticket as any).nup || (ticket as any).assetNUP}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500">Lokasi</p>
                                        <p className="text-xs font-medium">
                                            {(ticket as any).asset_location || (ticket as any).assetLocation || assetData?.lokasi || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {(ticket as any).diagnosis && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2 text-xs"
                                    onClick={handleOpenDiagnosisModal}
                                >
                                    <FileText className="h-3 w-3 mr-2" /> Lihat Diagnosis
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        )}

        {/* CARD 3: META INFO & ATTACHMENTS */}
        <Card>
          <CardContent className="py-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deskripsi Masalah</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {ticket.description}
              </p>
            </div>
            
            {attachmentList.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Lampiran</p>
                  <div className="space-y-2">
                    {attachmentList.map((att: any, idx: number) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                      >
                        <Paperclip className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                        <span className="text-xs text-slate-600 truncate group-hover:text-blue-700">
                            {att.name || `Lampiran ${idx + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* MODALS */}
      <Dialog open={showDiagnosisModal} onOpenChange={setShowDiagnosisModal}>
        <DialogContent className="md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hasil Diagnosis Awal</DialogTitle>
          </DialogHeader>
          {loadingDiagnosis ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <TicketDiagnosisDisplay diagnosis={diagnosisData} />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};