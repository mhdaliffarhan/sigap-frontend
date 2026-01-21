import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api"; // Menggunakan instance api yang sudah ada
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Memproses login...");

  useEffect(() => {
    const processLogin = async () => {
      const code = searchParams.get("code");

      if (!code) {
        toast.error("Kode otorisasi tidak ditemukan");
        navigate("/login");
        return;
      }

      try {
        setStatus("Menghubungi server...");
        // Kirim code ke Backend SIGAP
        const response = await api.post("/auth/sso-callback", { code });

        const { token, user } = response.data;

        // Simpan ke Local Storage (sesuai struktur auth SIGAP)
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success(`Selamat datang, ${user.name}`);

        // Redirect berdasarkan role (sesuaikan logika dashboard SIGAP)
        if (user.role === 'super_admin') navigate("/super-admin");
        else if (user.role === 'admin_layanan') navigate("/admin-layanan");
        else navigate("/dashboard"); // Default user dashboard

      } catch (error: any) {
        console.error("SSO Error:", error);
        toast.error(error.response?.data?.message || "Login Gagal");
        navigate("/login");
      }
    };

    processLogin();
  }, [navigate, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}