import React from "react";
import {
  CheckCircle,
  Send,
  UserCheck,
  Loader2,
  HelpCircle, 
  Info 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ===================================================================
// STATUS → WIZARD MAPPING
// ===================================================================

interface WizardStep {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const GENERIC_STEPS: WizardStep[] = [
  { 
    key: "submitted", 
    label: "Diajukan", 
    icon: Send,
    description: "Tiket telah dikirim oleh pembuat tiket dan sedang dalam antrean verifikasi awal oleh tim layanan."
  },
  { 
    key: "assigned", 
    label: "Ditugaskan", 
    icon: UserCheck,
    description: "Tiket telah diverifikasi dan tim layanan telah menunjuk petugas (Admin Layanan/Teknisi) untuk menangani permintaan Anda."
  },
  { 
    key: "in_progress", 
    label: "Diproses", 
    icon: Loader2,
    description: "Petugas sedang mengerjakan perbaikan atau memenuhi permintaan Anda. Anda dapat berinteraksi melalui kolom Diskusi."
  },
  { 
    key: "resolved", 
    label: "Selesai", 
    icon: CheckCircle,
    description: "Pekerjaan telah selesai dilakukan. Pembuat tiket dapat melakukan konfirmasi akhir untuk menutup tiket."
  },
];

// Map status to its step index
const getStepIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    submitted: 0,
    pending_review: 0,
    approved: 1,
    assigned: 1,
    in_progress: 2,
    on_hold: 2,
    waiting_for_submitter: 2,
    resolved: 3,
    completed: 3,
    closed: 3,
    rejected: -1,
    cancelled: -1,
  };
  return statusMap[status] ?? 0;
};

const isTerminalNegative = (status: string) =>
  ["rejected", "cancelled", "closed_unrepairable"].includes(status);


// ===================================================================
// WIZARD COMPONENT
// ===================================================================
interface TicketWizardProps {
  status: string;
}

export const TicketWizard: React.FC<TicketWizardProps> = ({ status }) => {
  const currentIdx = getStepIndex(status);
  const isNegative = isTerminalNegative(status);

  return (
    <div className="space-y-4">
      {/* Header with Title and Global Help */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          Alur Penyelesaian Tiket
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full transition-colors border border-blue-100">
              <HelpCircle className="h-3 w-3" /> Panduan Status
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-xl border-slate-200 shadow-xl">
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                   <Info className="h-4 w-4" />
                   <h4 className="font-black text-sm uppercase tracking-tight">Panduan Alur Kerja</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                   Setiap lingkaran di bawah mewakili tahapan utama dalam penyelesaian tiket Anda. Klik pada setiap ikon untuk melihat penjelasan detail langkahnya.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-2 border-t">
                   {GENERIC_STEPS.map((s, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                         <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                            {i+1}
                         </div>
                         <div>
                            <span className="text-[11px] font-black text-slate-700">{s.label}</span>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.description}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Wizard Row */}
      <div className="flex items-center w-full max-w-2xl mx-auto py-2">
        {GENERIC_STEPS.map((step, idx) => {
          let state: "done" | "active" | "upcoming" | "rejected" = "upcoming";
          if (isNegative) {
            state = "rejected";
          } else if (idx < currentIdx) {
            state = "done";
          } else if (idx === currentIdx) {
            state = "active";
          }

          const Icon = step.icon;
          const isLast = idx === GENERIC_STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Step circle with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex flex-col items-center gap-1.5 min-w-0 cursor-pointer group">
                    <div
                      className={`
                        h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                        ${state === "done" ? "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:scale-110" : ""}
                        ${state === "active" ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 hover:scale-110" : ""}
                        ${state === "upcoming" ? "bg-white border-slate-200 text-slate-400 group-hover:border-blue-400" : ""}
                        ${state === "rejected" ? "bg-red-100 border-red-300 text-red-500" : ""}
                      `}
                    >
                      {state === "done" ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className={`h-5 w-5 ${state === "active" ? "animate-pulse" : ""}`} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight max-md:hidden
                        ${state === "done" ? "text-green-600" : ""}
                        ${state === "active" ? "text-blue-600 font-bold" : ""}
                        ${state === "upcoming" ? "text-slate-400" : ""}
                        ${state === "rejected" ? "text-red-500" : ""}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent side="top" className="p-3 w-64 rounded-xl border-slate-200 shadow-lg">
                   <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                         <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${state === 'done' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Icon className="h-4 w-4" />
                         </div>
                         <h4 className="font-black text-xs uppercase tracking-tight text-slate-800">{step.label}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                         {step.description}
                      </p>
                   </div>
                </PopoverContent>
              </Popover>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 max-md:mx-1">
                  <div
                    className={`h-0.5 w-full rounded-full transition-all ${
                      state === "done" || (state === "active" && idx < currentIdx)
                        ? "bg-green-400"
                        : state === "rejected"
                        ? "bg-red-200"
                        : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ===================================================================
// RE-EXPORT EXISTING COMPONENTS WITH THEME UPDATES
// ===================================================================
// The header and info are in ticket-detail-info.tsx — we only export the wizard here.
