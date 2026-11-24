"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ScheduleItem, Teacher, Classroom, StudentGroup, Subject } from "@/lib/engine/types";
import { STANDARD_PERIODS, BREAK_PERIOD } from "@/lib/engine/constraints";
import { IndependentValidator } from "@/lib/engine/validator";
import { DualStorage } from "@/lib/storage/dualStorage";
import { 
  AlertCircle, 
  ArrowLeftRight, 
  Check, 
  MapPin, 
  User, 
  Users, 
  Lock, 
  Info, 
  X, 
  BookOpen, 
  Clock, 
  DoorOpen, 
  GraduationCap, 
  Printer, 
  Sparkles,
  ExternalLink
} from "lucide-react";

interface MatrixViewProps {
  scheduleItems: ScheduleItem[];
  teachers: Teacher[];
  classrooms: Classroom[];
  studentGroups: StudentGroup[];
  subjects?: Subject[];
  viewMode: "group" | "teacher" | "room" | "subject";
  selectedTargetId: string;
  onUpdateSchedule?: (updatedItems: ScheduleItem[]) => void;
  canEdit?: boolean;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  scheduleItems,
  teachers,
  classrooms,
  studentGroups,
  subjects,
  viewMode,
  selectedTargetId,
  onUpdateSchedule,
  canEdit = true
}) => {
  // Filter items matching the current view mode and selected target
  const filteredItems = scheduleItems.filter(item => {
    if (viewMode === "group") return item.studentGroupId === selectedTargetId;
    if (viewMode === "teacher") return item.teacherId === selectedTargetId;
    if (viewMode === "room") return item.classroomId === selectedTargetId;
    if (viewMode === "subject") return item.subjectId === selectedTargetId;
    return true;
  });

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number; item?: ScheduleItem } | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ScheduleItem | null>(null);
  const [swapAlert, setSwapAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>(subjects || []);

  useEffect(() => {
    if (!subjects || subjects.length === 0) {
      setAllSubjects(DualStorage.getSubjects());
    } else {
      setAllSubjects(subjects);
    }
  }, [subjects]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSlot(null);
        setSelectedDetailItem(null);
        setSwapAlert(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const days = [
    { day: 1, name: "วันจันทร์", color: "bg-amber-500/10 border-amber-500/30 text-amber-700" },
    { day: 2, name: "วันอังคาร", color: "bg-pink-500/10 border-pink-500/30 text-pink-700" },
    { day: 3, name: "วันพุธ", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" },
    { day: 4, name: "วันพฤหัสบดี", color: "bg-orange-500/10 border-orange-500/30 text-orange-700" },
    { day: 5, name: "วันศุกร์", color: "bg-blue-500/10 border-blue-500/30 text-blue-700" },
  ];

  // Helper to find item at slot
  const getItemAt = (day: number, period: number) => {
    return filteredItems.find(item => item.dayOfWeek === day && item.periodNumber === period);
  };

  const handleCellClick = (day: number, period: number) => {
    if (!canEdit) return;
    if (period === BREAK_PERIOD) {
      setSwapAlert({ type: "error", message: "คาบที่ 5 เป็นเวลาพักกลางวัน ไม่อนุญาตให้จัดคาบเรียน" });
      setTimeout(() => setSwapAlert(null), 3500);
      return;
    }

    const clickedItem = getItemAt(day, period);

    // If nothing selected yet, select this slot
    if (!selectedSlot) {
      if (clickedItem) {
        setSelectedSlot({ day, period, item: clickedItem });
        setSwapAlert({ type: "success", message: `เลือกวิชา "${clickedItem.subjectCode}" แล้ว คลิกเลือกช่องปลายทางที่ต้องการสลับ/ย้าย` });
      }
      return;
    }

    // If clicking same slot, cancel selection
    if (selectedSlot.day === day && selectedSlot.period === period) {
      setSelectedSlot(null);
      setSwapAlert(null);
      return;
    }

    // Attempt Swap / Move
    const sourceItem = selectedSlot.item;
    const targetItem = clickedItem;

    if (!sourceItem) {
      setSelectedSlot(null);
      return;
    }

    // Validate placement of sourceItem into target slot
    const validation1 = IndependentValidator.validateCandidatePlacement(
      {
        id: sourceItem.id,
        teacherId: sourceItem.teacherId,
        classroomId: sourceItem.classroomId,
        studentGroupId: sourceItem.studentGroupId,
        dayOfWeek: day,
        periodNumber: period,
      },
      scheduleItems.filter(it => it.id !== sourceItem.id && it.id !== targetItem?.id),
      teachers
    );

    if (!validation1.valid) {
      setSwapAlert({ type: "error", message: `ไม่สามารถย้ายได้: ${validation1.reason}` });
      setTimeout(() => setSwapAlert(null), 4000);
      return;
    }

    // If target has an item, validate targetItem placed into source slot
    if (targetItem) {
      const validation2 = IndependentValidator.validateCandidatePlacement(
        {
          id: targetItem.id,
          teacherId: targetItem.teacherId,
          classroomId: targetItem.classroomId,
          studentGroupId: targetItem.studentGroupId,
          dayOfWeek: selectedSlot.day,
          periodNumber: selectedSlot.period,
        },
        scheduleItems.filter(it => it.id !== sourceItem.id && it.id !== targetItem.id),
        teachers
      );

      if (!validation2.valid) {
        setSwapAlert({ type: "error", message: `ไม่สามารถสลับได้: ${validation2.reason}` });
        setTimeout(() => setSwapAlert(null), 4000);
        return;
      }
    }

    // Execute swap in schedule
    const updated = scheduleItems.map(item => {
      if (item.id === sourceItem.id) {
        return {
          ...item,
          dayOfWeek: day,
          periodNumber: period,
          startTime: STANDARD_PERIODS.find(p => p.period === period)?.startTime || item.startTime,
          endTime: STANDARD_PERIODS.find(p => p.period === period)?.endTime || item.endTime,
        };
      }
      if (targetItem && item.id === targetItem.id) {
        return {
          ...item,
          dayOfWeek: selectedSlot.day,
          periodNumber: selectedSlot.period,
          startTime: STANDARD_PERIODS.find(p => p.period === selectedSlot.period)?.startTime || item.startTime,
          endTime: STANDARD_PERIODS.find(p => p.period === selectedSlot.period)?.endTime || item.endTime,
        };
      }
      return item;
    });

    if (onUpdateSchedule) {
      onUpdateSchedule(updated);
    }

    setSwapAlert({
      type: "success",
      message: targetItem ? "สลับคาบเรียนสำเร็จ ปราศจากข้อขัดแย้ง!" : "ย้ายคาบเรียนไปยังตำแหน่งใหม่สำเร็จ!"
    });
    setSelectedSlot(null);
    setTimeout(() => setSwapAlert(null), 3000);
  };

  // Find linked entities for modal detail
  const detailSubject = selectedDetailItem 
    ? allSubjects.find(s => s.id === selectedDetailItem.subjectId || s.subjectCode === selectedDetailItem.subjectCode)
    : null;
  const detailTeacher = selectedDetailItem
    ? teachers.find(t => t.id === selectedDetailItem.teacherId)
    : null;
  const detailGroup = selectedDetailItem
    ? studentGroups.find(g => g.id === selectedDetailItem.studentGroupId)
    : null;
  const detailRoom = selectedDetailItem
    ? classrooms.find(c => c.id === selectedDetailItem.classroomId)
    : null;

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Alert Banner for live placement check */}
      {swapAlert && (
        <div
          className={`px-4 py-2.5 flex items-center justify-between gap-2 text-sm font-medium transition-all ${
            swapAlert.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
              : "bg-red-50 text-red-800 border-b border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {swapAlert.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{swapAlert.message}</span>
          </div>
          <button 
            onClick={() => setSwapAlert(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action / Guidance Bar */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            คำแนะนำการใช้งาน:
          </span>
          <span>
            {selectedSlot 
              ? "👉 กำลังอยู่ในโหมดสลับ/ย้าย: คลิกเลือกช่องว่างเพื่อย้าย หรือคลิกวิชาอื่นเพื่อสลับตำแหน่ง"
              : "คลิกไอคอน (i) บนคาบเรียนเพื่อดูข้อมูลวิชาแบบเต็ม หรือคลิกบนคาบเรียนเพื่อสลับ/ย้ายตำแหน่ง"}
          </span>
        </div>
        {selectedSlot && (
          <button
            onClick={() => { setSelectedSlot(null); setSwapAlert(null); }}
            className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            ยกเลิกการเลือก (Esc)
          </button>
        )}
      </div>

      {/* Timetable Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 w-28 border-r border-slate-200 sticky left-0 bg-slate-100 z-10">
                วัน / เวลา
              </th>
              <th className="py-2 px-1 w-20 border-r border-slate-200 bg-slate-200/70 text-[11px]">
                08:00 - 08:30
                <div className="font-normal text-slate-500">กิจกรรมหน้าเสาธง</div>
              </th>
              {STANDARD_PERIODS.map(p => (
                <th
                  key={p.period}
                  className={`py-2 px-1 border-r border-slate-200 ${
                    p.period === BREAK_PERIOD
                      ? "bg-amber-50/70 text-amber-900 w-24"
                      : "min-w-[85px]"
                  }`}
                >
                  <div className="text-xs font-bold">
                    {p.period === BREAK_PERIOD ? "พักกลางวัน" : `คาบ ${p.period < BREAK_PERIOD ? p.period : p.period - 1}`}
                  </div>
                  <div className="text-[10px] font-normal text-slate-500">
                    {p.startTime} - {p.endTime}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d, dIdx) => (
              <tr key={d.day} className="border-b border-slate-200 hover:bg-slate-50/50">
                {/* Day Header */}
                <td className="py-3 px-3 border-r border-slate-200 font-medium text-xs sticky left-0 bg-white z-10">
                  <div className={`py-1 px-2 rounded-md font-semibold ${d.color}`}>
                    {d.name}
                  </div>
                </td>

                {/* Flag Ceremony */}
                {dIdx === 0 ? (
                  <td
                    rowSpan={5}
                    className="border-r border-slate-200 bg-slate-100/80 text-slate-500 text-xs font-medium p-2 select-none"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="[writing-mode:vertical-lr] tracking-widest text-[11px] font-semibold text-slate-600">
                        กิจกรรมหน้าเสาธง / โฮมรูม
                      </span>
                    </div>
                  </td>
                ) : null}

                {/* Periods 1 to 10 */}
                {STANDARD_PERIODS.map(p => {
                  const item = getItemAt(d.day, p.period);
                  const isBreak = p.period === BREAK_PERIOD;
                  const isSelected = selectedSlot?.day === d.day && selectedSlot?.period === p.period;
                  const isAvailableTarget = selectedSlot && !isSelected && !isBreak;

                  if (isBreak) {
                    if (dIdx === 0) {
                      return (
                        <td
                          key={p.period}
                          rowSpan={5}
                          className="border-r border-slate-200 bg-amber-50/50 text-amber-800 text-xs p-1 select-none"
                        >
                          <div className="flex flex-col items-center justify-center h-full text-amber-700/80">
                            <Lock className="w-3.5 h-3.5 mb-1 text-amber-500" />
                            <span className="[writing-mode:vertical-lr] tracking-widest font-medium text-[11px]">
                              พักกลางวัน (12:30 - 13:30)
                            </span>
                          </div>
                        </td>
                      );
                    }
                    return null; // Covered by rowSpan
                  }

                  return (
                    <td
                      key={p.period}
                      onClick={() => handleCellClick(d.day, p.period)}
                      className={`p-1 border-r border-slate-200 align-top transition cursor-pointer relative h-20 ${
                        isSelected
                          ? "ring-4 ring-blue-500 ring-offset-1 bg-blue-100/90 z-20 shadow-md"
                          : isAvailableTarget
                          ? item
                            ? "hover:ring-2 hover:ring-purple-400 hover:bg-purple-50/60 transition"
                            : "bg-emerald-50/30 hover:bg-emerald-100/70 border-dashed border-emerald-300"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {item ? (
                        <div
                          className={`group relative w-full h-full rounded-lg p-1.5 text-left flex flex-col justify-between border shadow-xs transition hover:shadow-sm ${
                            isSelected
                              ? "bg-blue-100 border-blue-400 text-blue-950 font-medium"
                              : item.roomCode === "สถานประกอบการ"
                              ? "bg-purple-50 border-purple-200 text-purple-900"
                              : item.roomType === "COMPUTER_LAB"
                              ? "bg-blue-50/90 border-blue-200 text-blue-950"
                              : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                          }`}
                        >
                          {/* Top row with code, consecutive tag, and info modal button */}
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] tracking-tight truncate">
                                {item.subjectCode}
                              </span>
                              <div className="flex items-center gap-1">
                                {item.isConsecutive && (
                                  <span className="text-[9px] bg-white/80 border px-1 rounded text-slate-500 font-mono">
                                    {item.consecutiveIndex}/{item.totalConsecutive}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetailItem(item);
                                  }}
                                  title="คลิกดูรายละเอียดรายวิชาและผู้สอน"
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded-full hover:bg-white/80 transition"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-[10px] line-clamp-1 font-medium mt-0.5" title={item.subjectNameTh}>
                              {item.subjectNameTh}
                            </div>
                          </div>

                          {/* Swap hint on hover when slot is selected */}
                          {isAvailableTarget && (
                            <div className="absolute inset-0 bg-purple-600/90 text-white rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition shadow-md z-10 pointer-events-none">
                              <ArrowLeftRight className="w-3 h-3" /> สลับกับวิชานี้
                            </div>
                          )}

                          <div className="pt-1 mt-1 border-t border-slate-200/60 text-[9px] text-slate-600 flex flex-col gap-0.5">
                            {viewMode !== "group" && (
                              <div className="flex items-center gap-1 font-semibold text-slate-800 truncate">
                                <Users className="w-2.5 h-2.5 text-slate-500" />
                                {item.studentGroupCode}
                              </div>
                            )}
                            {viewMode !== "teacher" && (
                              <div className="flex items-center gap-1 truncate text-slate-600">
                                <User className="w-2.5 h-2.5 text-slate-400" />
                                {item.teacherName}
                              </div>
                            )}
                            {viewMode !== "room" && (
                              <div className="flex items-center gap-1 font-mono text-slate-700">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {item.roomCode}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-full rounded-lg border flex flex-col items-center justify-center text-[10px] transition ${
                          isAvailableTarget
                            ? "border-dashed border-emerald-400 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100/80 font-medium"
                            : "border-dashed border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"
                        }`}>
                          {isAvailableTarget ? (
                            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
                              <span>ย้ายมาที่นี่</span>
                            </div>
                          ) : (
                            <span>{selectedSlot ? "+" : ""}</span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Bottom Dock when a slot is selected for swapping/moving */}
      {selectedSlot && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-2xl px-4 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 tracking-wider">โหมดสลับ/ย้ายคาบเรียน</span>
                  <span className="text-[10px] bg-blue-500/30 px-2 py-0.5 rounded-full text-blue-200 font-medium">
                    {days.find(d => d.day === selectedSlot.day)?.name} • คาบ {selectedSlot.period}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate text-slate-100 mt-0.5">
                  {selectedSlot.item?.subjectCode}: {selectedSlot.item?.subjectNameTh}
                </p>
                <p className="text-xs text-slate-300 hidden sm:block">
                  👉 คลิกช่องว่างเพื่อย้าย หรือคลิกวิชาอื่นเพื่อสลับตำแหน่ง (ระบบตรวจจับชนให้อัตโนมัติ)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => { setSelectedSlot(null); setSwapAlert(null); }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                ยกเลิก (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Detail Modal */}
      {selectedDetailItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setSelectedDetailItem(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-mono mb-2">
                  <BookOpen className="w-3 h-3" />
                  {selectedDetailItem.subjectCode}
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedDetailItem.subjectNameTh}
                </h3>
                {detailSubject?.nameEn && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    {detailSubject.nameEn}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Subject Formula Stats (ท-ป-น-ช) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-medium">หน่วยกิต (น.)</div>
                  <div className="text-lg font-bold text-blue-950 mt-0.5">
                    {detailSubject?.credits ?? "-"}
                  </div>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                  <div className="text-[10px] text-indigo-600 font-medium">ทฤษฎี (ท.)</div>
                  <div className="text-lg font-bold text-indigo-950 mt-0.5">
                    {detailSubject?.theoryPeriods ?? "-"}
                  </div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-[10px] text-emerald-600 font-medium">ปฏิบัติ (ป.)</div>
                  <div className="text-lg font-bold text-emerald-950 mt-0.5">
                    {detailSubject?.practicePeriods ?? "-"}
                  </div>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                  <div className="text-[10px] text-purple-600 font-medium">ชม./สัปดาห์ (ช.)</div>
                  <div className="text-lg font-bold text-purple-950 mt-0.5">
                    {detailSubject?.totalPeriodsPerWeek ?? "-"}
                  </div>
                </div>
              </div>

              {/* Time & Consecutive Information */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    วันและเวลาที่สอน:
                  </span>
                  <span className="font-medium text-slate-900">
                    {days.find(d => d.day === selectedDetailItem.dayOfWeek)?.name} • คาบ {selectedDetailItem.periodNumber} ({selectedDetailItem.startTime} - {selectedDetailItem.endTime})
                  </span>
                </div>
                {selectedDetailItem.isConsecutive && (
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>การจัดคาบต่อเนื่อง:</span>
                    <span className="font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                      คาบที่ {selectedDetailItem.consecutiveIndex} จากทั้งหมด {selectedDetailItem.totalConsecutive} คาบต่อเนื่อง
                    </span>
                  </div>
                )}
              </div>

              {/* Teacher Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  ครูผู้สอน
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800">
                    {selectedDetailItem.teacherName}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    รหัส {detailTeacher?.teacherCode || selectedDetailItem.teacherId}
                  </div>
                </div>
                {detailTeacher?.specialDuty && (
                  <p className="text-slate-600">
                    ตำแหน่ง: <span className="font-medium text-slate-800">{detailTeacher.specialDuty}</span>
                  </p>
                )}
                {detailTeacher?.education && (
                  <p className="text-slate-500 text-[11px]">
                    วุฒิการศึกษา: {detailTeacher.education}
                  </p>
                )}
              </div>

              {/* Student Group Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  กลุ่มผู้เรียน
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800">
                    {selectedDetailItem.studentGroupCode}
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                    {detailGroup?.studentCount ?? "-"} คน
                  </div>
                </div>
                {detailGroup?.groupName && (
                  <p className="text-slate-600">
                    ชื่อกลุ่ม: {detailGroup.groupName} ({detailGroup.gradeLevel})
                  </p>
                )}
              </div>

              {/* Classroom Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                  ห้องเรียน / ห้องปฏิบัติการ
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800">
                    {selectedDetailItem.roomCode} {detailRoom?.roomName ? `• ${detailRoom.roomName}` : ""}
                  </div>
                  <div className="font-mono text-slate-500 text-[11px]">
                    {detailRoom?.capacity ? `ความจุ ${detailRoom.capacity} ที่นั่ง` : ""}
                  </div>
                </div>
                {detailRoom?.building && (
                  <p className="text-slate-500">
                    อาคาร/สถานที่: {detailRoom.building} ({detailRoom.roomType})
                  </p>
                )}
                {detailRoom?.equipments && detailRoom.equipments.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {detailRoom.equipments.map(eq => (
                      <span key={eq} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                        {eq}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <Link
                href={`/print/${selectedDetailItem.teacherId}`}
                target="_blank"
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                แบบฟอร์ม สอศ. (A4)
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlot({
                        day: selectedDetailItem.dayOfWeek,
                        period: selectedDetailItem.periodNumber,
                        item: selectedDetailItem
                      });
                      setSelectedDetailItem(null);
                      setSwapAlert({
                        type: "success",
                        message: `เลือกวิชา "${selectedDetailItem.subjectCode}" แล้ว คลิกเลือกช่องปลายทางที่ต้องการสลับ/ย้าย`
                      });
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    สลับ/ย้ายคาบนี้
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
