// src/context/AppContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [transactions, setTransactions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [personalExpenses, setPersonalExpenses] = useState([]);
  const [settlementRequests, setSettlementRequests] = useState([]);
  const [reminders, setReminders] = useState([]);

  // --- AUTH / SESSION ---

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchUserData(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setTransactions([]);
        setFriends([]);
        setFriendRequests([]);
        setPersonalExpenses([]);
        setSettlementRequests([]);
        setReminders([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async userId => {
    try {
      setLoading(true);

      // Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);

      // Friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profile:profiles!friend_id (id, full_name, email, upi_id, avatar_url)
        `)
        .eq('user_id', userId);

      const formattedFriends = (friendsData || []).map(f => ({
        user_id: f.profile.id,
        ...f.profile,
      }));
      setFriends(formattedFriends);

      // Friend requests
      const { data: requestsData } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          status,
          sender:profiles!sender_id (id, full_name, email)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      setFriendRequests(requestsData || []);

      // Personal expenses
      const { data: pExpenses } = await supabase
        .from('personal_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setPersonalExpenses(pExpenses || []);

      // Transactions
      const { data: sharedTx } = await supabase
        .from('transactions')
        .select('*')
        .or(`payer_id.eq.${userId},involved.cs.{${userId}}`)
        .order('created_at', { ascending: false });

      setTransactions(sharedTx || []);

      // Settlements
      const { data: settlementsData } = await supabase
        .from('settlement_requests')
        .select('*')
        .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      setSettlementRequests(settlementsData || []);

      // Reminders
      const { data: remindersData } = await supabase
        .from('reminders')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      setReminders(remindersData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- EMAIL VERIFICATION HELPERS ---

  const resendVerificationEmail = async email => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Resend verification error:', error);
        toast.error('Could not resend verification email.');
        throw error;
      }

      toast.success('Verification email sent again. Check your inbox.');
    } catch (err) {
      // already logged + toasted above
      throw err;
    }
  };

  // --- AUTH ACTIONS ---

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(error);

      // Handle unverified email case nicely
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Please verify your email before logging in.');
        // Optional: auto-resend verification mail
        try {
          await resendVerificationEmail(email);
        } catch {
          // ignore, toast already shown in resend
        }
        return;
      }

      if (error.message.toLowerCase().includes('invalid login')) {
        toast.error('Incorrect email or password.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }

    toast.success('Welcome back!');
  };

  const signup = async (email, password, fullName) => {
    if (!email || !password || !fullName) {
      toast.error('All fields are required.');
      throw new Error('Missing fields');
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      throw new Error('Password too short');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // This is where Supabase will send the user after clicking the email link
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      if (error.message.toLowerCase().includes('already registered')) {
        toast.error('Email already registered. Try logging in.');
      } else {
        toast.error(error.message || 'Sign up failed.');
      }
      throw error;
    }

    // Supabase will send a verification email if email confirmations are enabled
    toast.success('Account created! Please check your email to verify your account before logging in.');

    // Optional: you can keep this if you want to distinguish cases
    if (!data.user) {
      // user not auto-signed in, waiting for verification
      toast.info('Verification link sent. Complete verification to continue.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.info('Signed out.');
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // or a specific callback URL
      },
    });

    if (error) {
      console.error('Google sign-in error:', error.message);
      toast.error('Google sign-in failed.');
      throw error;
    }
  };

  // --- EXPENSES & TRANSACTIONS ---

  const addTransaction = async data => {
    const tempId = crypto.randomUUID();
    const newTx = { ...data, id: tempId, created_at: new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);

    const { error } = await supabase.from('transactions').insert(data);
    if (error) {
      console.error('Transaction error:', error);
      toast.error('Failed to save transaction.');
    } else if (user) {
      fetchUserData(user.id);
    }
  };

  const addPersonalExpense = async data => {
    const tempId = crypto.randomUUID();
    const newExp = {
      ...data,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setPersonalExpenses(prev => [newExp, ...prev]);

    const { error } = await supabase.from('personal_expenses').insert({
      user_id: user.id,
      amount: data.amount,
      description: data.description,
      category: data.category,
    });

    if (error) {
      console.error(error);
      toast.error('Could not save expense.');
    }
  };

  const deletePersonalExpense = async id => {
    setPersonalExpenses(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase
      .from('personal_expenses')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(error);
      toast.error('Could not delete expense.');
    } else {
      toast.success('Expense deleted.');
    }
  };

  // Delete a group / split transaction
  const deleteTransaction = async (id) => {
    try {
      console.log('Deleting transaction with id:', id);

      // 1️⃣ Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);              // if your PK is "id"
      // .eq('transaction_id', id) // use this instead if your column is named transaction_id

      if (error) {
        console.error('Error deleting transaction:', error);
        alert('Could not delete transaction. Please try again.');
        return;
      }

      // 2️⃣ Update local state
      setTransactions(prev =>
        prev.filter(t => t.id !== id && t.transaction_id !== id)
      );

      console.log('Transaction deleted successfully');
    } catch (err) {
      console.error('Unexpected error deleting transaction:', err);
      alert('Something went wrong while deleting.');
    }
  };



  // --- FRIENDS ---

  const sendFriendRequest = async email => {
    if (!email.includes('@')) {
      toast.error('Invalid email address.');
      return;
    }

    const { data: foundUser, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (error || !foundUser) {
      toast.error('User not found.');
      return;
    }

    if (foundUser.id === user.id) {
      toast.error('You cannot add yourself.');
      return;
    }

    const isFriend = friends.some(f => f.user_id === foundUser.id);
    if (isFriend) {
      toast.info(`You are already friends with ${foundUser.full_name}.`);
      return;
    }

    const { error: reqError } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: foundUser.id,
    });

    if (reqError) {
      if (reqError.code === '23505') toast.info('Request already sent.');
      else toast.error('Failed to send request.');
    } else {
      toast.success(`Request sent to ${foundUser.full_name}!`);
    }
  };

  const respondToRequest = async (requestId, senderId, accept) => {
    if (accept) {
      const { error: fError } = await supabase.from('friends').insert([
        { user_id: user.id, friend_id: senderId },
        { user_id: senderId, friend_id: user.id },
      ]);
      if (fError) {
        console.error(fError);
        toast.error('Error accepting request.');
        return;
      }
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      toast.success('Friend added!');
      fetchUserData(user.id);
    } else {
      await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      toast.info('Request ignored.');
    }
  };

  const updateProfile = async updates => {
    setUser(prev => ({ ...prev, ...updates }));
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) {
      console.error(error);
      toast.error('Failed to update profile.');
    } else {
      toast.success('Profile updated.');
    }
  };

  // --- SETTLEMENTS & REMINDERS ---

  const requestSettlement = async ({ lenderId, borrowerId, amount, note }) => {
    if (!amount || amount <= 0) {
      toast.error('Amount must be positive.');
      return;
    }

    const { error } = await supabase.from('settlement_requests').insert({
      lender_id: lenderId,
      borrower_id: borrowerId,
      amount,
      note,
    });

    if (error) {
      console.error(error);
      toast.error('Could not create settlement request.');
    } else {
      toast.success('Settlement request sent.');
      if (user) fetchUserData(user.id);
    }
  };

  const respondSettlement = async (id, accept) => {
    const values = {
      status: accept ? 'accepted' : 'rejected',
      resolved_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('settlement_requests')
      .update(values)
      .eq('id', id);

    if (error) {
      console.error(error);
      toast.error('Failed to update settlement.');
    } else {
      toast.success(accept ? 'Settlement accepted.' : 'Settlement rejected.');
      if (user) fetchUserData(user.id);
    }
  };

  const createReminder = async ({ receiverId, amount, message, dueDate }) => {
    const { error } = await supabase.from('reminders').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      amount,
      message,
      due_date: dueDate,
    });

    if (error) {
      console.error(error);
      toast.error('Failed to create reminder.');
    } else {
      toast.success('Reminder sent.');
      if (user) fetchUserData(user.id);
    }
  };

  const markReminderDone = async id => {
    const { error } = await supabase
      .from('reminders')
      .update({
        status: 'done',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error(error);
      toast.error('Failed to update reminder.');
    } else {
      toast.success('Reminder updated.');
      if (user) fetchUserData(user.id);
    }
  };

  const allUsers = useMemo(() => {
    if (!user) return [];
    const me = { ...user, user_id: user.id };
    return [me, ...friends];
  }, [user, friends]);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        transactions,
        friends,
        friendRequests,
        personalExpenses,
        settlementRequests,
        reminders,
        allUsers,
        // actions
        login,
        loginWithGoogle,
        signup,
        logout,
        addTransaction,
        addPersonalExpense,
        deletePersonalExpense,
        deleteTransaction,
        sendFriendRequest,
        respondToRequest,
        updateProfile,
        requestSettlement,
        respondSettlement,
        createReminder,
        markReminderDone,
        resendVerificationEmail, // ⬅️ expose so UI can add "Resend verification email" button
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
