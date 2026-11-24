import { 
  AcademicTerm, 
  Teacher, 
  StudentGroup, 
  Classroom, 
  Subject, 
  CourseEnrollment, 
  ScheduleItem, 
  SchedulingRunLog 
} from "../engine/types";
import { 
  DEFAULT_TERM, 
  DEFAULT_TEACHERS, 
  DEFAULT_GROUPS, 
  DEFAULT_CLASSROOMS, 
  DEFAULT_SUBJECTS, 
  DEFAULT_ENROLLMENTS, 
  SAMPLE_SCHEDULE_ITEMS 
} from "./mockData";
import { db } from "../firebase/config";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

export interface StorageData {
  terms: AcademicTerm[];
  teachers: Teacher[];
  groups: StudentGroup[];
  classrooms: Classroom[];
  subjects: Subject[];
  enrollments: CourseEnrollment[];
  schedules: ScheduleItem[];
  runLogs: SchedulingRunLog[];
}

const STORAGE_KEYS = {
  TERMS: "learning_time_terms",
  TEACHERS: "learning_time_teachers",
  GROUPS: "learning_time_groups",
  CLASSROOMS: "learning_time_classrooms",
  SUBJECTS: "learning_time_subjects",
  ENROLLMENTS: "learning_time_enrollments",
  SCHEDULES: "learning_time_schedules",
  LOGS: "learning_time_run_logs",
  ACTIVE_TERM_ID: "learning_time_active_term_id"
};

export class DualStorage {
  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  public static isFirebaseMode(): boolean {
    return process.env.NEXT_PUBLIC_STORAGE_MODE === "firebase" && !!db;
  }

  public static async initializeDefaultData(force: boolean = false): Promise<void> {
    if (!this.isBrowser()) return;

    // 1. Initialize Local Storage (for instant rendering and offline guarantee)
    if (force || !localStorage.getItem(STORAGE_KEYS.TERMS)) {
      localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify([DEFAULT_TERM]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TERM_ID, DEFAULT_TERM.id);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.CLASSROOMS)) {
      localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(DEFAULT_CLASSROOMS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.ENROLLMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(DEFAULT_ENROLLMENTS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(SAMPLE_SCHEDULE_ITEMS));
    }

    // 2. If Firebase mode is active, sync with Cloud Firestore in background
    if (this.isFirebaseMode() && db) {
      try {
        const termDoc = await getDoc(doc(db, "academic_terms", DEFAULT_TERM.id));
        if (!termDoc.exists() || force) {
          await this.syncAllToFirestore();
        }
      } catch (err) {
        console.warn("Firestore sync notice (continuing with local cache):", err);
      }
    }
  }

  public static async syncAllToFirestore(): Promise<void> {
    if (!this.isFirebaseMode() || !db) return;
    try {
      // Sync terms
      await setDoc(doc(db, "academic_terms", DEFAULT_TERM.id), DEFAULT_TERM);
      // Sync teachers
      for (const t of this.getTeachers()) {
        await setDoc(doc(db, "teachers", t.id), t);
      }
      // Sync student groups
      for (const g of this.getStudentGroups()) {
        await setDoc(doc(db, "student_groups", g.id), g);
      }
      // Sync classrooms
      for (const r of this.getClassrooms()) {
        await setDoc(doc(db, "classrooms", r.id), r);
      }
      // Sync subjects
      for (const s of this.getSubjects()) {
        await setDoc(doc(db, "subjects", s.id), s);
      }
      // Sync enrollments
      for (const e of this.getCourseEnrollments()) {
        await setDoc(doc(db, "course_enrollments", e.id), e);
      }
      // Sync schedules
      await setDoc(doc(db, "schedules", DEFAULT_TERM.id), {
        termId: DEFAULT_TERM.id,
        items: this.getScheduleItems(),
        updatedAt: new Date().toISOString()
      });
      console.log("Successfully synced dataset to Google Cloud Firestore (learning-tablev2)!");
    } catch (e) {
      console.warn("Firestore cloud sync:", e);
    }
  }

  public static getTerms(): AcademicTerm[] {
    if (!this.isBrowser()) return [DEFAULT_TERM];
    const data = localStorage.getItem(STORAGE_KEYS.TERMS);
    return data ? JSON.parse(data) : [DEFAULT_TERM];
  }

  public static getActiveTerm(): AcademicTerm {
    const terms = this.getTerms();
    if (!this.isBrowser()) return terms[0] || DEFAULT_TERM;
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TERM_ID);
    return terms.find(t => t.id === activeId) || terms[0] || DEFAULT_TERM;
  }

  public static getTeachers(): Teacher[] {
    if (!this.isBrowser()) return DEFAULT_TEACHERS;
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return data ? JSON.parse(data) : DEFAULT_TEACHERS;
  }

  public static saveTeachers(teachers: Teacher[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    if (this.isFirebaseMode() && db) {
      teachers.forEach(t => {
        setDoc(doc(db!, "teachers", t.id), t).catch(e => console.warn(e));
      });
    }
  }

  public static getStudentGroups(): StudentGroup[] {
    if (!this.isBrowser()) return DEFAULT_GROUPS;
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : DEFAULT_GROUPS;
  }

  public static saveStudentGroups(groups: StudentGroup[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    if (this.isFirebaseMode() && db) {
      groups.forEach(g => {
        setDoc(doc(db!, "student_groups", g.id), g).catch(e => console.warn(e));
      });
    }
  }

  public static getClassrooms(): Classroom[] {
    if (!this.isBrowser()) return DEFAULT_CLASSROOMS;
    const data = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    return data ? JSON.parse(data) : DEFAULT_CLASSROOMS;
  }

  public static saveClassrooms(classrooms: Classroom[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(classrooms));
    if (this.isFirebaseMode() && db) {
      classrooms.forEach(c => {
        setDoc(doc(db!, "classrooms", c.id), c).catch(e => console.warn(e));
      });
    }
  }

  public static getSubjects(): Subject[] {
    if (!this.isBrowser()) return DEFAULT_SUBJECTS;
    const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    return data ? JSON.parse(data) : DEFAULT_SUBJECTS;
  }

  public static saveSubjects(subjects: Subject[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    if (this.isFirebaseMode() && db) {
      subjects.forEach(s => {
        setDoc(doc(db!, "subjects", s.id), s).catch(e => console.warn(e));
      });
    }
  }

  public static getCourseEnrollments(termId?: string): CourseEnrollment[] {
    if (!this.isBrowser()) return DEFAULT_ENROLLMENTS;
    const data = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
    const list: CourseEnrollment[] = data ? JSON.parse(data) : DEFAULT_ENROLLMENTS;
    return termId ? list.filter(e => e.termId === termId) : list;
  }

  public static saveCourseEnrollments(enrollments: CourseEnrollment[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
    if (this.isFirebaseMode() && db) {
      enrollments.forEach(e => {
        setDoc(doc(db!, "course_enrollments", e.id), e).catch(err => console.warn(err));
      });
    }
  }

  public static getScheduleItems(termId?: string): ScheduleItem[] {
    if (!this.isBrowser()) return SAMPLE_SCHEDULE_ITEMS;
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    const list: ScheduleItem[] = data ? JSON.parse(data) : SAMPLE_SCHEDULE_ITEMS;
    return termId ? list.filter(s => s.termId === termId) : list;
  }

  public static saveScheduleItems(items: ScheduleItem[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(items));
    if (this.isFirebaseMode() && db) {
      const activeTerm = this.getActiveTerm();
      setDoc(doc(db, "schedules", activeTerm.id), {
        termId: activeTerm.id,
        items,
        updatedAt: new Date().toISOString()
      }).catch(err => console.warn("Firestore schedule save notice:", err));
    }
  }

  public static updateScheduleItem(updated: ScheduleItem): void {
    const items = this.getScheduleItems();
    const index = items.findIndex(i => i.id === updated.id);
    if (index >= 0) {
      items[index] = updated;
      this.saveScheduleItems(items);
    }
  }

  public static getRunLogs(): SchedulingRunLog[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }

  public static saveRunLog(log: SchedulingRunLog): void {
    if (!this.isBrowser()) return;
    const logs = this.getRunLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));

    if (this.isFirebaseMode() && db) {
      setDoc(doc(db, "scheduling_runs", log.id), log).catch(err => console.warn(err));
    }
  }

  public static resetToPresetRayongIT(): void {
    this.initializeDefaultData(true);
  }
}
