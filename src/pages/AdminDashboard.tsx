import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, LogOut, TrendingUp, UserPlus } from "lucide-react";
import { format, isFuture, isPast } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [openAddUser, setOpenAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    plan_expiry: "",
  });

  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch all users with their role and email
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, plan, plan_expiry");

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: emailsData, error: emailsError } =
        await supabase.functions.invoke("get-users-emails");

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
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast({ title: "Success", description: `User role updated to ${newRole}` });
      await fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.name) {
        toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
        return;
      }

      // Call Supabase Edge Function to create user with Admin API
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email,
          password: newUser.password,
        },
      });

      if (error || !data?.user) {
        throw error || new Error("Failed to create user");
      }

      const userId = data.user.id;

      // Insert into profiles
      await supabase.from("profiles").insert({
        user_id: userId,
        name: newUser.name,
        plan: newUser.plan_expiry ? "subscribed" : null,
        plan_expiry: newUser.plan_expiry || null,
      });

      // Insert into user_roles
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: newUser.role as "admin" | "moderator" | "user",
      } as any);

      toast({
        title: "Success",
        description: "New user added successfully!",
      });

      setOpenAddUser(false);
      setNewUser({ name: "", email: "", password: "", role: "user", plan_expiry: "" });
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
      return (
        isFuture(expiryDate) ||
        format(new Date(), "yyyy-MM-dd") === format(expiryDate, "yyyy-MM-dd")
      );
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
                      <TableCell>{user.name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.plan_expiry ? (
                          <span
                            className={
                              getExpiryStatus(user.plan_expiry) === "expired"
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {format(new Date(user.plan_expiry), "dd/MM/yyyy")}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || "user"}
                          onValueChange={(value: "admin" | "user") =>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterSubscribedUsers().map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.plan_expiry && (
                          <span
                            className={
                              getExpiryStatus(user.plan_expiry) === "expired"
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {format(new Date(user.plan_expiry), "dd/MM/yyyy")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getExpiryStatus(user.plan_expiry) === "expired"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {getExpiryStatus(user.plan_expiry) === "expired"
                            ? "Expired"
                            : "Active"}
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
              <Label>Name</Label>
              <Input
                placeholder="Enter name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
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
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v })}
              >
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
                onChange={(e) =>
                  setNewUser({ ...newUser, plan_expiry: e.target.value })
                }
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
