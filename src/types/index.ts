// src/types/index.ts

// --- 1. IMPORT BARU (Pastikan file dynamic-service.ts ada di folder yang sama) ---
import type { ServiceCategory, Resource } from './dynamic-service';

export type UserRole =
  | "super_admin"
  | "admin_layanan"
  | "admin_penyedia"
  | "teknisi"
  | "pegawai";

// --- 2. UPDATE TICKET TYPE (Agar bisa string bebas untuk slug layanan dinamis) ---
export type TicketType = "perbaikan" | "zoom_meeting" | string;

export type PerbaikanStatus =
  | "pending_review"        // Menunggu review
  | "submitted"             // Tiket baru diajukan
  | "assigned"              // Ditugaskan ke teknisi
  | "in_progress"           // Sedang dikerjakan teknisi
  | "on_hold"               // Menunggu WO (sparepart/vendor)
  | "waiting_for_submitter" // Menunggu konfirmasi dari submitter/pegawai
  | "closed"                // Selesai & dikonfirmasi
  | "approved"              // Disetujui
  | "rejected";             // Ditolak

export type ZoomStatus = 
  | 'pending_review'   // Menggantikan 'menunggu_review' 
  | 'approved'         // Disetujui
  | 'rejected'         // Ditolak
  | 'cancelled';       // Menggantikan 'dibatalkan'

export type SeverityLevel = "low" | "normal" | "high" | "critical";

export type ProblemType = "hardware" | "software" | "lainnya";

export type RepairType =
  | "direct_repair"      // Bisa diperbaiki langsung
  | "need_sparepart"     // Butuh sparepart
  | "need_vendor"        // Butuh vendor
  | "need_license"       // Butuh lisensi
  | "unrepairable";      // Tidak dapat diperbaiki

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  nip: string;
  jabatan: string;
  role: UserRole;
  roles: UserRole[];
  unitKerja: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  attachments?: Attachment[];
}

// --- 3. UPDATE BASE TICKET (Menambah Field Dinamis) ---
interface BaseTicket {
  id: string;
  ticketNumber: string;
  type: TicketType;
  title: string;
  description: string;
  categoryId?: string;

  // Info Pengguna (denormalized)
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  unitKerja?: string;

  assignedTo?: string;
  createdAt: string;
  updatedAt: string;

  // Alasan penolakan (untuk semua tipe tiket)
  rejectionReason?: string;

  attachments: Attachment[];
  timeline: TimelineEvent[];

  commentsCount?: number;

  // === FIELD BARU UNTUK LAYANAN DINAMIS ===
  service_category_id?: string;
  service_category?: ServiceCategory;
  
  resource_id?: string;
  resource?: Resource;
  
  start_date?: string;
  end_date?: string;
  dynamic_form_data?: Record<string, any>; // Menyimpan data JSON form
  current_assignee_role?: string;
  // =========================================
}

export interface PerbaikanTicket extends BaseTicket {
  type: "perbaikan";
  status: PerbaikanStatus;
  severity: SeverityLevel;
  data: Record<string, any>;

  assetCode?: string;
  assetNUP?: string;
  assetLocation?: string;
  finalProblemType?: ProblemType;
  repairable?: boolean;
  unrepairableReason?: string;

  workOrderId?: string;
  workOrders?: WorkOrder[];

  diagnosis?: TicketDiagnosis;

  buttonStatus?: {
    ubahDiagnosis: { enabled: boolean; reason: string | null; };
    workOrder: { enabled: boolean; reason: string | null; };
    selesaikan: { enabled: boolean; reason: string | null; };
  };
}

export interface ZoomTicket extends BaseTicket {
  type: "zoom_meeting";
  status: ZoomStatus;

  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedParticipants: number;
  coHosts: { name: string; email: string }[];
  breakoutRooms: number;

  meetingLink?: string;
  meetingId?: string;
  passcode?: string;
  rejectionReason?: string;

  zoomAccountId?: number;
  zoomAccount?: {
    id: number;
    accountId: string;
    name: string;
    email: string;
    hostKey?: string;
    color?: string;
  };

  suggestedAccountId?: number;
}

// --- 4. INTERFACE UNTUK TIKET DINAMIS (Generic) ---
export interface DynamicTicket extends BaseTicket {
  // Type-nya string dinamis (slug), misal "peminjaman-kendaraan"
  // Statusnya juga string dinamis
  status: string; 
}

// --- 5. UPDATE TICKET UNION ---
export type Ticket = PerbaikanTicket | ZoomTicket | DynamicTicket;

export interface SparepartItem {
  name: string;
  quantity: number;
  unit: string;
  remarks?: string;
  estimatedPrice?: number;
}

export type WorkOrderType = "sparepart" | "vendor" | "license";
export type WorkOrderStatus =
  | "requested"
  | "in_procurement"
  | "completed"
  | "unsuccessful";
  
export interface WorkOrder {
  id: string;
  ticketId: string;
  ticketNumber?: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;

  items?: any; 
  spareparts?: SparepartItem[];

  vendorName?: string;
  vendorContact?: string;
  vendorDescription?: string;

  licenseName?: string;
  licenseDescription?: string;

  completionNotes?: string;
  failureReason?: string;

  vendorInfo?: {
    name?: string;
    contact?: string;
    description?: string;
    completionNotes?: string;
  };

  ticket?: Ticket;
  completedAt?: string;
  timeline: TimelineEvent[];
}

export interface KartuKendali {
  id: string;
  assetCode: string;
  assetNUP: string;
  assetName: string;
  createdAt: string;
  entries: KartuKendaliEntry[];
}

export interface KartuKendaliEntry {
  id: string;
  ticketId: string;
  workOrderId: string;
  date: string;
  createdBy: string;

  vendorName?: string;
  vendorRef?: string;

  licenseName?: string;
  licenseDescription?: string;

  spareparts?: SparepartItem[];
  remarks?: string;
  createdAt: string;
}

export interface TicketDiagnosis {
  id: string;
  ticketId: string;
  technicianId: string;

  technician?: {
    id: string;
    name: string;
    email: string;
  };

  problem_description: string;
  problem_category: "hardware" | "software" | "lainnya";

  repair_type: RepairType;
  repair_description?: string;

  unrepairable_reason?: string;
  alternative_solution?: string;
  asset_condition_change?: string;

  technician_notes?: string;
  estimasi_hari?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}