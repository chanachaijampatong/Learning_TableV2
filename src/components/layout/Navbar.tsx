"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/engine/types";
import { DualStorage } from "@/lib/storage/dualStorage";
import { 
  Calendar, 
  Layers, 
  BarChart3, 
  UploadCloud, 
  Settings, 
  ShieldCheck, 
  User, 
  GraduationCap, 
  RotateCcw,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, switchRole } = useAuth();
  const [resetMessage, setResetMessage] = useState(false);

  const navLinks = [
    { href: "/", label: "แดชบอร์ด", icon: Layers, roles: ["admin", "teacher", "student"] },
    { href: "/timetables", label: "ตารางเรียน/สอน", icon: Calendar, roles: ["admin", "teacher", "student"] },
    { href: "/benchmarks", label: "AI Engine & Benchmark", icon: BarChart3, roles: ["admin"] },
    { href: "/import", label: "นำเข้าข้อมูล", icon: UploadCloud, roles: ["admin"] },
    { href: "/settings", label: "จัดการข้อมูล", icon: Settings, roles: ["admin"] },
  ];

  const filteredLinks = navLinks.filter(l => l.roles.includes(role));

  const handleResetData = () => {
    if (confirm("ต้องการรีเซ็ตข้อมูลเป็นชุดตัวอย่างมาตรฐาน 'แผนก IT วิทยาลัยเทคนิคระยอง' หรือไม่?")) {
      DualStorage.resetToPresetRayongIT();
      setResetMessage(true);
      setTimeout(() => {
        setResetMessage(false);
        window.location.reload();
      }, 800);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Quick Test Login Bar (For competition & testing) */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> โหมดทดสอบสิทธิ์ (RBAC Demo):
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchRole("admin")}
              className={`px-2 py-0.5 rounded transition ${
                role === "admin"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              1. Admin (ฝ่ายวิชาการ)
            </button>
            <button
              onClick={() => switchRole("teacher")}
              className={`px-2 py-0.5 rounded transition ${
                role === "teacher"
                  ? "bg-purple-600 text-white font-medium"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              2. Teacher (อ.ปริญญา)
            </button>
            <button
              onClick={() => switchRole("student")}
              className={`px-2 py-0.5 rounded transition ${
                role === "student"
                  ? "bg-emerald-600 text-white font-medium"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              3. Student (ปวส.1 สIT.1/1)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition"
            title="รีเซ็ตเป็นข้อมูลจริง แผนก IT วิทยาลัยเทคนิคระยอง"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>โหลดชุดข้อมูล IT ระยอง (1-Click)</span>
          </button>
          {resetMessage && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> รีเซ็ตสำเร็จ!
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-sm text-white">
              LT
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                Learning-Time
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-500/30">
                  AI v2.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                วิทยาลัยเทคนิคระยอง (สอศ.)
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {filteredLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Current User Profile Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white flex items-center justify-end gap-1">
              {user?.displayName}
            </div>
            <div className="text-xs text-slate-400">
              สถานะ: <span className="text-blue-400 font-mono capitalize">{role}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            {role === "admin" ? (
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            ) : role === "teacher" ? (
              <User className="w-5 h-5 text-purple-400" />
            ) : (
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
