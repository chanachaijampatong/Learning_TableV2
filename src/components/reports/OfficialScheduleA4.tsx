"use client";

import React from "react";
import { ScheduleItem, Teacher, Subject } from "@/lib/engine/types";
import { STANDARD_PERIODS, BREAK_PERIOD } from "@/lib/engine/constraints";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OfficialScheduleA4Props {
  teacher: Teacher;
  termName?: string;
  scheduleItems: ScheduleItem[];
  allSubjects: Subject[];
}

export const OfficialScheduleA4: React.FC<OfficialScheduleA4Props> = ({
  teacher,
  termName = "ภาคเรียนที่ 2 ปีการศึกษา 2569",
  scheduleItems,
  allSubjects
}) => {
  // Filter items taught by this teacher
  const teacherItems = scheduleItems.filter(item => item.teacherId === teacher.id);

  // Group items by subjectCode to calculate summary table on top right
  const subjectSummaryMap = new Map<string, { subject: Subject | undefined; hours: number }>();
  for (const item of teacherItems) {
    if (!subjectSummaryMap.has(item.subjectCode)) {
      const subj = allSubjects.find(s => s.subjectCode === item.subjectCode);
      subjectSummaryMap.set(item.subjectCode, { subject: subj, hours: 0 });
    }
    subjectSummaryMap.get(item.subjectCode)!.hours += 1;
  }

  const summaryList = Array.from(subjectSummaryMap.entries()).map(([code, val]) => ({
    code,
    name: val.subject?.nameTh || code,
    theory: val.subject?.theoryPeriods ?? "-",
    practice: val.subject?.practicePeriods ?? "-",
    credit: val.subject?.credits ?? "-",
    hours: val.hours
  }));

  const totalTheory = summaryList.reduce((sum, item) => sum + (typeof item.theory === "number" ? item.theory : 0), 0);
  const totalPractice = summaryList.reduce((sum, item) => sum + (typeof item.practice === "number" ? item.practice : 0), 0);
  const totalCredits = summaryList.reduce((sum, item) => sum + (typeof item.credit === "number" ? item.credit : 0), 0);
  const totalHours = summaryList.reduce((sum, item) => sum + item.hours, 0);

  const days = [
    { day: 1, name: "วันจันทร์" },
    { day: 2, name: "วันอังคาร" },
    { day: 3, name: "วันพุธ" },
    { day: 4, name: "วันพฤหัสบดี" },
    { day: 5, name: "วันศุกร์" },
    { day: 6, name: "วันเสาร์" },
    { day: 7, name: "วันอาทิตย์" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white text-black font-sans">
      {/* Print Action Toolbar (Hidden during print) */}
      <div className="max-w-[297mm] mx-auto mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/timetables"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
          </Link>
          <div className="text-sm font-semibold text-slate-800">
            แบบฟอร์มทางการ สอศ. A4 แนวนอน: {teacher.fullName}
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> สั่งพิมพ์ / บันทึก PDF (A4 แนวนอน)
        </button>
      </div>

      {/* Official Sheet Container (Exact A4 Landscape: 297mm x 210mm) */}
      <div className="official-a4-sheet bg-white mx-auto shadow-md print:shadow-none p-6 print:p-0 border border-slate-300 print:border-none w-[297mm] h-[210mm] overflow-hidden flex flex-col justify-between box-border">
        {/* Upper Section: Header (Left) and Course Summary Table (Right) */}
        <div>
          <div className="flex justify-between items-start gap-4 mb-2 pb-2 border-b border-black">
            {/* Header Left: Teacher Info & College */}
            <div className="text-xs leading-relaxed space-y-0.5 flex-1">
              <div className="text-base font-bold tracking-tight">
                วิทยาลัยเทคนิคระยอง (สำนักงานคณะกรรมการการอาชีวศึกษา)
              </div>
              <div className="font-semibold text-slate-800">
                ตารางสอนรายบุคคล {termName}
              </div>
              <div className="pt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px]">
                <div>ผู้สอน: <strong>{teacher.fullName}</strong></div>
                <div>วุฒิการศึกษา: <strong>{teacher.education || "ปริญญาตรี"}</strong></div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px]">
                <div>แผนกวิชา: <strong>{teacher.department}</strong></div>
                <div>หน้าที่พิเศษ: <strong>{teacher.specialDuty || "ครูผู้สอน"}</strong></div>
              </div>
            </div>

            {/* Header Right: Subject Summary Table */}
            <div className="w-[420px]">
              <table className="w-full text-[10px] border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black py-0.5 px-1 w-16">รหัสวิชา</th>
                    <th className="border border-black py-0.5 px-1 text-left">ชื่อรายวิชา</th>
                    <th className="border border-black py-0.5 px-1 w-6">ท.</th>
                    <th className="border border-black py-0.5 px-1 w-6">ป.</th>
                    <th className="border border-black py-0.5 px-1 w-6">น.</th>
                    <th className="border border-black py-0.5 px-1 w-6">ช.</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryList.map((row, idx) => (
                    <tr key={idx} className="leading-tight">
                      <td className="border border-black py-0.5 font-mono">{row.code}</td>
                      <td className="border border-black py-0.5 px-1 text-left truncate max-w-[180px]">{row.name}</td>
                      <td className="border border-black py-0.5">{row.theory}</td>
                      <td className="border border-black py-0.5">{row.practice}</td>
                      <td className="border border-black py-0.5">{row.credit}</td>
                      <td className="border border-black py-0.5 font-bold">{row.hours}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-50 font-bold border-t border-black">
                    <td colSpan={2} className="border border-black py-0.5 text-center">รวมทั้งสิ้น</td>
                    <td className="border border-black py-0.5">{totalTheory}</td>
                    <td className="border border-black py-0.5">{totalPractice}</td>
                    <td className="border border-black py-0.5">{totalCredits}</td>
                    <td className="border border-black py-0.5 text-blue-700">{totalHours}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Timetable Weekly Matrix */}
          <div className="w-full">
            <table className="w-full text-center border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-[10px] leading-tight">
                  <th className="border border-black py-1 w-16">วัน / เวลา</th>
                  <th className="border border-black py-1 w-14 bg-slate-200/60 text-[9px]">
                    08:00-08:30
                    <div className="font-normal text-[8px]">หน้าเสาธง</div>
                  </th>
                  {STANDARD_PERIODS.map(p => (
                    <th
                      key={p.period}
                      className={`border border-black py-1 ${
                        p.period === BREAK_PERIOD ? "bg-amber-100/60 w-14" : ""
                      }`}
                    >
                      <div className="font-bold">
                        {p.period === BREAK_PERIOD ? "พักกลางวัน" : `คาบ ${p.period < BREAK_PERIOD ? p.period : p.period - 1}`}
                      </div>
                      <div className="text-[8px] font-normal text-slate-600">
                        {p.startTime}-{p.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((d, dIdx) => (
                  <tr key={d.day} className="h-10">
                    {/* Day Name */}
                    <td className="border border-black font-semibold text-[10px] bg-slate-50 py-1">
                      {d.name}
                    </td>

                    {/* Flag ceremony locked slot */}
                    {dIdx === 0 && (
                      <td
                        rowSpan={days.length}
                        className="border border-black bg-slate-100 text-slate-500 text-[9px] font-medium p-1 select-none"
                      >
                        <div className="[writing-mode:vertical-lr] tracking-widest uppercase font-semibold mx-auto">
                          กิจกรรมหน้าเสาธง
                        </div>
                      </td>
                    )}

                    {/* Periods 1 to 10 */}
                    {STANDARD_PERIODS.map(p => {
                      if (p.period === BREAK_PERIOD) {
                        if (dIdx === 0) {
                          return (
                            <td
                              key={p.period}
                              rowSpan={days.length}
                              className="border border-black bg-amber-50 text-amber-900 text-[9px] select-none"
                            >
                              <div className="[writing-mode:vertical-lr] tracking-widest font-semibold mx-auto">
                                พักกลางวัน
                              </div>
                            </td>
                          );
                        }
                        return null;
                      }

                      const item = teacherItems.find(
                        it => it.dayOfWeek === d.day && it.periodNumber === p.period
                      );

                      return (
                        <td
                          key={p.period}
                          className="border border-black p-0.5 align-middle text-[9px] leading-tight"
                        >
                          {item ? (
                            <div className="flex flex-col justify-center h-full">
                              <span className="font-bold text-[10px]">{item.subjectCode}</span>
                              <span className="truncate max-w-[80px] mx-auto text-[8px] text-slate-700">
                                {item.studentGroupCode}
                              </span>
                              <span className="text-[8px] font-mono text-blue-700">
                                {item.roomCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower Section: 4-Party Signatures */}
        <div className="pt-2 border-t border-black text-center text-[10px] leading-relaxed">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <div className="mb-4">ลงชื่อ......................................................</div>
              <div className="font-semibold">(นางสาวทัศนีย์ โชติภักดี)</div>
              <div className="text-slate-600 text-[9px]">หัวหน้าแผนกวิชา</div>
            </div>
            <div>
              <div className="mb-4">ลงชื่อ......................................................</div>
              <div className="font-semibold">(นางสาวญาธิดา แสงรัตน์)</div>
              <div className="text-slate-600 text-[9px]">หัวหน้างานพัฒนาหลักสูตรฯ</div>
            </div>
            <div>
              <div className="mb-4">ลงชื่อ......................................................</div>
              <div className="font-semibold">(นางรักชนก โคตรพันธ์)</div>
              <div className="text-slate-600 text-[9px]">รองผู้อำนวยการฝ่ายวิชาการ</div>
            </div>
            <div>
              <div className="mb-4">ลงชื่อ......................................................</div>
              <div className="font-semibold">(นายกิตติพงค์ อุตตมะเวทิน)</div>
              <div className="text-slate-600 text-[9px]">ผู้อำนวยการสถานศึกษา</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Print CSS for exact A4 landscape */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 4mm 6mm;
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .official-a4-sheet {
            width: 287mm !important;
            height: 200mm !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};
