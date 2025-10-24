import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, LogOut, TrendingUp } from 'lucide-react';
import { format, isFuture, isPast } from 'date-fns';

interface UserProfile {
  user_id: string;
  name: string | null;
  plan: string | null;
  plan_expiry: string | null;
  role?: string;
}

interface UserWithEmail extends UserProfile {
  email: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, plan, plan_expiry');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user roles
      const rolesMap = new Map<string, string>();
      userRoles?.forEach((ur) => {
        rolesMap.set(ur.user_id, ur.role);
      });

      // Fetch user emails via edge function with admin access
      const { data: emailsData, error: emailsError } = await supabase.functions.invoke(
        'get-users-emails'
      );

      if (emailsError) {
        console.error('Error fetching emails:', emailsError);
        throw emailsError;
      }

      const emailsMap = emailsData?.emails || {};

      // Combine data
      const combinedUsers: UserWithEmail[] =
        profiles?.map((profile) => ({
          ...profile,
          role: rolesMap.get(profile.user_id) || 'user',
          email: emailsMap[profile.user_id] || 'N/A',
        })) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setUpdating(userId);

      // First, remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then, insert the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const filterSubscribedUsers = () => {
    return users.filter((user) => {
      if (!user.plan_expiry) return false;
      const expiryDate = new Date(user.plan_expiry);
      return isFuture(expiryDate) || format(new Date(), 'yyyy-MM-dd') === format(expiryDate, 'yyyy-MM-dd');
    });
  };

  const getRoleBadgeColor = (role?: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getExpiryStatus = (expiry: string | null) => {
    if (!expiry) return null;
    const expiryDate = new Date(expiry);
    if (isPast(expiryDate) && format(new Date(), 'yyyy-MM-dd') !== format(expiryDate, 'yyyy-MM-dd')) {
      return 'expired';
    }
    return 'active';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleMarketResearch = () => {
    navigate('/multistep-businessplan');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={handleMarketResearch} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Research Agent
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="subscribed">Subscribed Users</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plan Expiry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.name || 'N/A'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeColor(user.role)}>
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.plan_expiry ? (
                            <span
                              className={
                                getExpiryStatus(user.plan_expiry) === 'expired'
                                  ? 'text-destructive'
                                  : ''
                              }
                            >
                              {format(new Date(user.plan_expiry), 'dd/MM/yyyy')}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role || 'user'}
                            onValueChange={(value: 'admin' | 'user') =>
                              updateUserRole(user.user_id, value)
                            }
                            disabled={updating === user.user_id}
                          >
                            <SelectTrigger className="w-32">
                              {updating === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribed">
          <Card>
            <CardHeader>
              <CardTitle>Subscribed Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSubscribedUsers().map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.name || 'N/A'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.plan_expiry && (
                            <span
                              className={
                                getExpiryStatus(user.plan_expiry) === 'expired'
                                  ? 'text-destructive'
                                  : ''
                              }
                            >
                              {format(new Date(user.plan_expiry), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              getExpiryStatus(user.plan_expiry) === 'expired'
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {getExpiryStatus(user.plan_expiry) === 'expired'
                              ? 'Expired'
                              : 'Active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
