// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  UserPlus,
  Wallet,
  X,
  Check,
  LogOut,
  QrCode,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

const ProfilePage = () => {
  const {
    user,
    logout,
    updateProfile,
    sendFriendRequest,
    friendRequests,
    respondToRequest,
  } = useApp();

  const [upi, setUpi] = useState(user?.upi_id || '');
  const [friendEmail, setFriendEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        console.error(error);
        toast.error('Failed to upload avatar.');
        return;
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;
      await updateProfile({ avatar_url: publicUrl });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error(error);
      toast.error('Failed to update password.');
    } else {
      toast.success('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      <div className="bg-white px-6 pt-12 pb-8 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" /> Settings
        </h2>
        <p className="text-slate-500 text-sm">
          Manage your account, profile & friends
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200 relative z-10 overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {user?.full_name?.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
              <QrCode className="w-3 h-3 text-slate-600" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
          {avatarUploading && (
            <p className="text-[11px] text-slate-400 mb-1">
              Uploading photo...
            </p>
          )}
          <h3 className="font-bold text-lg text-slate-900 relative z-10">
            {user?.full_name}
          </h3>
          <div className="text-slate-500 text-sm mb-4 relative z-10">
            {user?.email}
          </div>
          <div className="bg-emerald-50 text-emerald-600 text-xs font-bold py-1 px-3 rounded-full inline-flex items-center gap-1 relative z-10">
            <ShieldCheck className="w-3 h-3" /> Verified Account
          </div>
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-50 to-white z-0"></div>
        </div>

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Pending Requests
            </h4>
            <div className="space-y-3">
              {friendRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {req.sender.full_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {req.sender.email}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respondToRequest(req.id, req.sender_id, false)
                      }
                      className="p-2 bg-white text-rose-500 rounded-full shadow-sm hover:bg-rose-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        respondToRequest(req.id, req.sender_id, true)
                      }
                      className="p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Friend */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Friends
          </h4>
          <div className="flex gap-2">
            <input
              value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              placeholder="friend@email.com"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                sendFriendRequest(friendEmail);
                setFriendEmail('');
              }}
              className="bg-slate-900 text-white px-4 rounded-xl font-bold text-sm hover:bg-slate-800"
            >
              Send
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" /> Payment Settings
          </h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Default UPI ID
              </label>
              <input
                value={upi}
                onChange={e => setUpi(e.target.value)}
                placeholder="username@okaxis"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => updateProfile({ upi_id: upi })}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm"
            >
              Save UPI
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Security
          </h4>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handlePasswordChange}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
