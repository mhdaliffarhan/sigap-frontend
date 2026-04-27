// src/components/views/services/service-catalog.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dynamicServiceApi } from '@/lib/api';
import type { ServiceCategory } from '@/types/dynamic-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, Package,
  ChevronRight, LayoutGrid, List,
  Filter, Plus
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
import { motion, AnimatePresence } from 'motion/react';

export default function ServiceCatalog() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    // Auto switch view based on screen
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
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
          bg: 'bg-blue-50 text-blue-600',
          text: 'text-blue-700',
          border: 'border-blue-100',
          badge: 'bg-blue-50 text-blue-700',
          accent: 'bg-blue-600'
        };
      case 'repair':
        return {
          bg: 'bg-orange-50 text-orange-600',
          text: 'text-orange-700',
          border: 'border-orange-100',
          badge: 'bg-orange-50 text-orange-700',
          accent: 'bg-orange-600'
        };
      default: // service
        return {
          bg: 'bg-emerald-50 text-emerald-600',
          text: 'text-emerald-700',
          border: 'border-emerald-100',
          badge: 'bg-emerald-50 text-emerald-700',
          accent: 'bg-emerald-600'
        };
    }
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

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Katalog SIGAP...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full font-sans pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div>
          <h1 className="text-3xl font-bold">Daftar Layanan</h1>
          <p className="text-muted-foreground">Pilih kategori layanan di bawah untuk mulai membuat pengajuan baru.</p>
        </div>
      </div>

      {/* ACTION & FILTER SECTION - Optimized for PC */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white gap-0">
        <CardContent className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search - 8 Columns */}
            <div className="relative lg:col-span-8 w-full group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 pointer-events-none z-10">
                <Search className="text-slate-400 group-focus-within:text-blue-600 transition-all h-4 w-4" />
              </div>
              <Input
                placeholder="Cari nama atau deskripsi layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm w-full bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl transition-all font-medium shadow-none"
              />
            </div>

            {/* Filters & Mode Switcher - 4 Columns */}
            <div className="lg:col-span-4 flex items-center gap-3 w-full">
                <div className="flex-1">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10 px-4 text-sm border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all font-bold text-slate-700 shadow-none">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Kategori" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            <SelectItem value="booking">Reservasi (Booking)</SelectItem>
                            <SelectItem value="repair">Perbaikan (Repair)</SelectItem>
                            <SelectItem value="service">Layanan Umum</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
                            viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
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
                            viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
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

      {/* Main Content Area */}
      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
           <Package className="h-16 w-16 text-slate-200 mb-6" />
           <h3 className="text-xl font-bold text-slate-900">Layanan Tidak Ditemukan</h3>
           <p className="text-slate-500 max-w-md text-center mt-2 text-sm italic">Coba gunakan kata kunci pencarian yang berbeda atau reset filter.</p>
           <Button variant="outline" onClick={() => { setSearch(''); setFilterType('all'); }} className="mt-8 rounded-xl border-slate-200 font-bold px-8 h-12 shadow-sm">
             Lihat Semua Layanan
           </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW - MATCHING USER MANAGEMENT STANDARD */
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl gap-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[60px] border-r border-b font-semibold text-center text-slate-700">No</TableHead>
                  <TableHead className="border-r border-b font-semibold text-slate-700 pl-6 h-12">Nama Layanan</TableHead>
                  <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 px-4 h-12">Kategori</TableHead>
                  <TableHead className="border-r border-b font-semibold text-slate-700 px-4 h-12">Deskripsi</TableHead>
                  <TableHead className="w-[80px] border-b font-semibold text-center h-12 pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {paginatedServices.map((service, index) => {
                    const theme = getCategoryTheme(service.type);
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <motion.tr 
                        key={service.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/pegawai/create-ticket?service_id=${service.id}`)}
                      >
                        <TableCell className="border-r border-b font-medium text-center text-slate-500">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="border-r border-b pl-6 py-4">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{service.name}</p>
                        </TableCell>
                        <TableCell className="border-r border-b px-4">
                            <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shadow-none ${theme.badge} border-current/10`}>
                                 {service.type === 'booking' ? 'Reservasi' : service.type === 'repair' ? 'Perbaikan' : 'Umum'}
                            </Badge>
                        </TableCell>
                        <TableCell className="border-r border-b px-4">
                            <p className="text-xs text-slate-500 italic line-clamp-1">{service.description || "-"}</p>
                        </TableCell>
                        <TableCell className="border-b pr-6 text-center">
                             <Button 
                               variant="outline" 
                               size="icon" 
                               className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-all rounded-lg shadow-sm"
                             >
                               <Plus className="h-4 w-4" />
                             </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>

            {/* TABLE PAGINATION */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 text-sm">
              <div className="text-slate-500 font-medium">
                Menampilkan <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredServices.length)}</span> dari <span className="text-slate-900 font-bold">{filteredServices.length}</span> layanan
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-4 rounded-xl border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-50 shadow-none"
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-9 w-9 p-0 rounded-xl font-bold transition-all ${
                         currentPage === i + 1 
                         ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                         : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-4 rounded-xl border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-50 shadow-none"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* CARD VIEW - NO ICONS, MODERN CLEAN */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedServices.map((service, index) => {
                const theme = getCategoryTheme(service.type);
                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className="group relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white rounded-2xl gap-0"
                      onClick={() => navigate(`/pegawai/create-ticket?service_id=${service.id}`)}
                    >
                      <CardHeader className="p-6 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`capitalize py-1 px-3 border shadow-none text-[9px] font-black tracking-widest ${theme.badge} border-current/10`}>
                            {service.type === 'booking' ? 'Reservasi' : service.type === 'repair' ? 'Perbaikan' : 'Layanan Umum'}
                          </Badge>
                          <div className={`h-2 w-2 rounded-full ${theme.accent} opacity-40 group-hover:opacity-100 transition-all`} />
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight min-h-[3rem] items-center flex">
                            {service.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic opacity-80 border-t border-slate-50 pt-4">
                          {service.description || "Solusi cerdas untuk kebutuhan operasional kantor Anda."}
                        </p>
                        <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Buat Tiket</span>
                           <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ChevronRight className="h-4 w-4" />
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* CARD VIEW PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-slate-200 font-bold"
               >
                  Kembali
               </Button>
               {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-9 w-9 rounded-xl font-bold ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'border-slate-200'}`}
                  >
                    {i + 1}
                  </Button>
               ))}
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-slate-200 font-bold"
               >
                  Lanjut
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}