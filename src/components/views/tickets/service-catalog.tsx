import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Wrench, FileText, ArrowRight, Loader2, Search, Package } from 'lucide-react';
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
  // form_schema dll tidak perlu ditampilkan di card, nanti diambil saat detail
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
        const res = await api.get('/service-categories');
        
        // Logika ekstraksi data yang aman (sama seperti di Admin Panel)
        let dataToSet = [];
        if (Array.isArray(res)) dataToSet = res;
        else if (res?.data && Array.isArray(res.data)) dataToSet = res.data;
        else if (res?.data?.data && Array.isArray(res.data.data)) dataToSet = res.data.data;

        // Hanya tampilkan layanan yang AKTIF
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

  // Helper Icon berdasarkan Tipe
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'booking': return <Calendar className="h-6 w-6 text-blue-600" />;
      case 'repair': return <Wrench className="h-6 w-6 text-orange-600" />;
      case 'service': return <FileText className="h-6 w-6 text-emerald-600" />;
      default: return <Package className="h-6 w-6 text-slate-600" />;
    }
  };

  // Helper Warna Badge
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'booking': return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
      case 'repair': return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100";
      case 'service': return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Filter pencarian di client-side
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
        <p>Sedang memuat layanan tersedia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pilih Layanan</h2>
          <p className="text-slate-500 text-lg">Apa yang bisa kami bantu hari ini?</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari layanan (misal: Aula, Laptop)..." 
            className="pl-10 h-10 bg-white shadow-sm border-slate-300 focus:border-blue-500" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Cards */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Layanan tidak ditemukan</h3>
          <p className="text-slate-500">Coba kata kunci lain atau hubungi admin jika layanan belum tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="group cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden relative"
              onClick={() => onSelectService(service)}
            >
              {/* Decorative gradient top bar */}
              <div className={`h-1.5 w-full absolute top-0 left-0 ${
                service.type === 'booking' ? 'bg-blue-500' : 
                service.type === 'repair' ? 'bg-orange-500' : 'bg-emerald-500'
              }`} />

              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-6">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  service.type === 'booking' ? 'bg-blue-50 group-hover:bg-blue-100' : 
                  service.type === 'repair' ? 'bg-orange-50 group-hover:bg-orange-100' : 'bg-emerald-50 group-hover:bg-emerald-100'
                }`}>
                  {getTypeIcon(service.type)}
                </div>
                <Badge variant="outline" className={`capitalize font-medium ${getTypeColor(service.type)}`}>
                  {service.type}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-2 mb-4">
                <CardTitle className="text-xl group-hover:text-blue-700 transition-colors">
                  {service.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-slate-600 mb-6 h-[40px]">
                  {service.description || "Tidak ada deskripsi layanan."}
                </CardDescription>
                
                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Buat Pengajuan <ArrowRight className="ml-1.5 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};