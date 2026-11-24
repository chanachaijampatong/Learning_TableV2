"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DualStorage } from "@/lib/storage/dualStorage";
import { ScheduleItem, Teacher, Classroom, StudentGroup, Subject } from "@/lib/engine/types";
import { MatrixView } from "@/components/timetable/MatrixView";
import { TimelineView } from "@/components/timetable/TimelineView";
import { IndependentValidator, ValidationReport } from "@/lib/engine/validator";
import { TimetableExcelExporter } from "@/lib/export/excelExporter";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  User, 
  DoorOpen, 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle,
  LayoutGrid,
  List,
  Search,
  X,
  Sparkles,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";

function TimetablesContent() {
  const searchParams = useSearchParams();
  const { role, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"group" | "teacher" | "room" | "subject">("teacher");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("T901002");
  const [displayType, setDisplayType] = useState<"matrix" | "timeline">("matrix");
  const [searchQuery, setSearchQuery] = useState("");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    DualStorage.initializeDefaultData();
    const t = DualStorage.getTeachers();
    const g = DualStorage.getStudentGroups();
    const c = DualStorage.getClassrooms();
    const s = DualStorage.getSubjects();
    const e = DualStorage.getCourseEnrollments();
    const sch = DualStorage.getScheduleItems();

    setTeachers(t);
    setGroups(g);
    setClassrooms(c);
    setSubjects(s);
    setScheduleItems(sch);

    // Check URL query parameters first (e.g. ?view=room&id=R_IT4)
    const urlView = searchParams.get("view") as "group" | "teacher" | "room" | "subject" | null;
    const urlId = searchParams.get("id");

    if (urlView && urlId) {
      setViewMode(urlView);
      setSelectedTargetId(urlId);
    } else if (role === "teacher" && user?.teacherId) {
      setViewMode("teacher");
      setSelectedTargetId(user.teacherId);
    } else if (role === "student" && user?.studentGroupId) {
      setViewMode("group");
      setSelectedTargetId(user.studentGroupId);
    } else {
      setSelectedTargetId(t[1]?.id || "T901002"); // default to อ.ปริญญา
    }

    const report = IndependentValidator.validateSchedule(sch, e, t, c, g);
    setValidationReport(report);
  }, [role, user, searchParams]);

  // Counts of periods booked per entity
  const teacherPeriodsCount = useMemo(() => {
    const map: Record<string, number> = {};
    scheduleItems.forEach(it => {
      map[it.teacherId] = (map[it.teacherId] || 0) + 1;
    });
    return map;
  }, [scheduleItems]);

  const groupPeriodsCount = useMemo(() => {
    const map: Record<string, number> = {};
    scheduleItems.forEach(it => {
      map[it.studentGroupId] = (map[it.studentGroupId] || 0) + 1;
    });
    return map;
  }, [scheduleItems]);

  const roomPeriodsCount = useMemo(() => {
    const map: Record<string, number> = {};
    scheduleItems.forEach(it => {
      map[it.classroomId] = (map[it.classroomId] || 0) + 1;
    });
    return map;
  }, [scheduleItems]);

  // Filter lists based on search
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter(t => 
      t.fullName.toLowerCase().includes(q) ||
      t.teacherCode.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(g => 
      g.groupCode.toLowerCase().includes(q) ||
      g.groupName.toLowerCase().includes(q) ||
      g.gradeLevel.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const q = searchQuery.toLowerCase().trim();
    return classrooms.filter(c => 
      c.roomCode.toLowerCase().includes(q) ||
      c.roomName.toLowerCase().includes(q) ||
      c.building.toLowerCase().includes(q)
    );
  }, [classrooms, searchQuery]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter(s => 
      s.subjectCode.toLowerCase().includes(q) ||
      s.nameTh.toLowerCase().includes(q) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  // Cross-category matches when searching
  const crossMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: { type: "teacher" | "group" | "room" | "subject"; id: string; label: string; sub: string }[] = [];

    teachers.forEach(t => {
      if (t.fullName.toLowerCase().includes(q) || t.teacherCode.includes(q)) {
        results.push({ type: "teacher", id: t.id, label: t.fullName, sub: `รหัส ${t.teacherCode}` });
      }
    });
    groups.forEach(g => {
      if (g.groupCode.toLowerCase().includes(q) || g.groupName.toLowerCase().includes(q)) {
        results.push({ type: "group", id: g.id, label: g.groupCode, sub: g.groupName });
      }
    });
    classrooms.forEach(c => {
      if (c.roomCode.toLowerCase().includes(q) || c.roomName.toLowerCase().includes(q)) {
        results.push({ type: "room", id: c.id, label: c.roomCode, sub: c.roomName });
      }
    });
    subjects.forEach(s => {
      if (s.subjectCode.toLowerCase().includes(q) || s.nameTh.toLowerCase().includes(q)) {
        results.push({ type: "subject", id: s.id, label: s.subjectCode, sub: s.nameTh });
      }
    });
    return results.slice(0, 5);
  }, [searchQuery, teachers, groups, classrooms, subjects]);

  const handleUpdateSchedule = (newItems: ScheduleItem[]) => {
    setScheduleItems(newItems);
    DualStorage.saveScheduleItems(newItems);
    const enrollments = DualStorage.getCourseEnrollments();
    const rep = IndependentValidator.validateSchedule(newItems, enrollments, teachers, classrooms, groups);
    setValidationReport(rep);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const currentTeacher = teachers.find(t => t.id === selectedTargetId) || teachers[1] || teachers[0];
      const blob = await TimetableExcelExporter.exportTeacherSchedule(
        currentTeacher,
        scheduleItems,
        subjects,
        "ภาคเรียนที่ 2 ปีการศึกษา 2569"
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ตารางสอน_${currentTeacher.fullName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("เกิดข้อผิดพลาดในการส่งออก Excel");
    } finally {
      setExporting(false);
    }
  };

  if (!mounted) return null;

  // Selected Entity metadata
  const currentTeacher = teachers.find(t => t.id === selectedTargetId);
  const currentGroup = groups.find(g => g.id === selectedTargetId);
  const currentRoom = classrooms.find(c => c.id === selectedTargetId);
  const currentSubject = subjects.find(s => s.id === selectedTargetId);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            ตารางเรียนและตารางสอน (Timetables)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            แผนกเทคโนโลยีสารสนเทศและการสื่อสาร วิทยาลัยเทคนิคระยอง (ภาคเรียนที่ 2/2569)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {viewMode === "teacher" && (
            <Link
              href={`/print/${selectedTargetId}`}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> แบบฟอร์ม สอศ. (A4 แนวนอน)
            </Link>
          )}

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {exporting ? "กำลังส่งออก..." : "ส่งออก Excel (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Validation Indicator Pill */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          validationReport?.isValid
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          {validationReport?.isValid ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span>{validationReport?.summary}</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span>Hard Violations: <strong>{validationReport?.hardViolationsCount}</strong></span>
          <span>จัดครบ: <strong>{validationReport?.completionRate}%</strong></span>
        </div>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 4-View Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode("teacher");
                setSelectedTargetId(teachers[1]?.id || teachers[0]?.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "teacher"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" /> ครูผู้สอน ({teachers.length})
            </button>
            <button
              onClick={() => {
                setViewMode("group");
                setSelectedTargetId(groups[0]?.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "group"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> กลุ่มเรียน ({groups.length})
            </button>
            <button
              onClick={() => {
                setViewMode("room");
                setSelectedTargetId(classrooms[0]?.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "room"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" /> ห้องเรียน ({classrooms.length})
            </button>
            <button
              onClick={() => {
                setViewMode("subject");
                setSelectedTargetId(subjects[0]?.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "subject"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> รายวิชา ({subjects.length})
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหาชื่อครู, กลุ่มเรียน, ห้อง, หรือรหัสวิชา..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Matrix vs Timeline Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                onClick={() => setDisplayType("matrix")}
                className={`p-1.5 rounded-lg transition ${displayType === "matrix" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                title="Matrix View (ตาราง 2 มิติ)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayType("timeline")}
                className={`p-1.5 rounded-lg transition ${displayType === "timeline" ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                title="Timeline View (มุมมองเรียงวัน)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cross Category Search Suggestions */}
        {searchQuery.trim().length >= 2 && crossMatches.length > 0 && (
          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              ผลการค้นหาตรงกัน:
            </span>
            {crossMatches.map((match) => (
              <button
                key={`${match.type}_${match.id}`}
                onClick={() => {
                  setViewMode(match.type);
                  setSelectedTargetId(match.id);
                  setSearchQuery("");
                }}
                className="bg-white hover:bg-blue-600 hover:text-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition"
              >
                <span className="text-[10px] text-blue-600 font-bold uppercase">
                  {match.type === "teacher" ? "ครู" : match.type === "group" ? "กลุ่ม" : match.type === "room" ? "ห้อง" : "วิชา"}
                </span>
                <span>{match.label}</span>
                <span className="text-[10px] opacity-70">({match.sub})</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick-Switch Avatar Chips & Badge Pills Bar */}
        <div className="pt-2 border-t border-slate-100">
          {viewMode === "teacher" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {filteredTeachers.map(t => {
                const isSelected = selectedTargetId === t.id;
                const hours = teacherPeriodsCount[t.id] || 0;
                const initials = t.firstName.slice(0, 1) + (t.lastName ? t.lastName.slice(0, 1) : "");

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTargetId(t.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {initials}
                    </div>
                    <span className="truncate max-w-[130px]">{t.fullName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-blue-200/80 text-blue-900 font-bold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {hours}/{t.maxPeriodsPerWeek} คาบ
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === "group" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {filteredGroups.map(g => {
                const isSelected = selectedTargetId === g.id;
                const hours = groupPeriodsCount[g.id] || 0;
                const isPws = g.gradeLevel.includes("ปวส");

                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedTargetId(g.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isPws ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {g.gradeLevel}
                    </span>
                    <span className="font-semibold">{g.groupCode}</span>
                    <span className="text-[10px] text-slate-400">({g.studentCount} คน)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-blue-200/80 text-blue-900 font-bold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {hours} คาบ
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === "room" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {filteredClassrooms.map(c => {
                const isSelected = selectedTargetId === c.id;
                const hours = roomPeriodsCount[c.id] || 0;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTargetId(c.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <DoorOpen className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="font-semibold">{c.roomCode}</span>
                    <span className="text-[10px] text-slate-400">({c.capacity} ที่นั่ง)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-blue-200/80 text-blue-900 font-bold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {hours} คาบ
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === "subject" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {filteredSubjects.map(s => {
                const isSelected = selectedTargetId === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedTargetId(s.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="font-semibold font-mono">{s.subjectCode}</span>
                    <span className="truncate max-w-[140px] text-slate-600">{s.nameTh}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-blue-200/80 text-blue-900 font-bold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.credits} น.
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Entity Visual Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {viewMode === "teacher" && currentTeacher && (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {currentTeacher.firstName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentTeacher.fullName}</h2>
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {currentTeacher.teacherCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTeacher.specialDuty || "ครูผู้สอน"} • {currentTeacher.department}
              </p>
            </div>
          </div>
        )}

        {viewMode === "group" && currentGroup && (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">กลุ่ม {currentGroup.groupCode}</h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {currentGroup.gradeLevel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentGroup.groupName} • จำนวนนักเรียน {currentGroup.studentCount} คน
              </p>
            </div>
          </div>
        )}

        {viewMode === "room" && currentRoom && (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentRoom.roomCode} - {currentRoom.roomName}</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {currentRoom.roomType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentRoom.building} • ความจุ {currentRoom.capacity} ที่นั่ง
              </p>
            </div>
          </div>
        )}

        {viewMode === "subject" && currentSubject && (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentSubject.subjectCode} - {currentSubject.nameTh}</h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {currentSubject.credits} หน่วยกิต ({currentSubject.theoryPeriods}-{currentSubject.practicePeriods}-{currentSubject.totalPeriodsPerWeek})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentSubject.nameEn || currentSubject.department} • ห้องที่ต้องการ: {currentSubject.requiredRoomType}
              </p>
            </div>
          </div>
        )}

        {/* Workload / Utilization Progress Indicator */}
        <div className="flex items-center gap-4 text-xs font-medium w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
          {viewMode === "teacher" && currentTeacher && (
            <div className="text-right">
              <div className="text-[11px] text-slate-400">ภาระการสอนตามตาราง</div>
              <div className="text-base font-bold text-blue-600">
                {teacherPeriodsCount[currentTeacher.id] || 0} / {currentTeacher.maxPeriodsPerWeek} คาบ
              </div>
            </div>
          )}
          {viewMode === "group" && currentGroup && (
            <div className="text-right">
              <div className="text-[11px] text-slate-400">ชั่วโมงเรียนต่อสัปดาห์</div>
              <div className="text-base font-bold text-purple-600">
                {groupPeriodsCount[currentGroup.id] || 0} คาบ
              </div>
            </div>
          )}
          {viewMode === "room" && currentRoom && (
            <div className="text-right">
              <div className="text-[11px] text-slate-400">อัตราการใช้งานห้อง</div>
              <div className="text-base font-bold text-emerald-600">
                {roomPeriodsCount[currentRoom.id] || 0} / 45 คาบ ({Math.round(((roomPeriodsCount[currentRoom.id] || 0) / 45) * 100)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Display Content: Matrix or Timeline */}
      {displayType === "matrix" ? (
        <MatrixView
          scheduleItems={scheduleItems}
          teachers={teachers}
          classrooms={classrooms}
          studentGroups={groups}
          subjects={subjects}
          viewMode={viewMode}
          selectedTargetId={selectedTargetId}
          onUpdateSchedule={handleUpdateSchedule}
          canEdit={role === "admin"}
        />
      ) : (
        <TimelineView
          scheduleItems={scheduleItems}
          teachers={teachers}
          classrooms={classrooms}
          studentGroups={groups}
          viewMode={viewMode}
          selectedTargetId={selectedTargetId}
        />
      )}
    </div>
  );
}

export default function TimetablesPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">กำลังโหลดข้อมูลตารางสอน...</span>
      </div>
    }>
      <TimetablesContent />
    </Suspense>
  );
}
