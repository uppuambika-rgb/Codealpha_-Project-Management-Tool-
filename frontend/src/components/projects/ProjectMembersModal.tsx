import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, Users, Check } from 'lucide-react';
import { Project, ProjectRole, User } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface ProjectMembersModalProps {
  project: Project;
  onClose: () => void;
  onMembersUpdated: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  project,
  onClose,
  onMembersUpdated,
}) => {
  const { availableUsers, user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('member');
  const [inviting, setInviting] = useState(false);

  const existingMemberIds = new Set(project.members.map(m => m.userId));
  const nonMembers = availableUsers.filter(u => !existingMemberIds.has(u.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setInviting(true);
    try {
      await api.projects.addMember(project.id, selectedUserId, selectedRole);
      onMembersUpdated();
      setSelectedUserId('');
    } catch (e) {
      console.error(e);
      alert('Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this team member from the project?')) return;
    try {
      await api.projects.removeMember(project.id, userId);
      onMembersUpdated();
    } catch (e) {
      console.error(e);
      alert('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Team Members</h2>
              <p className="text-xs text-slate-500">Manage collaboration for {project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add Member Form */}
        {nonMembers.length > 0 ? (
          <form onSubmit={handleAddMember} className="mt-4 rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100">
            <p className="text-xs font-bold text-emerald-900 mb-2">Invite Available Team Member</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                required
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select a user...</option>
                {nonMembers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.department || 'Student'} ({u.title || 'Member'})
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as ProjectRole)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="lead">Lead</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                type="submit"
                disabled={inviting || !selectedUserId}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 text-center">
            All registered users are already members of this project!
          </div>
        )}

        {/* Existing Members List */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Active Members ({project.enrichedMembers?.length || project.members.length})
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {project.enrichedMembers?.map(member => {
              const isOwner = member.userId === project.ownerId;
              const isSelf = member.userId === currentUser?.id;

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{member.name}</span>
                        {isOwner && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                            Owner
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-medium text-slate-700">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                      {member.role}
                    </span>

                    {!isOwner && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
