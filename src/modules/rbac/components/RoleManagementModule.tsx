import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Shield, UserCog, AlertTriangle, Users, Eye, Settings, Ban } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGuard } from './PermissionGuard';
import { UserProfile, UserRole } from '../types';
import { ROLE_DEFINITIONS, canManageRole, getAssignableRoles } from '../permissions';

export function RoleManagementModule() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser, canAccess, isAdmin, role: currentRole } = useRBAC();

  useEffect(() => {
    if (canAccess.userViewing) {
      fetchUsers();
    }
  }, [canAccess.userViewing]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole} successfully`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const canModifyUserRole = (targetUser: UserProfile, newRole: UserRole): boolean => {
    if (!currentUser || !currentRole) return false;
    
    // Can't modify own role
    if (targetUser.id === currentUser.id) return false;
    
    // Check if current user can manage the target role and new role
    return canManageRole(currentUser.role, targetUser.role) && 
           canManageRole(currentUser.role, newRole);
  };

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser) return [];
    return getAssignableRoles(currentUser.role);
  };

  const getRoleColor = (role: UserRole): "default" | "destructive" | "secondary" => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'trainer': return 'default';
      case 'member': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PermissionGuard permission="canViewUsers">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Role Management System
          </CardTitle>
          <CardDescription>
            Comprehensive role and permission management for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role Overview
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Permissions Matrix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(ROLE_DEFINITIONS).map(([roleKey, roleData]) => {
                  const count = users.filter(user => user.role === roleKey).length;
                  return (
                    <div key={roleKey} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{roleData.displayName}s</p>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Level {roleData.level}
                          </p>
                        </div>
                        <Badge variant={getRoleColor(roleData.name)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {roleData.name}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Users List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Users ({filteredUsers.length})</h3>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                                {user.id === currentUser?.id && (
                                  <span className="text-xs text-muted-foreground ml-2">(You)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Member since {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={getRoleColor(user.role as UserRole)}>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        
                        <PermissionGuard permission="canManageUsers" showAccessDenied={false}>
                          {canAccess.roleAssignment && user.id !== currentUser?.id && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(newRole: string) => {
                                  if (canModifyUserRole(user, newRole as UserRole)) {
                                    updateUserRole(user.id, newRole as UserRole);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full sm:w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRoles().map(role => (
                                    <SelectItem key={role} value={role}>
                                      {ROLE_DEFINITIONS[role].displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {user.role === 'admin' && isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <AlertTriangle className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Change Admin Role</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        You're about to modify an admin user's role. This action will remove their administrative privileges. Are you sure you want to continue?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => updateUserRole(user.id, 'trainer')}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Confirm Change
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          )}
                        </PermissionGuard>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6">
              <div className="grid gap-4">
                {Object.entries(ROLE_DEFINITIONS).map(([roleKey, roleData]) => (
                  <Card key={roleKey}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          {roleData.displayName}
                        </CardTitle>
                        <Badge variant={getRoleColor(roleData.name)}>
                          Level {roleData.level}
                        </Badge>
                      </div>
                      <CardDescription>{roleData.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Permissions ({roleData.permissions.length})</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {roleData.permissions.slice(0, 12).map(permission => (
                              <Badge key={permission.id} variant="outline" className="text-xs">
                                {permission.name}
                              </Badge>
                            ))}
                            {roleData.permissions.length > 12 && (
                              <Badge variant="outline" className="text-xs">
                                +{roleData.permissions.length - 12} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Users with this role:</strong> {users.filter(u => u.role === roleKey).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Permissions Matrix</CardTitle>
                  <CardDescription>
                    Overview of all permissions across different roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Permission</th>
                          <th className="text-center p-2 font-medium">Admin</th>
                          <th className="text-center p-2 font-medium">Trainer</th>
                          <th className="text-center p-2 font-medium">Member</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(ROLE_DEFINITIONS.admin.permissions)
                          .slice(0, 15) // Show first 15 permissions
                          .map(permission => (
                          <tr key={permission.id} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="font-medium text-sm">{permission.name}</p>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              {ROLE_DEFINITIONS.admin.permissions.some(p => p.id === permission.id) ? (
                                <Eye className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <Ban className="w-4 h-4 text-red-500 mx-auto" />
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {ROLE_DEFINITIONS.trainer.permissions.some(p => p.id === permission.id) ? (
                                <Eye className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <Ban className="w-4 h-4 text-red-500 mx-auto" />
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {ROLE_DEFINITIONS.member.permissions.some(p => p.id === permission.id) ? (
                                <Eye className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <Ban className="w-4 h-4 text-red-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing first 15 permissions. Total permissions in system: {Object.values(ROLE_DEFINITIONS.admin.permissions).length}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}