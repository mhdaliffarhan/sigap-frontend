import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Wrench, FileText, ArrowRight, Loader2,
  Search, Package, ChevronRight, Sparkles, Boxes
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

  // Helper Icon dengan gaya premium
  const getTypeIcon = (type: string) => {
    const size = "h-7 w-7";
    switch (type) {
      case 'booking':
        return <div className="p-3 bg-blue-500/10 rounded-xl"><Calendar className={`${size} text-blue-600`} /></div>;
      case 'repair':
        return <div className="p-3 bg-orange-500/10 rounded-xl"><Wrench className={`${size} text-orange-600`} /></div>;
      case 'service':
        return <div className="p-3 bg-emerald-500/10 rounded-xl"><FileText className={`${size} text-emerald-600`} /></div>;
      default:
        return <div className="p-3 bg-slate-500/10 rounded-xl"><Package className={`${size} text-slate-600`} /></div>;
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
      {/* HEADER SECTION - PREMIUM STYLE */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-14 text-white shadow-2xl shadow-blue-200/50">
        <div className="relative z-10 max-w-2xl text-left">
          <Badge className="mb-4 bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 mr-2 inline text-yellow-300" /> Sistem Layanan Terpadu
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Pilih Layanan
          </h2>
          <p className="text-blue-50 text-lg lg:text-xl leading-relaxed opacity-90 font-medium">
            Apa yang bisa kami bantu hari ini? Pilih layanan di bawah untuk mulai membuat pengajuan baru.
          </p>

          <div className="relative mt-10 max-w-md group">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200 group-focus-within:text-white transition-all duration-300 z-10" />
            <Input
              placeholder="Cari layanan (misal: Aula, Laptop)..."
              className="pl-20 h-16 bg-white/10 border-white/20 text-white placeholder:text-blue-100/50 rounded-2xl focus:ring-4 focus:ring-white/20 focus:bg-white/20 transition-all border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
              style={{ paddingLeft: '4.8rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Boxes className="absolute -right-10 -bottom-10 h-80 w-80 text-white opacity-10 rotate-12" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* Grid Cards */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
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
              className="group relative overflow-hidden border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-white"
              onClick={() => onSelectService(service)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <CardHeader className="pt-8 px-8 flex flex-col items-start gap-4">
                <div className="w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  {getTypeIcon(service.type)}
                </div>
                <div className="space-y-1 text-left w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none px-0 ${service.type === 'booking' ? 'text-indigo-500' :
                        service.type === 'repair' ? 'text-orange-500' : 'text-emerald-500'
                      }`}>
                      {service.type === 'booking' ? 'Reservasi' :
                        service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                    </Badge>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400 font-medium italic">Tersedia</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {service.name}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="px-8 pb-8 pt-2 text-left">
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed italic">
                  {service.description || "Solusi cerdas untuk kebutuhan operasional kantor Anda."}
                </p>

                <div className="mt-8 flex items-center group/btn text-blue-600 font-bold text-sm">
                  Pilih & Buat Pengajuan
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-2" />
                </div>
              </CardContent>

              <div className={`absolute -bottom-1 -right-1 h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${service.type === 'booking' ? 'bg-indigo-400' :
                  service.type === 'repair' ? 'bg-orange-400' : 'bg-emerald-400'
                }`} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
