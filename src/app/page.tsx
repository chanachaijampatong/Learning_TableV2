"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DualStorage } from "@/lib/storage/dualStorage";
import { IndependentValidator, ValidationReport } from "@/lib/engine/validator";
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  DoorOpen, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Printer, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Search,
  X,
  User,
  BarChart3,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [term, setTerm] = useState(DualStorage.getActiveTerm());
  const [teachers, setTeachers] = useState(DualStorage.getTeachers());
  const [groups, setGroups] = useState(DualStorage.getStudentGroups());
  const [classrooms, setClassrooms] = useState(DualStorage.getClassrooms());
  const [subjects, setSubjects] = useState(DualStorage.getSubjects());
  const [enrollments, setEnrollments] = useState(DualStorage.getCourseEnrollments());
  const [schedules, setSchedules] = useState(DualStorage.getScheduleItems());
  const [report, setReport] = useState<ValidationReport | null>(null);

  // Quick Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    DualStorage.initializeDefaultData();
    const t = DualStorage.getActiveTerm();
    const tc = DualStorage.getTeachers();
    const g = DualStorage.getStudentGroups();
    const c = DualStorage.getClassrooms();
    const s = DualStorage.getSubjects();
    const e = DualStorage.getCourseEnrollments();
    const sch = DualStorage.getScheduleItems();

    setTerm(t);
    setTeachers(tc);
    setGroups(g);
    setClassrooms(c);
    setSubjects(s);
    setEnrollments(e);
    setSchedules(sch);

    const val = IndependentValidator.validateSchedule(sch, e, tc, c, g);
    setReport(val);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick schedule search suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchedTeachers = teachers.filter(t => 
      t.fullName.toLowerCase().includes(q) || t.teacherCode.includes(q)
    ).slice(0, 4);

    const matchedGroups = groups.filter(g => 
      g.groupCode.toLowerCase().includes(q) || g.groupName.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedRooms = classrooms.filter(c => 
      c.roomCode.toLowerCase().includes(q) || c.roomName.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedSubjects = subjects.filter(s => 
      s.subjectCode.toLowerCase().includes(q) || s.nameTh.toLowerCase().includes(q)
    ).slice(0, 4);

    const totalMatches = matchedTeachers.length + matchedGroups.length + matchedRooms.length + matchedSubjects.length;

    return {
      teachers: matchedTeachers,
      groups: matchedGroups,
      rooms: matchedRooms,
      subjects: matchedSubjects,
      totalMatches
    };
  }, [searchQuery, teachers, groups, classrooms, subjects]);

  // Classroom utilization calculations
  const classroomUtilization = useMemo(() => {
    const MAX_PERIODS = 45; // 5 days * 9 standard periods (excluding lunch)
    return classrooms.map(room => {
      const booked = schedules.filter(s => s.classroomId === room.id).length;
      const percentage = Math.min(100, Math.round((booked / MAX_PERIODS) * 100));
      return {
        ...room,
        bookedPeriods: booked,
        maxPeriods: MAX_PERIODS,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [classrooms, schedules]);

  const averageUtilization = useMemo(() => {
    if (classroomUtilization.length === 0) return 0;
    const sum = classroomUtilization.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / classroomUtilization.length);
  }, [classroomUtilization]);

  if (!mounted) return null;

  const totalRequiredPeriods = enrollments.reduce((sum, e) => sum + e.periodsPerWeek, 0);

  const handleSelectResult = (view: "teacher" | "group" | "room" | "subject", id: string) => {
    setIsSearchFocused(false);
    setSearchQuery("");
    router.push(`/timetables?view=${view}&id=${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Term Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs px-2.5 py-1 rounded-full font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            ระบบจัดตารางสอน สอศ. ระดับภาค - 85 คะแนนเทคนิค
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ระบบจัดตารางการเรียนการสอนอัตโนมัติ (Learning-Time)
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
            แผนกเทคโนโลยีสารสนเทศและการสื่อสาร วิทยาลัยเทคนิคระยอง | {term.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/timetables"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
          >
            <Calendar className="w-4 h-4" /> ดูตารางเรียน/สอน
          </Link>
          <Link
            href="/benchmarks"
            className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm border border-indigo-400/30 transition shadow-md"
          >
            <Cpu className="w-4 h-4" /> AI Engine & Benchmark
          </Link>
        </div>
      </div>

      {/* Quick Schedule Search Bar */}
      <div 
        ref={searchContainerRef}
        className="relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-600" />
              ค้นหาตารางเรียน / ตารางสอนด่วน (Quick Schedule Search)
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ค้นหาได้ทั้งชื่อครู, รหัสกลุ่มเรียน, ห้องปฏิบัติการ หรือรหัสวิชา
            </span>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="พิมพ์ชื่อครู (เช่น ปริญญา), กลุ่มเรียน (เช่น สIT.1/1), ห้อง (เช่น IT-4), หรือรหัสวิชา..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick shortcuts pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">ทางลัดด่วน:</span>
            <button
              onClick={() => handleSelectResult("teacher", "T901002")}
              className="px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium transition"
            >
              👨‍🏫 อ.ปริญญา
            </button>
            <button
              onClick={() => handleSelectResult("teacher", "T901001")}
              className="px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium transition"
            >
              👩‍🏫 อ.ทัศนีย์
            </button>
            <button
              onClick={() => handleSelectResult("group", "G693190101")}
              className="px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-medium transition"
            >
              🎓 สIT.1/1 (ม.6)
            </button>
            <button
              onClick={() => handleSelectResult("group", "G682190101")}
              className="px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-medium transition"
            >
              🎓 IT.2/1
            </button>
            <button
              onClick={() => handleSelectResult("room", "R_IT4")}
              className="px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium transition"
            >
              🏫 ห้อง IT-4 (Com Lab)
            </button>
            <button
              onClick={() => handleSelectResult("room", "R_IT5")}
              className="px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium transition"
            >
              🏫 ห้อง IT-5
            </button>
          </div>
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {isSearchFocused && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {searchResults.totalMatches === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                ไม่พบผลการค้นหาสำหรับ &quot;{searchQuery}&quot; ลองค้นหาด้วยชื่อครู หรือรหัสกลุ่มเรียน
              </div>
            ) : (
              <div className="space-y-3">
                {/* Teachers Results */}
                {searchResults.teachers.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      ครูผู้สอน ({searchResults.teachers.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.teachers.map(t => (
                        <div
                          key={t.id}
                          onClick={() => handleSelectResult("teacher", t.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {t.firstName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{t.fullName}</div>
                              <div className="text-[10px] text-slate-400">รหัส {t.teacherCode} • {t.specialDuty || t.department}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            ดูตารางสอน <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups Results */}
                {searchResults.groups.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      กลุ่มผู้เรียน ({searchResults.groups.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.groups.map(g => (
                        <div
                          key={g.id}
                          onClick={() => handleSelectResult("group", g.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50 cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {g.gradeLevel.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{g.groupCode} ({g.groupName})</div>
                              <div className="text-[10px] text-slate-400">{g.gradeLevel} • {g.studentCount} คน</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            ดูตารางเรียน <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rooms Results */}
                {searchResults.rooms.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />
                      ห้องเรียน / ห้องปฏิบัติการ ({searchResults.rooms.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.rooms.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectResult("room", c.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {c.roomCode.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{c.roomCode} - {c.roomName}</div>
                              <div className="text-[10px] text-slate-400">{c.building} • {c.capacity} ที่นั่ง</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            ดูตารางห้อง <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects Results */}
                {searchResults.subjects.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      รายวิชา ({searchResults.subjects.length})
                    </div>
                    <div className="space-y-1">
                      {searchResults.subjects.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectResult("subject", s.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px]">
                              {s.credits}น
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{s.subjectCode} - {s.nameTh}</div>
                              <div className="text-[10px] text-slate-400">{s.credits} หน่วยกิต • ห้องที่ต้องการ: {s.requiredRoomType}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            ดูตารางวิชา <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Status Summary Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              report?.isValid
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {report?.isValid ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                สถานะความถูกต้อง (Independent Validation)
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  report?.isValid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {report?.isValid ? "Zero Conflict (สมบูรณ์ 100%)" : "ต้องตรวจสอบ"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {report?.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
          <div>
            <div className="text-[11px] text-slate-400">Hard Violations</div>
            <div className={`text-base font-bold ${report?.hardViolationsCount === 0 ? "text-emerald-600" : "text-red-600"}`}>
              {report?.hardViolationsCount ?? 0} จุด
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">อัตราการจัดคาบ</div>
            <div className="text-base font-bold text-blue-600">
              {report?.completionRate ?? 100}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Soft Score</div>
            <div className="text-base font-bold text-slate-700">
              {report?.softPenaltyScore ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">ครูผู้สอน</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{teachers.length} ท่าน</div>
            <div className="text-[11px] text-slate-400 mt-0.5">แผนก IT เทคนิคระยอง</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">กลุ่มผู้เรียน</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{groups.length} กลุ่ม</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ปวช. 1-3 & ปวส. 1-2</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">ห้องเรียน/ปฏิบัติการ</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{classrooms.length} ห้อง</div>
            <div className="text-[11px] text-slate-400 mt-0.5">IT-Lab, Theory, Workshop</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">คาบเรียนที่จัดแล้ว</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {schedules.length} คาบ
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              เป้าหมาย: {totalRequiredPeriods} คาบ/สัปดาห์
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Classroom Utilization Indicators Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                อัตราการใช้งานห้องเรียนและห้องปฏิบัติการ (Classroom Utilization)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ความหนาแน่นของการใช้ห้องเรียนรายสัปดาห์ (โควตามาตรฐาน 45 คาบ/สัปดาห์ ไม่รวมพักกลางวัน)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium">
            <span className="text-slate-500">อัตราเฉลี่ยทั้งแผนก:</span>
            <span className="text-base font-bold text-blue-600">{averageUtilization}%</span>
          </div>
        </div>

        {/* Utilization Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {classroomUtilization.map(room => {
            const isHigh = room.percentage >= 75;
            const isMedium = room.percentage >= 50 && room.percentage < 75;
            
            return (
              <div 
                key={room.id}
                className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                          {room.roomCode}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          room.roomType === "COMPUTER_LAB"
                            ? "bg-blue-100 text-blue-800"
                            : room.roomType === "WORKSHOP"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {room.roomType === "COMPUTER_LAB" ? "Lab คอม" : room.roomType === "WORKSHOP" ? "ช็อปซ่อมบำรุง" : "ทฤษฎี"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{room.roomName}</p>
                    </div>

                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      isHigh
                        ? "bg-emerald-100 text-emerald-800"
                        : isMedium
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {room.percentage}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>จัดตาราง: {room.bookedPeriods} / {room.maxPeriods} คาบ</span>
                      <span>ความจุ {room.capacity} ที่นั่ง</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          room.percentage > 85
                            ? "bg-rose-500"
                            : room.percentage >= 65
                            ? "bg-blue-600"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${room.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{room.building}</span>
                  <Link
                    href={`/timetables?view=room&id=${room.id}`}
                    className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                  >
                    ดูตารางห้องนี้ <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/timetables"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition">
              ตารางเรียน/สอน 4 มิติ
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              สลับมุมมองได้ทั้งกลุ่มเรียน, ครูผู้สอน, ห้องเรียน และรายวิชา พร้อมระบบลากสลับคาบแบบ Real-time ตรวจจับการชนทันที
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>เข้าสู่หน้าตาราง</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          href="/print/T901002"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-800 group-hover:text-purple-600 transition">
              แบบฟอร์มทางการ สอศ. (A4 แนวนอน)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ถอดแบบเอกสารจริง 100% สรุป ท/ป/น/ช, ตารางสอนรายบุคคล, แถบกิจกรรมหน้าเสาธง และช่องลงนาม 4 ฝ่าย พอดี 1 หน้า A4
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <span>พรีวิวและพิมพ์เอกสาร</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          href="/benchmarks"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-800 group-hover:text-indigo-600 transition">
              AI Scheduling Engine & Benchmark
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              เปรียบเทียบ Genetic Algorithm (GA with Repair) กับ Baseline Greedy ผ่าน 3-5 Seeds แสดงกราฟวิวัฒนาการและบันทึกผลการทดลอง
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>ทดสอบอัลกอริทึม</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>
    </div>
  );
}
