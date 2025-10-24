import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import FreeUsersTab from '@/components/admin/FreeUsersTab';
import SubscribedUsersTab from '@/components/admin/SubscribedUsersTab';
import PDFManagementTab from '@/components/admin/PDFManagementTab';
import AdminStats from '@/components/admin/AdminStats';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ free: 0, subscribed: 0, admin: 0 });

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;

      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const hasAdminRole = roles?.some(r => r.role === 'admin');
        if (!hasAdminRole) {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access this page.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
        await fetchStats();
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast({
          title: "Error",
          description: "Failed to verify access permissions.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, navigate, toast]);

  const fetchStats = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('plan_status');

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const free = profiles?.filter(p => p.plan_status === 'free').length || 0;
      const subscribed = profiles?.filter(p => p.plan_status === 'subscribed').length || 0;
      const admin = adminRoles?.length || 0;

      setStats({ free, subscribed, admin });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const refreshData = () => {
    fetchStats();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
            <CardDescription>Manage users, subscriptions, and PDF reports</CardDescription>
          </CardHeader>
        </Card>

        <AdminStats stats={stats} />

        <Tabs defaultValue="free" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="free">Free Users</TabsTrigger>
            <TabsTrigger value="subscribed">Subscribed Users</TabsTrigger>
            <TabsTrigger value="pdfs">PDF Management</TabsTrigger>
          </TabsList>

          <TabsContent value="free">
            <FreeUsersTab onRoleUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="subscribed">
            <SubscribedUsersTab onRoleUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="pdfs">
            <PDFManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
