import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  loginAs: (email: string, role: UserRole, name: string) => void;
  logout: () => Promise<void>;
  canAccessFinance: boolean;
  canEdit: boolean;
  isOwner: boolean;
  isStaff: boolean;
  isViewer: boolean;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  owner: {
    id: 1,
    uid: 'owner_default_uid',
    email: 'geetajoshiharish@gmail.com',
    name: 'Harish & Geeta (Owner)',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  },
  staff: {
    id: 2,
    uid: 'staff_default_uid',
    email: 'operator@printhub3d.com',
    name: 'Rohan Sharma (Lab Tech)',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
  },
  viewer: {
    id: 3,
    uid: 'viewer_default_uid',
    email: 'accountant@printhub3d.com',
    name: 'Pooja Iyer (Accounts/Audit)',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('owner');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS.owner);

  useEffect(() => {
    // Listen for Firebase Auth changes if user signs in with Google
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const profile: UserProfile = {
          id: 100,
          uid: user.uid,
          email: user.email || 'user@printhub3d.com',
          name: user.displayName || 'Authorized User',
          role: role,
          avatar: user.photoURL || undefined,
        };
        setCurrentUser(profile);
      }
    });
    return () => unsubscribe();
  }, [role]);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setCurrentUser(DEFAULT_USERS[newRole]);
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        setCurrentUser({
          id: 101,
          uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || 'Google User',
          role: 'owner',
          avatar: result.user.photoURL,
        });
        setRole('owner');
      }
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
    }
  };

  const loginAs = (email: string, userRole: UserRole, name: string) => {
    setRole(userRole);
    setCurrentUser({
      id: Date.now(),
      uid: `uid_${Date.now()}`,
      email,
      name,
      role: userRole,
    });
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    // Reset to demo owner
    switchRole('owner');
  };

  const isOwner = role === 'owner';
  const isStaff = role === 'staff';
  const isViewer = role === 'viewer';
  const canAccessFinance = isOwner; // Staff has no finance access; Viewer is read-only
  const canEdit = isOwner || isStaff;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        switchRole,
        signInWithGoogle,
        loginAs,
        logout,
        canAccessFinance,
        canEdit,
        isOwner,
        isStaff,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
