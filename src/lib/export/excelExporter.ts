import ExcelJS from "exceljs";
import { ScheduleItem, Teacher, Subject } from "../engine/types";
import { STANDARD_PERIODS, BREAK_PERIOD } from "../engine/constraints";

export class TimetableExcelExporter {
  public static async exportTeacherSchedule(
    teacher: Teacher,
    scheduleItems: ScheduleItem[],
    subjects: Subject[],
    termName: string = "ภาคเรียนที่ 2 ปีการศึกษา 2569"
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Learning-Time AI System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("ตารางสอนรายบุคคล", {
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
      views: [{ showGridLines: true }]
    });

    // 1. Header Information
    sheet.mergeCells("A1:K1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `วิทยาลัยเทคนิคระยอง - ตารางสอนรายบุคคล ${termName}`;
    titleCell.font = { name: "TH Sarabun New", size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:K2");
    const subTitle = sheet.getCell("A2");
    subTitle.value = `ผู้สอน: ${teacher.fullName}  |  วุฒิการศึกษา: ${teacher.education || "ปริญญาตรี"}  |  แผนกวิชา: ${teacher.department}`;
    subTitle.font = { name: "TH Sarabun New", size: 12, bold: true };
    subTitle.alignment = { horizontal: "center", vertical: "middle" };

    // 2. Table Headers
    const headerRow = sheet.getRow(4);
    headerRow.values = [
      "วัน/เวลา",
      "08:00-08:30 (เสาธง)",
      ...STANDARD_PERIODS.map(p => p.period === BREAK_PERIOD ? "พักกลางวัน (12:30-13:30)" : `คาบ ${p.period} (${p.startTime}-${p.endTime})`)
    ];
    headerRow.font = { name: "TH Sarabun New", size: 11, bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    headerRow.height = 28;

    for (let c = 1; c <= 12; c++) {
      const cell = headerRow.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    }

    // 3. Days Data Rows
    const days = [
      { day: 1, name: "วันจันทร์" },
      { day: 2, name: "วันอังคาร" },
      { day: 3, name: "วันพุธ" },
      { day: 4, name: "วันพฤหัสบดี" },
      { day: 5, name: "วันศุกร์" }
    ];

    const teacherItems = scheduleItems.filter(item => item.teacherId === teacher.id);

    let currentRow = 5;
    days.forEach(d => {
      const row = sheet.getRow(currentRow);
      row.height = 36;
      row.getCell(1).value = d.name;
      row.getCell(1).font = { name: "TH Sarabun New", size: 12, bold: true };
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

      // Flag ceremony
      row.getCell(2).value = "กิจกรรมหน้าเสาธง";
      row.getCell(2).font = { name: "TH Sarabun New", size: 9, color: { argb: "FF64748B" } };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

      // Periods
      STANDARD_PERIODS.forEach((p, pIdx) => {
        const colIdx = 3 + pIdx;
        const cell = row.getCell(colIdx);
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

        if (p.period === BREAK_PERIOD) {
          cell.value = "พักกลางวัน";
          cell.font = { name: "TH Sarabun New", size: 10, bold: true, color: { argb: "FF92400E" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          return;
        }

        const item = teacherItems.find(it => it.dayOfWeek === d.day && it.periodNumber === p.period);
        if (item) {
          cell.value = `${item.subjectCode}\n${item.studentGroupCode}\n${item.roomCode}`;
          cell.font = { name: "TH Sarabun New", size: 10, bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
        } else {
          cell.value = "-";
          cell.font = { name: "TH Sarabun New", size: 10, color: { argb: "FF94A3B8" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });

      currentRow++;
    });

    // 4. Set Column Widths
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 16;
    for (let c = 3; c <= 12; c++) {
      sheet.getColumn(c).width = 15;
    }

    // 5. Signatures at Bottom
    const sigStart = currentRow + 2;
    sheet.getCell(`B${sigStart}`).value = "ลงชื่อ......................................................\n(นางสาวทัศนีย์ โชติภักดี)\nหัวหน้าแผนกวิชา";
    sheet.getCell(`E${sigStart}`).value = "ลงชื่อ......................................................\n(นางสาวญาธิดา แสงรัตน์)\nหัวหน้างานพัฒนาหลักสูตรฯ";
    sheet.getCell(`H${sigStart}`).value = "ลงชื่อ......................................................\n(นางรักชนก โคตรพันธ์)\nรองผู้อำนวยการฝ่ายวิชาการ";
    sheet.getCell(`K${sigStart}`).value = "ลงชื่อ......................................................\n(นายกิตติพงค์ อุตตมะเวทิน)\nผู้อำนวยการสถานศึกษา";

    [`B${sigStart}`, `E${sigStart}`, `H${sigStart}`, `K${sigStart}`].forEach(cellRef => {
      const cell = sheet.getCell(cellRef);
      cell.font = { name: "TH Sarabun New", size: 11 };
      cell.alignment = { horizontal: "center", vertical: "top", wrapText: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
}
