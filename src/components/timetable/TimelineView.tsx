"use client";

import React, { useState } from "react";
import { ScheduleItem, Teacher, Classroom, StudentGroup } from "@/lib/engine/types";
import { STANDARD_PERIODS, BREAK_PERIOD } from "@/lib/engine/constraints";
import { MapPin, User, Users, Clock, Coffee, Flag } from "lucide-react";

interface TimelineViewProps {
  scheduleItems: ScheduleItem[];
  teachers: Teacher[];
  classrooms: Classroom[];
  studentGroups: StudentGroup[];
  viewMode: "group" | "teacher" | "room" | "subject";
  selectedTargetId: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  scheduleItems,
  viewMode,
  selectedTargetId
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const days = [
    { day: 1, name: "วันจันทร์", short: "จ." },
    { day: 2, name: "วันอังคาร", short: "อ." },
    { day: 3, name: "วันพุธ", short: "พ." },
    { day: 4, name: "วันพฤหัสบดี", short: "พฤ." },
    { day: 5, name: "วันศุกร์", short: "ศ." },
  ];

  const filteredItems = scheduleItems.filter(item => {
    if (viewMode === "group") return item.studentGroupId === selectedTargetId;
    if (viewMode === "teacher") return item.teacherId === selectedTargetId;
    if (viewMode === "room") return item.classroomId === selectedTargetId;
    if (viewMode === "subject") return item.subjectId === selectedTargetId;
    return true;
  });

  const dayItems = filteredItems.filter(item => item.dayOfWeek === selectedDay);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Day Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto p-1.5 gap-1">
        {days.map(d => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              selectedDay === d.day
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{d.name}</span>
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="p-4 space-y-3">
        {/* Flag Ceremony */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200">
          <Flag className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 font-medium">08:00 - 08:30: กิจกรรมหน้าเสาธง / โฮมรูม</div>
        </div>

        {STANDARD_PERIODS.map(p => {
          if (p.period === BREAK_PERIOD) {
            return (
              <div
                key={p.period}
                className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 text-amber-900 text-xs border border-amber-200"
              >
                <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1 font-semibold">12:30 - 13:30: พักรับประทานอาหารกลางวัน</div>
              </div>
            );
          }

          const item = dayItems.find(it => it.periodNumber === p.period);

          if (!item) {
            return (
              <div
                key={p.period}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400"
              >
                <div className="w-20 font-mono text-[11px] text-slate-400">
                  {p.startTime} - {p.endTime}
                </div>
                <div className="italic">คาบว่าง (ไม่มีการเรียนการสอน)</div>
              </div>
            );
          }

          return (
            <div
              key={p.period}
              className={`p-3.5 rounded-xl border transition shadow-xs ${
                item.roomType === "COMPUTER_LAB"
                  ? "bg-blue-50/70 border-blue-200 text-blue-950"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-slate-600 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {p.startTime} - {p.endTime} (คาบที่ {p.period < BREAK_PERIOD ? p.period : p.period - 1})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                  {item.roomCode}
                </span>
              </div>

              <div className="font-bold text-sm text-slate-900">
                {item.subjectCode} {item.subjectNameTh}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>ครู: <strong className="text-slate-800">{item.teacherName}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>กลุ่ม: <strong className="text-slate-800">{item.studentGroupCode}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
