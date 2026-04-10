// src/components/views/services/service-catalog.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dynamicServiceApi } from '@/lib/api';
import type { ServiceCategory } from '@/types/dynamic-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Car, Building, Wrench, FileText,
  Video, Boxes, Search, Package,
  ChevronRight, LayoutGrid, List,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ServiceCatalog() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    // Auto switch view based on screen
    const handleResize = () => {
      if (window.innerWidth < 1024) setViewMode('card');
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await dynamicServiceApi.getServices();
      setServices(data || []);
    } catch (error) {
      console.error("Gagal memuat layanan", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk skema warna kategori
  const getCategoryTheme = (type?: string) => {
    switch (type) {
      case 'booking':
        return {
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-600',
          border: 'border-indigo-100',
          badge: 'bg-indigo-50 text-indigo-600',
          accent: 'bg-indigo-500'
        };
      case 'repair':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-600',
          border: 'border-orange-100',
          badge: 'bg-orange-50 text-orange-600',
          accent: 'bg-orange-500'
        };
      default: // service
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-600',
          border: 'border-emerald-100',
          badge: 'bg-emerald-50 text-emerald-600',
          accent: 'bg-emerald-500'
        };
    }
  };

  const getIcon = (iconName?: string, type?: string) => {
    const size = "h-5 w-5";
    
    if (type === 'booking') {
      if (iconName === 'car') return <Car className={`${size}`} />;
      return <Building className={`${size}`} />;
    }
    if (type === 'repair') return <Wrench className={`${size}`} />;
    if (iconName === 'zoom') return <Video className={`${size}`} />;
    return <FileText className={`${size}`} />;
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         (s.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'all' || s.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Katalog SIGAP...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:p-0 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* HEADER SECTION - COMPACT */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 lg:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-none">
              Daftar Layanan
            </h2>
            <p className="text-slate-400 text-sm lg:text-base font-medium max-w-xl opacity-80">
              Pilih kategori layanan di bawah untuk mulai membuat pengajuan baru.
            </p>
          </div>
        </div>
        <Boxes className="absolute -right-10 -bottom-10 h-64 w-64 text-white opacity-5 rotate-12" />
      </div>

      {/* ACTION CARD */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-[2] w-full group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 h-4 w-4 group-focus-within:text-blue-600 transition-all z-10" />
              <Input
                placeholder="Cari layanan (misal: Aula, Laptop)..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="pl-12 h-11 text-sm w-full bg-slate-50/50 border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all font-medium"
                style={{ paddingLeft: '3rem' }}
              />
            </div>

            {/* Filter & Mode Switcher */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 min-w-[140px]">
                    <Select value={filterType} onValueChange={(val) => {
                        setFilterType(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="h-11 pl-4 text-sm border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Semua Kategori" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            <SelectItem value="booking">Reservasi (Booking)</SelectItem>
                            <SelectItem value="repair">Perbaikan (Repair)</SelectItem>
                            <SelectItem value="service">Layanan Umum</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
                            viewMode === "table" ? "shadow-sm bg-white text-blue-600" : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <List className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tabel</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("card")}
                        className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
                            viewMode === "card" ? "shadow-sm bg-white text-blue-600" : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Kartu</span>
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Cards */}
      {paginatedServices.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-900">Layanan tidak ditemukan</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Coba kata kunci lain atau hubungi admin jika Anda memerlukan bantuan khusus.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setFilterType('all'); }} className="mt-6 rounded-xl">Lihat Semua Layanan</Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 pl-6">Nama Layanan</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Kategori</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Deskripsi</TableHead>
                <TableHead className="w-[80px] text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.map((service) => {
                const theme = getCategoryTheme(service.type);
                return (
                  <TableRow 
                    key={service.id} 
                    className="group border-slate-50 cursor-pointer hover:bg-blue-50/30 transition-colors"
                    onClick={() => navigate(`/services/${service.slug}`)}
                  >
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl transition-all group-hover:scale-110 ${theme.bg}`}>
                                {getIcon(service.icon, service.type)}
                            </div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{service.name}</p>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-none ${theme.badge}`}>
                             {service.type === 'booking' ? 'Reservasi' : service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <p className="text-xs text-slate-400 italic line-clamp-1 max-w-[300px]">{service.description || "-"}</p>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                         <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <ChevronRight className="h-4 w-4" />
                         </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* CARD VIEW - COMPACT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedServices.map((service) => {
            const theme = getCategoryTheme(service.type);
            return (
              <Card 
                key={service.id} 
                className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white"
                onClick={() => navigate(`/services/${service.slug}`)}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${theme.accent} opacity-40`} />
                <CardHeader className="p-4 flex flex-row items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 flex-shrink-0 ${theme.bg}`}>
                    {getIcon(service.icon, service.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className={`text-[9px] uppercase font-black border-none px-0 leading-none h-auto mb-1 flex items-center gap-1 ${theme.text}`}>
                        <div className={`h-1 w-1 rounded-full ${theme.accent}`} />
                        {service.type === 'booking' ? 'Reservasi' : service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                    </Badge>
                    <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">
                        {service.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug italic opacity-80">
                    {service.description || "Solusi cerdas untuk kebutuhan operasional kantor Anda."}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs"
                >
                    Kembali
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs"
                >
                    Lanjut
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}