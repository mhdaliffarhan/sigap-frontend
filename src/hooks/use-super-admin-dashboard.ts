import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAssets: number;
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  rejectedTickets: number;
  ticketsLast7Days: number;
  ticketsLast30Days: number;
  avgResolutionTime: number;
  totalServiceCategories: number;
  totalRoles: number;
}

export interface TicketsByType {
  name: string;
  value: number;
}

export interface UsersByRole {
  name: string;
  value: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface UseSuperAdminDashboardReturn {
  stats: DashboardStats | null;
  ticketsByType: TicketsByType[];
  usersByRole: UsersByRole[];
  recentActivities: AuditLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalAssets: 0,
  totalTickets: 0,
  pendingTickets: 0,
  completedTickets: 0,
  rejectedTickets: 0,
  ticketsLast7Days: 0,
  ticketsLast30Days: 0,
  avgResolutionTime: 0,
  totalServiceCategories: 0,
  totalRoles: 0,
};

export function useSuperAdminDashboard(): UseSuperAdminDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ticketsByType, setTicketsByType] = useState<TicketsByType[]>([]);
  const [usersByRole, setUsersByRole] = useState<UsersByRole[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, logsResponse]: any[] = await Promise.all([
        api.get('/tickets/stats/super-admin-dashboard'),
        api.get('/audit-logs?per_page=10')
      ]);

      if (statsResponse) {
        if (statsResponse.stats) {
          setStats(statsResponse.stats);
          setTicketsByType(statsResponse.ticketsByType || []);
          setUsersByRole(statsResponse.usersByRole || []);
        } else if (statsResponse.data && statsResponse.data.stats) {
          setStats(statsResponse.data.stats);
          setTicketsByType(statsResponse.data.ticketsByType || []);
          setUsersByRole(statsResponse.data.usersByRole || []);
        }
      }

      if (logsResponse && logsResponse.data) {
        setRecentActivities(logsResponse.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Gagal mengambil data dashboard');
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats: stats || defaultStats,
    ticketsByType,
    usersByRole,
    recentActivities,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
