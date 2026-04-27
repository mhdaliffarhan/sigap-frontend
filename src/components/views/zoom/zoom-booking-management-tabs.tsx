import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar as CalendarIcon, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import type { BookingGroups } from './zoom-booking-types';
import type { User } from '@/types';
import { ZoomCalendarView } from './zoom-calendar-view';

interface ZoomBookingManagementTabsProps {
  bookingGroups: BookingGroups;
  currentUser: User;
  onSelectBooking: (booking: any) => void;
  renderStatusBadge: (status: string) => React.ReactNode;
}

const STATUS_TABS: Array<'all' | 'pending' | 'approved' | 'rejected'> = [
  'all',
  'pending',
  'approved',
  'rejected',
];

export const ZoomBookingManagementTabs: React.FC<ZoomBookingManagementTabsProps> = ({
  bookingGroups,
  currentUser,
  onSelectBooking,
  renderStatusBadge,
}) => {
  return (
    <Tabs defaultValue="calendar" className="space-y-4">
      <TabsList>
        <TabsTrigger value="calendar" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Kalender
        </TabsTrigger>
        <TabsTrigger value="all">Semua ({bookingGroups.all.length})</TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          <Clock className="h-4 w-4" />
          Pending ({bookingGroups.pending.length})
        </TabsTrigger>
        <TabsTrigger value="approved" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Disetujui ({bookingGroups.approved.length})
        </TabsTrigger>
        <TabsTrigger value="rejected" className="gap-2">
          <XCircle className="h-4 w-4" />
          Ditolak ({bookingGroups.rejected.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar">
        <ZoomCalendarView currentUser={currentUser} />
      </TabsContent>

      {STATUS_TABS.map(tab => (
        <TabsContent key={tab} value={tab}>
          <Card className="rounded-xl overflow-hidden shadow-sm border-slate-200">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[60px] border-r border-b font-semibold text-center text-slate-700">No</TableHead>
                    <TableHead className="w-[140px] border-r border-b font-semibold text-slate-700 px-4">Nomor Tiket</TableHead>
                    <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 px-4">Pemohon</TableHead>
                    <TableHead className="border-r border-b font-semibold text-slate-700 px-4">Judul</TableHead>
                    <TableHead className="w-[180px] border-r border-b font-semibold text-slate-700 px-4">Tanggal & Waktu</TableHead>
                    <TableHead className="w-[120px] border-r border-b font-semibold text-slate-700 px-4">Peserta</TableHead>
                    <TableHead className="w-[120px] border-r border-b font-semibold text-slate-700 text-center">Status</TableHead>
                    <TableHead className="w-[120px] border-b font-semibold text-slate-700 text-center px-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingGroups[tab].length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Tidak ada booking</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookingGroups[tab].map((booking, index) => (
                      <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => onSelectBooking(booking)}>
                        <TableCell className="border-r border-b font-medium text-center text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="border-r border-b font-medium bg-white group-hover:bg-transparent px-4 font-mono text-xs">{booking.ticketNumber}</TableCell>
                        <TableCell className="border-r border-b bg-white group-hover:bg-transparent px-4">
                          <p className="font-medium text-slate-900">{booking.userName}</p>
                          <p className="text-xs text-gray-500">{booking.unitKerja}</p>
                        </TableCell>
                        <TableCell className="border-r border-b font-medium bg-white group-hover:bg-transparent px-4">
                          <p>{booking.title}</p>
                        </TableCell>
                        <TableCell className="border-r border-b bg-white group-hover:bg-transparent px-4">
                          <p className="text-sm font-medium">
                            {booking.date && new Date(booking.date).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </TableCell>
                        <TableCell className="border-r border-b bg-white group-hover:bg-transparent px-4 text-sm">{booking.estimatedParticipants} orang</TableCell>
                        <TableCell className="border-r border-b text-center">{renderStatusBadge(booking.status)}</TableCell>
                        <TableCell className="border-b text-center px-4">
                           <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-blue-600 border border-blue-200 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); onSelectBooking(booking); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};
