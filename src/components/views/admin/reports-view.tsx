import React, { useState } from "react";
import { KartuKendaliList } from "@/components/views/shared/kartu-kendali-list";
import { KartuKendaliDetail } from "@/components/views/shared/kartu-kendali-detail";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resolveApiUrl } from "@/lib/api";
import type { User } from "@/types";

interface ReportsViewProps {
  currentUser: User;
}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export semua kartu kendali ke Excel
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(resolveApiUrl("/kartu-kendali/export"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `kartu_kendali_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Berhasil mengexport Kartu Kendali");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-start">
            Kartu Kendali
          </h1>
          <p className="text-gray-500">
            Riwayat pemeliharaan aset yang telah selesai
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 text-white max-md:w-full"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
          ) : (
            <Download className="mr-2 h-4 w-4 text-white" />
          )}
          <span>Unduh Laporan (.xlsx)</span>
        </Button>
      </div>

      <KartuKendaliList
        onViewDetail={(ticketId) => {
          setSelectedTicketId(ticketId);
          setShowDetailDialog(true);
        }}
      />

      <KartuKendaliDetail
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
      />
    </div>
  );
};
