"use client";

import React, { useState, useEffect } from "react";
import { DualStorage } from "@/lib/storage/dualStorage";
import { Teacher, StudentGroup, Classroom, Subject, CourseEnrollment } from "@/lib/engine/types";
import { 
  Users, 
  GraduationCap, 
  DoorOpen, 
  BookOpen, 
  ClipboardList, 
  Plus, 
  RotateCcw,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"teachers" | "groups" | "rooms" | "subjects" | "enrollments">("teachers");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);

  useEffect(() => {
    setMounted(true);
    DualStorage.initializeDefaultData();
    refreshData();
  }, []);

  const refreshData = () => {
    setTeachers(DualStorage.getTeachers());
    setGroups(DualStorage.getStudentGroups());
    setClassrooms(DualStorage.getClassrooms());
    setSubjects(DualStorage.getSubjects());
    setEnrollments(DualStorage.getCourseEnrollments());
  };

  const handleResetData = () => {
    if (confirm("ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นชุดข้อมูลมาตรฐานแผนก IT วิทยาลัยเทคนิคระยอง หรือไม่?")) {
      DualStorage.resetToPresetRayongIT();
      refreshData();
      alert("รีเซ็ตข้อมูลเรียบร้อยแล้ว!");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            การจัดการข้อมูลพื้นฐาน (Master Data Settings)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลครูผู้สอน, กลุ่มเรียน, ห้องเรียน/ปฏิบัติการ, รายวิชา และแผนการสอน
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          รีเซ็ตข้อมูลตั้งต้น (IT ระยอง)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === "teachers"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> ครูผู้สอน ({teachers.length})
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === "groups"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> กลุ่มเรียน ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === "rooms"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <DoorOpen className="w-4 h-4" /> ห้องเรียน ({classrooms.length})
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === "subjects"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> รายวิชา ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === "enrollments"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> แผนการสอน ({enrollments.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs p-5">
        {activeTab === "teachers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">รหัสครู</th>
                  <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                  <th className="py-2.5 px-3">แผนกวิชา</th>
                  <th className="py-2.5 px-3">วุฒิการศึกษา</th>
                  <th className="py-2.5 px-3">ตำแหน่ง / หน้าที่พิเศษ</th>
                  <th className="py-2.5 px-3 text-center">ภาระสอนสูงสุด</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-semibold text-blue-700">{t.teacherCode}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{t.fullName}</td>
                    <td className="py-2 px-3 text-slate-600">{t.department}</td>
                    <td className="py-2 px-3 text-slate-600">{t.education || "-"}</td>
                    <td className="py-2 px-3 text-slate-600">{t.specialDuty || "ครูผู้สอน"}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">{t.maxPeriodsPerWeek} คาบ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">รหัสกลุ่ม</th>
                  <th className="py-2.5 px-3">ชื่อกลุ่มเรียน</th>
                  <th className="py-2.5 px-3">ระดับชั้น</th>
                  <th className="py-2.5 px-3">แผนกวิชา</th>
                  <th className="py-2.5 px-3 text-center">จำนวนนักเรียน</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{g.groupCode}</td>
                    <td className="py-2 px-3 font-medium text-slate-700">{g.groupName}</td>
                    <td className="py-2 px-3 text-slate-600">{g.gradeLevel}</td>
                    <td className="py-2 px-3 text-slate-600">{g.department}</td>
                    <td className="py-2 px-3 text-center font-bold text-blue-700">{g.studentCount} คน</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">รหัสห้อง</th>
                  <th className="py-2.5 px-3">ชื่อห้องเรียน</th>
                  <th className="py-2.5 px-3">อาคาร / สถานที่</th>
                  <th className="py-2.5 px-3">ประเภทห้อง</th>
                  <th className="py-2.5 px-3 text-center">ความจุ</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.roomCode}</td>
                    <td className="py-2 px-3 font-medium text-slate-700">{r.roomName}</td>
                    <td className="py-2 px-3 text-slate-600">{r.building}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {r.roomType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">{r.capacity} ที่นั่ง</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">รหัสวิชา</th>
                  <th className="py-2.5 px-3">ชื่อรายวิชา</th>
                  <th className="py-2.5 px-3 text-center">ท.</th>
                  <th className="py-2.5 px-3 text-center">ป.</th>
                  <th className="py-2.5 px-3 text-center">น.</th>
                  <th className="py-2.5 px-3 text-center">ชม./สัปดาห์</th>
                  <th className="py-2.5 px-3">ห้องที่ต้องการ</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">{s.subjectCode}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{s.nameTh}</td>
                    <td className="py-2 px-3 text-center">{s.theoryPeriods}</td>
                    <td className="py-2 px-3 text-center">{s.practicePeriods}</td>
                    <td className="py-2 px-3 text-center font-bold">{s.credits}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">{s.totalPeriodsPerWeek}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{s.requiredRoomType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "enrollments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3">กลุ่มเรียน</th>
                  <th className="py-2.5 px-3">รหัสวิชา</th>
                  <th className="py-2.5 px-3">ชื่อวิชา</th>
                  <th className="py-2.5 px-3">ครูผู้สอน</th>
                  <th className="py-2.5 px-3 text-center">คาบ/สัปดาห์</th>
                  <th className="py-2.5 px-3 text-center">บล็อกต่อเนื่อง</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{e.studentGroupCode}</td>
                    <td className="py-2 px-3 font-mono text-blue-700">{e.subjectCode}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{e.subjectNameTh}</td>
                    <td className="py-2 px-3 text-slate-700">{e.teacherName}</td>
                    <td className="py-2 px-3 text-center font-bold text-blue-700">{e.periodsPerWeek} คาบ</td>
                    <td className="py-2 px-3 text-center font-mono">{e.preferredConsecutivePeriods} คาบติด</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
