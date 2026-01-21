// src/components/views/services/service-catalog.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dynamicServiceApi } from '@/lib/api';
import type { ServiceCategory } from '@/types/dynamic-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Building, Wrench, FileText, ArrowRight } from 'lucide-react';

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

  // Helper untuk memilih icon secara dinamis
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'car': return <Car className="h-8 w-8 text-blue-500" />;
      case 'building': return <Building className="h-8 w-8 text-green-500" />;
      case 'wrench': return <Wrench className="h-8 w-8 text-orange-500" />;
      default: return <FileText className="h-8 w-8 text-slate-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat Katalog Layanan...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Katalog Layanan</h1>
        <p className="text-muted-foreground">Pilih layanan yang Anda butuhkan.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
            onClick={() => navigate(`/services/${service.slug}`)} // Navigasi ke halaman detail
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {getIcon(service.icon)}
              </div>
              <div className="space-y-1">
                <CardTitle>{service.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {service.description || "Klik untuk mengajukan layanan ini"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                Ajukan Sekarang 
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}