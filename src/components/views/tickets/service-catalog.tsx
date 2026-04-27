import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Wrench, FileText, ArrowRight, Loader2,
  Search, Package, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Tipe data sesuai response backend
interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  type: 'booking' | 'repair' | 'service';
  is_active: boolean;
  slug: string;
}

interface ServiceCatalogProps {
  onSelectService: (service: ServiceCategory) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onSelectService }) => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/service-categories');

        let dataToSet = [];
        if (Array.isArray(res)) dataToSet = res;
        else if (res?.data && Array.isArray(res.data)) dataToSet = res.data;
        else if (res?.data?.data && Array.isArray(res.data.data)) dataToSet = res.data.data;

        const activeServices = dataToSet.filter((s: any) => s.is_active);
        setServices(activeServices);
      } catch (error) {
        console.error("Gagal memuat layanan", error);
        toast.error("Gagal memuat daftar layanan");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Helper Icon dengan gaya sederhana & konsisten
  const getTypeIcon = (type: string) => {
    const size = "h-5 w-5";
    switch (type) {
      case 'booking':
        return <div className="p-2.5 bg-blue-50 rounded-lg"><Calendar className={`${size} text-blue-500`} /></div>;
      case 'repair':
        return <div className="p-2.5 bg-orange-50 rounded-lg"><Wrench className={`${size} text-orange-500`} /></div>;
      case 'service':
        return <div className="p-2.5 bg-emerald-50 rounded-lg"><FileText className={`${size} text-emerald-500`} /></div>;
      default:
        return <div className="p-2.5 bg-slate-50 rounded-lg"><Package className={`${size} text-slate-500`} /></div>;
    }
  };

  // Filter pencarian
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Katalog SIGAP...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:p-0 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* HEADER SECTION - CLEAN & PROFESSIONAL STYLE */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 lg:p-12 shadow-sm">
        <div className="relative z-10 max-w-2xl text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pusat Layanan Terpadu</span>
          </div>
          
          <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 text-slate-800">
            Pilih Layanan
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            Apa yang bisa kami bantu hari ini? Pilih kategori di bawah untuk mulai membuat pengajuan baru Anda.
          </p>

          <div className="relative mt-8 max-w-md group">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
            <Input
              placeholder="Cari layanan (misal: Ruangan, Perbaikan)..."
              className="pl-14 h-14 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-blue-100 transition-all border ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
      </div>

      {/* Grid Cards */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-900">Layanan tidak ditemukan</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Coba kata kunci lain atau hubungi admin jika Anda memerlukan bantuan khusus.</p>
          <Button variant="outline" onClick={() => setSearch('')} className="mt-6 rounded-xl">Lihat Semua Layanan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="group relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer bg-white rounded-xl"
              onClick={() => onSelectService(service)}
            >
              <CardHeader className="pt-6 px-6 flex flex-row items-center gap-4">
                <div className="shrink-0">
                  {getTypeIcon(service.type)}
                </div>
                <div className="space-y-0.5 text-left flex-1 min-w-0">
                  <Badge variant="outline" className={`text-[9px] uppercase font-bold border-none p-0 h-auto ${
                      service.type === 'booking' ? 'text-blue-500' :
                      service.type === 'repair' ? 'text-orange-500' : 'text-emerald-500'
                    }`}>
                    {service.type === 'booking' ? 'Reservasi' :
                      service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                  </Badge>
                  <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    {service.name}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6 pt-0 text-left">
                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed mb-4">
                  {service.description || "Solusi cerdas untuk kebutuhan operasional kantor Anda."}
                </p>
                <div className="flex items-center text-blue-600 font-bold text-xs">
                  Buat Pengajuan
                  <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
