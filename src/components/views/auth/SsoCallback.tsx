import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setCurrentUser } from "@/lib/storage";
import { motion } from "motion/react";

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
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 flex flex-col items-center max-w-sm w-full"
      >
        <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-blue-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Memverifikasi</h3>
        <p className="text-gray-500 text-sm mt-2 text-center animate-pulse">{status}</p>
      </motion.div>
    </div>
  );
}