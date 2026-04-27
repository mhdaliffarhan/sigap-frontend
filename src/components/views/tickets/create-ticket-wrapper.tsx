import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { CreateTicketDynamic } from './create-ticket-dynamic';
import { Loader2 } from 'lucide-react';

export const CreateTicketWrapper: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get('service_id');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/service-categories');
        let data = [];
        if (Array.isArray(res)) data = res;
        else if (res?.data && Array.isArray(res.data)) data = res.data;
        else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
        
        const activeServices = data.filter((s: any) => s.is_active);
        setServices(activeServices);

        // Pre-select service if ID is in URL
        if (serviceIdFromUrl) {
          const preselected = activeServices.find((s: any) => s.id === serviceIdFromUrl || s.id.toString() === serviceIdFromUrl);
          if (preselected) setSelectedService(preselected);
        }
      } catch (error) {
        console.error("Gagal memuat layanan", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [serviceIdFromUrl]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <CreateTicketDynamic 
      service={selectedService}
      allServices={services}
      onServiceChange={(serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) setSelectedService(service);
      }}
      onBack={() => navigate(`/${currentUser.role}/dashboard`)}
      onSuccess={() => navigate(`/${currentUser.role}/my-tickets`)}
    />
  );
};