import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCatalog } from './service-catalog';
import { CreateTicketDynamic } from './create-ticket-dynamic';

export const CreateTicketWrapper: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const navigate = useNavigate();

  // STATE 1: Tampilkan Katalog jika belum pilih layanan
  if (!selectedService) {
    return <ServiceCatalog onSelectService={setSelectedService} />;
  }

  // STATE 2: Tampilkan Form Dinamis jika sudah pilih
  return (
    <CreateTicketDynamic 
      currentUser={currentUser}
      service={selectedService}
      onBack={() => setSelectedService(null)} // Tombol Back: Reset state ke null (Balik ke katalog)
      onSuccess={() => navigate(`/${currentUser.role}/my-tickets`)} // Sukses: Redirect ke My Tickets
    />
  );
};