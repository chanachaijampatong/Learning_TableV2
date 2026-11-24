"use client";

import React, { use } from "react";
import { DualStorage } from "@/lib/storage/dualStorage";
import { OfficialScheduleA4 } from "@/components/reports/OfficialScheduleA4";

export default function PrintTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const teacherId = resolvedParams.id;

  const teachers = DualStorage.getTeachers();
  const teacher = teachers.find(t => t.id === teacherId) || teachers[1] || teachers[0];
  const schedules = DualStorage.getScheduleItems();
  const subjects = DualStorage.getSubjects();
  const term = DualStorage.getActiveTerm();

  return (
    <OfficialScheduleA4
      teacher={teacher}
      termName={term.name}
      scheduleItems={schedules}
      allSubjects={subjects}
    />
  );
}
