"use client";

import { useState } from "react";
import { 
  User, 
  KeyRound, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Calendar,
  X
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { changePassword, createUser, deleteUser } from "@/app/user-actions";

interface UserItem {
  id: string;
  username: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface SettingsClientProps {
  currentUser: {
    userId: string;
    username: string;
    name: string;
  };
  initialUsers: UserItem[];
}

export default function SettingsClient({
  currentUser,
  initialUsers,
}: SettingsClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [addUserError, setAddUserError] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Delete User State
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus({ type: null, message: "" });

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (!res.success) {
        setPasswordStatus({
          type: "error",
          message: res.error || "Failed to update password.",
        });
        setSavingPassword(false);
        return;
      }

      setPasswordStatus({
        type: "success",
        message: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSavingPassword(false);
    } catch {
      setPasswordStatus({
        type: "error",
        message: "An unexpected error occurred.",
      });
      setSavingPassword(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddUserError("");
    setAddingUser(true);

    try {
      const res = await createUser({
        name: newUserName,
        username: newUserUsername,
        password: newUserPassword,
      });

      if (!res.success || !res.user) {
        setAddUserError(res.error || "Failed to create user.");
        setAddingUser(false);
        return;
      }

      setUsers((prev) => [
        ...prev,
        {
          id: res.user!.id,
          username: res.user!.username,
          name: res.user!.name,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      setIsAddUserModalOpen(false);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      setAddingUser(false);
    } catch {
      setAddUserError("An error occurred while creating user.");
      setAddingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setDeletingUserId(userId);

    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(res.error || "Failed to delete user.");
      }
    } catch {
      alert("Error deleting user.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <p className="eyebrow mb-1">System Administration</p>
        <h1 className="text-h1 text-ink">Settings & User Management</h1>
        <p className="text-sm text-mute mt-1">
          Manage your account credentials, security, and authorized team members.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Profile & Change Password */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium text-sm">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">{currentUser.name}</h3>
                <p className="text-xs text-mute font-mono">@{currentUser.username}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs text-mute">
              <span>Account Status</span>
              <span className="badge badge-success">Active</span>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-ink" />
              <h2 className="text-sm font-semibold text-ink">Change Password</h2>
            </div>

            {passwordStatus.type === "success" && (
              <div className="badge badge-success w-full py-2 px-3 mb-4 justify-start text-left whitespace-normal h-auto">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordStatus.message}</span>
              </div>
            )}

            {passwordStatus.type === "error" && (
              <div className="badge badge-error w-full py-2 px-3 mb-4 justify-start text-left whitespace-normal h-auto">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label className="field-label" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn btn-primary btn-sm w-full mt-2"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Team Members */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-ink" />
                <div>
                  <h2 className="text-base font-semibold text-ink">Authorized Team Members</h2>
                  <p className="text-xs text-mute">
                    Users who have login access to this business instance.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>

            {/* Users List */}
            <div className="divide-y divide-hairline">
              {users.map((user) => {
                const isCurrent = user.id === currentUser.userId;
                return (
                  <div
                    key={user.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-hairline-soft border border-hairline flex items-center justify-center text-xs font-semibold text-ink">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{user.name}</span>
                          {isCurrent && (
                            <span className="badge badge-success text-[10px] py-0.5 px-1.5">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-mute font-mono">@{user.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1 text-xs text-mute">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {formatDate(user.created_at)}</span>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="btn btn-secondary btn-sm text-error hover:text-error hover:bg-error-soft/30 p-1.5"
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-hairline-soft/60 border border-hairline flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-ink shrink-0 mt-0.5" />
              <p className="text-xs text-mute leading-relaxed">
                All team members have access to the dashboard, catalog, production, sales, and finances. Every user uses encrypted credentials and independent sessions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 bg-canvas shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
              <h3 className="text-base font-semibold text-ink">Add New Team Member</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-mute hover:text-ink p-1 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addUserError && (
              <div className="badge badge-error w-full py-2 px-3 mb-4 justify-start text-left whitespace-normal h-auto">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="newUserName">
                  Full Name
                </label>
                <input
                  id="newUserName"
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  autoFocus
                  className="input"
                  placeholder="e.g. Badar"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="newUserUsername">
                  Username
                </label>
                <input
                  id="newUserUsername"
                  type="text"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  required
                  autoComplete="off"
                  className="input"
                  placeholder="e.g. badar"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="newUserPassword">
                  Initial Password
                </label>
                <input
                  id="newUserPassword"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="btn btn-primary btn-sm"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
