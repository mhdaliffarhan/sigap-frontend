// src/components/views/services/service-catalog.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dynamicServiceApi } from '@/lib/api';
import type { ServiceCategory } from '@/types/dynamic-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Car, Building, Wrench, FileText, ArrowRight, 
  Video, Boxes, ShieldCheck,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ServiceCatalog() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await dynamicServiceApi.getServices();
      setServices(data);
    } catch (error) {
      console.error("Gagal memuat layanan", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk memilih icon secara dinamis dengan warna premium
  const getIcon = (iconName?: string, type?: string) => {
    const size = "h-7 w-7";
    if (type === 'booking') {
      if (iconName === 'car') return <div className="p-3 bg-blue-500/10 rounded-xl"><Car className={`${size} text-blue-600`} /></div>;
      return <div className="p-3 bg-indigo-500/10 rounded-xl"><Building className={`${size} text-indigo-600`} /></div>;
    }
    if (type === 'repair') return <div className="p-3 bg-orange-500/10 rounded-xl"><Wrench className={`${size} text-orange-600`} /></div>;
    if (iconName === 'zoom') return <div className="p-3 bg-cyan-500/10 rounded-xl"><Video className={`${size} text-cyan-600`} /></div>;
    return <div className="p-3 bg-slate-500/10 rounded-xl"><FileText className={`${size} text-slate-600`} /></div>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Katalog SIGAP...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 lg:p-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-blue-600 p-8 lg:p-12 text-white shadow-2xl shadow-blue-200">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 bg-blue-500/30 text-white border-none backdrop-blur-md px-3 py-1">
            <Sparkles className="h-3 w-3 mr-2 inline" /> Sistem Layanan Terpadu
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Apa yang bisa kami bantu hari ini?
          </h1>
          <p className="text-blue-100 text-lg lg:text-xl leading-relaxed opacity-90">
            Pilih katalog layanan di bawah ini untuk memulai pengajuan. Kami siap melayani kebutuhan operasional Anda dengan cepat dan transparan.
          </p>
        </div>
        <Boxes className="absolute -right-10 -bottom-10 h-64 w-64 text-blue-500 opacity-20 rotate-12" />
      </div>

      {/* CATEGORY TABS / FILTERS (Optional for future) */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Button variant="secondary" className="rounded-full px-6 bg-blue-600 text-white hover:bg-blue-700">Semua Layanan</Button>
        <Button variant="outline" className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-slate-50">Booking & Reservasi</Button>
        <Button variant="outline" className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-slate-50">Perawatan Asset</Button>
        <Button variant="outline" className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-slate-50">Administrasi Umum</Button>
      </div>

      {/* GRID SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((service) => (
          <Card 
            key={service.id} 
            className="group relative overflow-hidden border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-white/70 backdrop-blur-sm"
            onClick={() => navigate(`/services/${service.slug}`)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>

            <CardHeader className="pt-8 px-8">
              <div className="mb-6 w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                {getIcon(service.icon, service.type)}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {service.name}
                </CardTitle>
                <div className="flex items-center gap-2 pt-1">
                   <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none px-0 ${
                     service.type === 'booking' ? 'text-indigo-500' : 
                     service.type === 'repair' ? 'text-orange-500' : 'text-slate-400'
                   }`}>
                     {service.type === 'booking' ? 'Reservasi' : 
                      service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                   </Badge>
                   <span className="text-slate-300">•</span>
                   <span className="text-[10px] text-slate-400 font-medium">SIGAP Engine</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 pt-2">
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed italic">
                {service.description || "Solusi cerdas untuk kebutuhan operasional kantor Anda."}
              </p>
              
              <div className="mt-8 flex items-center group/btn text-blue-600 font-bold text-sm">
                Buka Layanan
                <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-2" />
              </div>
            </CardContent>
            
            {/* Background Accent */}
            <div className={`absolute -bottom-1 -right-1 h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${
              service.type === 'booking' ? 'bg-indigo-400' : 
              service.type === 'repair' ? 'bg-orange-400' : 'bg-blue-400'
            }`} />
          </Card>
        ))}
        
        {/* ADD EMPTY STATE / COMING SOON CARD IF FEW SERVICES */}
        {services.length < 4 && (
          <Card className="border-2 border-dashed border-slate-200 bg-transparent shadow-none flex flex-col items-center justify-center p-8 text-center opacity-50">
             <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
               <ShieldCheck className="h-6 w-6 text-slate-400" />
             </div>
             <p className="text-sm font-semibold text-slate-900">Layanan Lain Segera Hadir</p>
             <p className="text-xs text-slate-500 mt-1">Kami terus berinovasi untuk Anda.</p>
          </Card>
        )}
      </div>
    </div>
  );
}