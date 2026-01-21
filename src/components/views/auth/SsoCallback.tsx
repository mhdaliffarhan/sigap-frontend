import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setCurrentUser } from "@/lib/storage"; // Pastikan path ini benar

// Definisikan tipe response agar autocomplete jalan
interface SsoResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: any;
}

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Memproses login...");
  const processingRef = useRef(false);

  useEffect(() => {
    const processLogin = async () => {
      const code = searchParams.get("code");

      if (!code || processingRef.current) return;
      processingRef.current = true;

      try {
        setStatus("Menghubungi server...");
        
        const response = await api.post<SsoResponse>("/auth/sso-callback", { code });
        const { access_token, user } = response;

        if (!access_token || !user) {
           throw new Error("Format respon server tidak sesuai.");
        }

        // Simpan token & user
        localStorage.setItem("token", access_token);
        setCurrentUser(user);
        
        toast.success(`Selamat datang, ${user.name}`);
        
        // --- PERBAIKAN DI SINI ---
        // Gunakan window.location.href alih-alih navigate
        // Ini memaksa reload halaman agar state auth terbaca sempurna oleh AppRouter
        
        let targetUrl = "/dashboard"; // Default route
        
        if (user.role === 'super_admin') targetUrl = "/super-admin";
        else if (user.role === 'admin_layanan') targetUrl = "/admin-layanan";
        else if (user.role === 'admin_penyedia') targetUrl = "/admin-penyedia";
        else if (user.role === 'teknisi') targetUrl = "/teknisi";
        
        // Hard redirect
        window.location.href = targetUrl;

      } catch (error: any) {
        console.error("SSO Error Detail:", error);
        
        let errorMsg = "Login Gagal.";
        if (error.body && error.body.message) {
            errorMsg = error.body.message;
        } else if (error.message) {
            errorMsg = error.message;
        }

        toast.error(errorMsg);
        setTimeout(() => navigate("/login"), 2000); // Kalau error, baru pakai navigate
      }
    };

    processLogin();
  }, [navigate, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Sedang Memverifikasi...</h3>
        <p className="text-gray-500 text-sm mt-2">{status}</p>
      </div>
    </div>
  );
}