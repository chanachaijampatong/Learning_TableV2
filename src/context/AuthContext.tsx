"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "../lib/engine/types";
import { DualStorage } from "../lib/storage/dualStorage";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  switchRole: (role: UserRole, id?: string) => void;
  isAuthenticated: boolean;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  admin: {
    uid: "admin_01",
    email: "admin@rayongtech.ac.th",
    displayName: "ฝ่ายวิชาการ (Admin)",
    role: "admin",
  },
  teacher: {
    uid: "teacher_901002",
    email: "parinya.j@rayongtech.ac.th",
    displayName: "นายปริญญา จำเนียรพล (ครูผู้สอน)",
    role: "teacher",
    teacherId: "T901002",
  },
  student: {
    uid: "student_693190101",
    email: "student.it11@rayongtech.ac.th",
    displayName: "นักศึกษา ปวส.1 (สIT.1/1)",
    role: "student",
    studentGroupId: "G693190101",
  },
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USERS.admin,
  role: "admin",
  switchRole: () => {},
  isAuthenticated: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USERS.admin);

  useEffect(() => {
    // Initialize storage data on client load
    DualStorage.initializeDefaultData();
    const savedRole = localStorage.getItem("learning_time_user_role") as UserRole;
    if (savedRole && DEFAULT_USERS[savedRole]) {
      setUser(DEFAULT_USERS[savedRole]);
    }
  }, []);

  const switchRole = (role: UserRole, id?: string) => {
    const baseUser = { ...DEFAULT_USERS[role] };
    if (role === "teacher" && id) {
      baseUser.teacherId = id;
    } else if (role === "student" && id) {
      baseUser.studentGroupId = id;
    }
    setUser(baseUser);
    localStorage.setItem("learning_time_user_role", role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        switchRole,
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
