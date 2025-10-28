import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, LogOut, TrendingUp, UserPlus, Crown } from "lucide-react";
import { format, isFuture, isPast } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  user_id: string;
  plan: string | null;
  plan_expiry: string | null;
  role?: string;
}

interface UserWithEmail extends UserProfile {
  email: string;
}

interface SubscriptionDetail {
  id: string;
  user_id: string;
  email: string;
  plan_name: string;
  payment_id: string;
  plan_start_date: string;
  plan_expiry_date: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [openAddUser, setOpenAddUser] = useState(false);
const [newUser, setNewUser] = useState<{ email: string; password: string; role: AppRole; plan_expiry: string }>({
  email: "",
  password: "",
  role: "user",
  plan_expiry: "",
});

  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, plan, plan_expiry");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: emailsData, error: emailsError } = await supabase.functions.invoke("get-users-emails");

      if (emailsError) throw emailsError;

      const rolesMap = new Map<string, string>();
      userRoles?.forEach((ur) => rolesMap.set(ur.user_id, ur.role));

      const emailsMap = emailsData?.emails || {};

      const combinedUsers: UserWithEmail[] =
        profiles?.map((profile) => ({
          ...profile,
          role: rolesMap.get(profile.user_id) || "user",
          email: emailsMap[profile.user_id] || "N/A",
        })) || [];

      setUsers(combinedUsers);

      // Fetch subscription details
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("details_of_subscribed_user")
        .select("*")
        .order("created_at", { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setSubscriptionDetails(subscriptions || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      setUpdating(userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
const row: TablesInsert<"user_roles"> = { user_id: userId, role: newRole as AppRole };
      const { error } = await supabase.from("user_roles").insert(row);
      if (error) throw error;
      toast({ title: "Success", description: `User role updated to ${newRole}` });
      await fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const manualUpgradeUser = async (userId: string) => {
    try {
      setUpdating(userId);

      // Fetch user profile details
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, name")
        .eq("user_id", userId)
        .single();

      if (profileError) throw new Error("Failed to fetch user profile");

      // Get user email from the users state
      const user = users.find(u => u.user_id === userId);
      if (!user) throw new Error("User not found");

      const planStartDate = new Date();
      const planExpiryDate = new Date();
      planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);

      // Insert subscription details
      const { error: subscriptionError } = await supabase
        .from("details_of_subscribed_user")
        .insert({
          user_id: userId,
          email: user.email,
          plan_name: "Pro",
          payment_id: "manual-upgrade",
          plan_start_date: planStartDate.toISOString().split('T')[0],
          plan_expiry_date: planExpiryDate.toISOString().split('T')[0]
        });

      if (subscriptionError) throw new Error(`Failed to store subscription details: ${subscriptionError.message}`);

      // Update profiles table
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          role: "subscribed_user",
          plan: "pro",
          plan_status: "active",
          plan_expiry: planExpiryDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (profileUpdateError) throw new Error("Failed to update profile");

      // Update user_roles table
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const roleRow: TablesInsert<"user_roles"> = { user_id: userId, role: "subscribed_user" };
      const { error: roleError } = await supabase.from("user_roles").insert(roleRow);

      if (roleError) throw new Error("Failed to update user role");

      toast({
        title: "✅ Success",
        description: `Subscription activated successfully for ${user.email}. Plan valid till ${format(planExpiryDate, "dd/MM/yyyy")}.`
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "⚠️ Error",
        description: error.message || "Failed to store subscription details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        toast({ title: "Error", description: "Email and password required", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email,
          password: newUser.password,
        },
      });

      if (error || !data?.user) throw error || new Error("Failed to create user");
      const userId = data.user.id;

      await supabase.from("profiles").insert({
        user_id: userId,
        plan: newUser.plan_expiry ? "subscribed" : null,
        plan_expiry: newUser.plan_expiry || null,
      });

const roleRow: TablesInsert<"user_roles"> = { user_id: userId, role: newUser.role };
      await supabase.from("user_roles").insert(roleRow);

      toast({ title: "Success", description: "New user added successfully!" });
      setOpenAddUser(false);
      setNewUser({ email: "", password: "", role: "user", plan_expiry: "" });
      await fetchUsers();
    } catch (err: any) {
      console.error("Add user error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const filterSubscribedUsers = () =>
    users.filter((user) => {
      if (!user.plan_expiry) return false;
      const expiryDate = new Date(user.plan_expiry);
      return isFuture(expiryDate) || format(new Date(), "yyyy-MM-dd") === format(expiryDate, "yyyy-MM-dd");
    });

  const getRoleBadgeColor = (role?: string) => (role === "admin" ? "default" : "secondary");

  const getExpiryStatus = (expiry: string | null) => {
    if (!expiry) return null;
    const expiryDate = new Date(expiry);
    if (isPast(expiryDate) && format(new Date(), "yyyy-MM-dd") !== format(expiryDate, "yyyy-MM-dd")) {
      return "expired";
    }
    return "active";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMarketResearch = () => {
    navigate("/business-plan");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpenAddUser(true)} variant="default" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button onClick={handleMarketResearch} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Research
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
          <TabsTrigger value="subscription-details">Subscription Details</TabsTrigger>
        </TabsList>

        {/* All Users Table */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan Expiry</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead>Upgrade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(user.role)}>{user.role || "user"}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.plan_expiry ? (
                          <span className={getExpiryStatus(user.plan_expiry) === "expired" ? "text-destructive" : ""}>
                            {format(new Date(user.plan_expiry), "dd/MM/yyyy")}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || "user"}
                          onValueChange={(value: "admin" | "user") => updateUserRole(user.user_id, value)}
                          disabled={updating === user.user_id}
                        >
                          <SelectTrigger className="w-32">
                            {updating === user.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => manualUpgradeUser(user.user_id)}
                          disabled={updating === user.user_id || user.role === "subscribed_user"}
                          variant="outline"
                          size="sm"
                        >
                          {updating === user.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade to Pro
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribed Users */}
        <TabsContent value="subscribed">
          <Card>
            <CardHeader>
              <CardTitle>Subscribed Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterSubscribedUsers().map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.plan_expiry && (
                          <span className={getExpiryStatus(user.plan_expiry) === "expired" ? "text-destructive" : ""}>
                            {format(new Date(user.plan_expiry), "dd/MM/yyyy")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExpiryStatus(user.plan_expiry) === "expired" ? "destructive" : "default"}>
                          {getExpiryStatus(user.plan_expiry) === "expired" ? "Expired" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Details */}
        <TabsContent value="subscription-details">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionDetails.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">{sub.plan_name}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{sub.payment_id}</TableCell>
                      <TableCell>{format(new Date(sub.plan_start_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <span className={getExpiryStatus(sub.plan_expiry_date) === "expired" ? "text-destructive" : ""}>
                          {format(new Date(sub.plan_expiry_date), "dd/MM/yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExpiryStatus(sub.plan_expiry_date) === "expired" ? "destructive" : "default"}>
                          {getExpiryStatus(sub.plan_expiry_date) === "expired" ? "Expired" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ➕ Add User Modal */}
      <Dialog open={openAddUser} onOpenChange={setOpenAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Email</Label>
              <Input
                placeholder="Enter email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Expiry (optional)</Label>
              <Input
                type="date"
                value={newUser.plan_expiry}
                onChange={(e) => setNewUser({ ...newUser, plan_expiry: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
