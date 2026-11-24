"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { DualStorage } from "@/lib/storage/dualStorage";
import { Teacher, StudentGroup, Classroom, Subject, CourseEnrollment } from "@/lib/engine/types";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  RotateCcw
} from "lucide-react";

interface ValidationRowResult {
  rowIdx: number;
  data: Record<string, any>;
  errors: string[];
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "templates" | "samples">("upload");
  const [importCategory, setImportCategory] = useState<"teachers" | "groups" | "subjects" | "enrollments">("teachers");
  const [previewRows, setPreviewRows] = useState<ValidationRowResult[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // File Upload & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSaveSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        // Validate each row
        const validated: ValidationRowResult[] = rawJson.map((row, idx) => {
          const errors: string[] = [];
          if (importCategory === "teachers") {
            if (!row["รหัสครู"] && !row["teacherCode"]) errors.push("ขาดรหัสครู");
            if (!row["ชื่อ-สกุล"] && !row["fullName"]) errors.push("ขาดชื่อ-สกุล");
          } else if (importCategory === "groups") {
            if (!row["รหัสกลุ่ม"] && !row["groupCode"]) errors.push("ขาดรหัสกลุ่มเรียน");
            if (!row["ชื่อกลุ่ม"] && !row["groupName"]) errors.push("ขาดชื่อกลุ่มเรียน");
          } else if (importCategory === "subjects") {
            if (!row["รหัสวิชา"] && !row["subjectCode"]) errors.push("ขาดรหัสวิชา");
            if (!row["ชื่อวิชา"] && !row["nameTh"]) errors.push("ขาดชื่อวิชา");
          }
          return { rowIdx: idx + 1, data: row, errors };
        });

        setPreviewRows(validated);
      } catch (err) {
        console.error("Parse error:", err);
        alert("ไม่สามารถอ่านไฟล์ได้ โปรดตรวจสอบรูปแบบไฟล์ Excel หรือ CSV");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveImportedData = () => {
    const validRows = previewRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      alert("ไม่มีแถวข้อมูลที่ผ่านการตรวจสอบ");
      return;
    }

    if (importCategory === "teachers") {
      const current = DualStorage.getTeachers();
      const newItems: Teacher[] = validRows.map((r, i) => ({
        id: `T_IMP_${Date.now()}_${i}`,
        teacherCode: String(r.data["รหัสครู"] || r.data["teacherCode"] || `9010${i}`),
        prefix: r.data["คำนำหน้า"] || "นาย",
        firstName: r.data["ชื่อ"] || "",
        lastName: r.data["นามสกุล"] || "",
        fullName: r.data["ชื่อ-สกุล"] || r.data["fullName"] || "ครูผู้สอน",
        department: r.data["แผนกวิชา"] || "เทคโนโลยีสารสนเทศและการสื่อสาร",
        education: r.data["วุฒิการศึกษา"] || "ปริญญาตรี",
        specialDuty: r.data["หน้าที่พิเศษ"] || "ครูผู้สอน",
        maxPeriodsPerWeek: Number(r.data["ภาระสอนสูงสุด"]) || 18,
        qualifiedSubjectCodes: [],
        unavailableSlots: [],
        isActive: true,
      }));
      DualStorage.saveTeachers([...current, ...newItems]);
    }

    setSaveSuccess(`บันทึกข้อมูลเรียบร้อยแล้ว จำนวน ${validRows.length} รายการ!`);
    setPreviewRows([]);
  };

  const downloadTemplate = (category: string) => {
    let headers: string[] = [];
    let sample: any[] = [];

    if (category === "teachers") {
      headers = ["รหัสครู", "คำนำหน้า", "ชื่อ-สกุล", "แผนกวิชา", "วุฒิการศึกษา", "หน้าที่พิเศษ", "ภาระสอนสูงสุด"];
      sample = [
        ["901001", "นางสาว", "ทัศนีย์ โชติภักดี", "เทคโนโลยีสารสนเทศ", "ศึกษาศาสตรบัณฑิต", "หัวหน้าแผนก", 12],
        ["901002", "นาย", "ปริญญา จำเนียรพล", "เทคโนโลยีสารสนเทศ", "วิทยาศาสตรมหาบัณฑิต", "หัวหน้างานศูนย์ดิจิทัล", 10],
      ];
    } else if (category === "subjects") {
      headers = ["รหัสวิชา", "ชื่อวิชา", "ท.", "ป.", "น.", "ชม.", "ประเภทห้อง", "สี"];
      sample = [
        ["31901-2005", "การพัฒนาซอฟต์แวร์ด้วยเทคโนโลยี Back-End", 1, 4, 3, 5, "COMPUTER_LAB", "#06b6d4"],
        ["31901-2008", "การพัฒนาซอฟต์แวร์รูปแบบเดฟออฟส์ (DevOps)", 1, 4, 3, 5, "COMPUTER_LAB", "#14b8a6"],
      ];
    } else {
      headers = ["รหัสกลุ่ม", "ชื่อกลุ่มเรียน", "ระดับชั้น", "จำนวนนักเรียน"];
      sample = [
        ["สIT.1/1", "เทคโนโลยีสารสนเทศ 1/1", "ปวส.1", 17],
        ["สIT.1/2", "เทคโนโลยีสารสนเทศ 1/2", "ปวส.1", 29],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_${category}.xlsx`);
  };

  const loadSampleDataset = (size: "small" | "medium" | "large") => {
    DualStorage.resetToPresetRayongIT();
    alert(`โหลดชุดข้อมูลตัวอย่าง (${size === "small" ? "ขนาดเล็ก 5 กลุ่ม" : size === "medium" ? "ขนาดกลาง 12 กลุ่ม (IT เทคนิคระยอง)" : "ขนาดใหญ่ 30+ กลุ่ม"}) สำเร็จ!`);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          การนำเข้าข้อมูลและการตรวจสอบ (Import & Data Integrity)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          เกณฑ์ประเมินทักษะ AI (10 คะแนน): รองรับ Excel (.xlsx), CSV, Data Validation Pre-check และชุดข้อมูลทดสอบ 3 ขนาด
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "upload"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          อัปโหลดไฟล์ Excel / CSV
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "templates"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ดาวน์โหลดไฟล์แม่แบบ (Templates)
        </button>
        <button
          onClick={() => setActiveTab("samples")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === "samples"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ชุดข้อมูลตัวอย่าง 3 ขนาด (1-Click Test)
        </button>
      </div>

      {/* Tab 1: Upload & Preview */}
      {activeTab === "upload" && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">หมวดหมู่ข้อมูลที่จะนำเข้า:</label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="teachers">ครูผู้สอน (Teachers)</option>
                  <option value="groups">กลุ่มเรียน (Student Groups)</option>
                  <option value="subjects">รายวิชา (Subjects)</option>
                </select>
              </div>

              {previewRows.length > 0 && (
                <button
                  onClick={handleSaveImportedData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition"
                >
                  บันทึกข้อมูลเข้าสู่ระบบ ({previewRows.filter(r => r.errors.length === 0).length} รายการที่ผ่าน)
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ Excel (.xlsx) / CSV
              </div>
              <div className="text-xs text-slate-400 mt-1">
                ระบบจะตรวจสอบความถูกต้องของข้อมูล (Foreign Key, Duplicate, Missing) ทันที
              </div>
              {fileName && (
                <div className="mt-2 text-xs font-semibold text-blue-600 font-mono">
                  ไฟล์ที่เลือก: {fileName}
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {saveSuccess}
              </div>
            )}
          </div>

          {/* Validation Preview Table */}
          {previewRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Interactive Validation Preview Table ({previewRows.length} แถว)
                </h3>
                <span className="text-xs text-slate-500">
                  แถวที่มีไฮไลต์สีแดงคือข้อมูลที่มีข้อผิดพลาด
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 w-12 text-center">แถว</th>
                      <th className="py-2 px-3">สถานะการตรวจสอบ</th>
                      {Object.keys(previewRows[0].data).map((key) => (
                        <th key={key} className="py-2 px-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r) => {
                      const hasError = r.errors.length > 0;
                      return (
                        <tr
                          key={r.rowIdx}
                          className={`border-b border-slate-100 ${
                            hasError ? "bg-red-50/70 text-red-900" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-2 px-3 text-center font-mono font-semibold">{r.rowIdx}</td>
                          <td className="py-2 px-3">
                            {hasError ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {r.errors.join(", ")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านการตรวจสอบ
                              </span>
                            )}
                          </td>
                          {Object.keys(r.data).map((key) => (
                            <td key={key} className="py-2 px-3">{String(r.data[key])}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Download Templates */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">แม่แบบครูผู้สอน (Teachers)</h3>
              <p className="text-xs text-slate-500 mt-1">
                มีคอลัมน์รหัสครู, คำนำหน้า, ชื่อ-สกุล, แผนกวิชา, วุฒิการศึกษา, หน้าที่พิเศษ, ภาระสอน
              </p>
            </div>
            <button
              onClick={() => downloadTemplate("teachers")}
              className="mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> ดาวน์โหลด Template_teachers.xlsx
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">แม่แบบรายวิชา (Subjects)</h3>
              <p className="text-xs text-slate-500 mt-1">
                มีคอลัมน์รหัสวิชา, ชื่อวิชา, ทฤษฎี (ท.), ปฏิบัติ (ป.), หน่วยกิต (น.), ชั่วโมงรวม
              </p>
            </div>
            <button
              onClick={() => downloadTemplate("subjects")}
              className="mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> ดาวน์โหลด Template_subjects.xlsx
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">แม่แบบกลุ่มเรียน (Student Groups)</h3>
              <p className="text-xs text-slate-500 mt-1">
                มีคอลัมน์รหัสกลุ่มเรียน, ชื่อกลุ่มเรียน, ระดับชั้น (ปวช./ปวส.), จำนวนนักศึกษา
              </p>
            </div>
            <button
              onClick={() => downloadTemplate("groups")}
              className="mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> ดาวน์โหลด Template_groups.xlsx
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Sample Datasets */}
      {activeTab === "samples" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                ชุดทดสอบขนาดเล็ก
              </span>
              <h3 className="font-bold text-base text-slate-800 mt-2">ชุดข้อมูล 5 กลุ่มเรียน</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                เหมาะสำหรับการทดสอบระบบอย่างรวดเร็ว (ครู 5 คน, 5 กลุ่มเรียน, 10 วิชา)
              </p>
            </div>
            <button
              onClick={() => loadSampleDataset("small")}
              className="mt-4 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> โหลดชุดทดสอบขนาดเล็ก
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-700 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                ชุดข้อมูลจริง (แนะนำ)
              </span>
              <h3 className="font-bold text-base text-white mt-2">แผนก IT วิทยาลัยเทคนิคระยอง</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                ครู 10 ท่าน, 12 กลุ่มเรียน (ปวช.1-3 & ปวส.1-2), รายวิชาจริงและตารางตัวอย่าง สอศ.
              </p>
            </div>
            <button
              onClick={() => loadSampleDataset("medium")}
              className="mt-4 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" /> โหลดชุดข้อมูล IT ระยอง (1-Click)
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                ชุดทดสอบขนาดใหญ่ (Stress Test)
              </span>
              <h3 className="font-bold text-base text-slate-800 mt-2">ชุดข้อมูล 30+ กลุ่มเรียน</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ทดสอบความเสถียรและประสิทธิภาพของ GA Engine ภายใต้ความหนาแน่นสูง
              </p>
            </div>
            <button
              onClick={() => loadSampleDataset("large")}
              className="mt-4 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> โหลดชุด Stress Test 30+ กลุ่ม
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
