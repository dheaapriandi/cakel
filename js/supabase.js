// Supabase & LocalStorage Data Engine with Smart Merge & Valid UUIDs
const STORAGE_KEYS = {
  CLASSES: 'absensi_classes_data',
  STUDENTS: 'absensi_students_data',
  ATTENDANCE: 'absensi_attendance_data',
  GRADES: 'absensi_grades_data',
  NOTES: 'absensi_notes_data',
  CONFIG: 'absensi_supabase_config'
};

let supabaseClient = null;

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initSupabase() {
  const config = getSupabaseConfig();
  if (config.url && config.key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.key);
      console.log("Supabase Client initialized successfully.");
      return true;
    } catch (e) {
      console.error("Supabase Init Error:", e);
      return false;
    }
  }
  return false;
}

function getSupabaseConfig() {
  const cfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return cfg ? JSON.parse(cfg) : { 
    url: 'https://ooxiicfixtvucfshesal.supabase.co', 
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veGlpY2ZpeHR2dWNmc2hlc2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MDEyMjgsImV4cCI6MjEwMDE3NzIyOH0.DGTWrRay9k7q2U6o8Mz2W6j8t8dEe2e9q0kv3yXa3aI' 
  };
}

function saveSupabaseConfig(url, key) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ url, key }));
  return initSupabase();
}

// Initial Seed Data with valid UUIDs and auto-sync to cloud
function loadInitialSeedData() {
  const defaultClass = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Kelas X DKV' };
  const defaultStudent = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5', class_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Ahmad Rizky', nis: '1001' };

  let classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES));
  if (!classes || classes.length === 0) {
    classes = [defaultClass];
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    if (window.DataStore && window.DataStore.syncToCloud) {
      window.DataStore.syncToCloud('classes', defaultClass);
    }
  }

  let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS));
  if (!students || students.length === 0) {
    students = [defaultStudent];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (window.DataStore && window.DataStore.syncToCloud) {
      window.DataStore.syncToCloud('students', defaultStudent);
    }
  }

  let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE));
  if (!attendance) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }

  let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES));
  if (!grades) {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify([]));
  }
}

// Data Access API with Smart Merging
const DataStore = {
  getClasses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES)) || [];
  },
  addClass(name) {
    const classes = this.getClasses();
    const newClass = { id: generateUUID(), name };
    classes.push(newClass);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.syncToCloud('classes', newClass);
    return newClass;
  },
  removeClass(id) {
    let classes = this.getClasses();
    classes = classes.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

    let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    students = students.filter(s => s.class_id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    attendance = attendance.filter(a => a.class_id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));

    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    grades = grades.filter(g => g.class_id !== id);
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    this.deleteFromCloud('classes', id);
  },
  getStudents(classId) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    const filtered = classId ? students.filter(s => s.class_id === classId) : students;
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
  },
  addStudent(classId, name, nis) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    const newStudent = { id: generateUUID(), class_id: classId, name, nis: nis || '' };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.syncToCloud('students', newStudent);
    return newStudent;
  },
  addStudentsBatch(classId, studentsArray) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    const newStudents = [];

    studentsArray.forEach(item => {
      const newStudent = { id: generateUUID(), class_id: classId, name: item.name, nis: item.nis || '' };
      students.push(newStudent);
      newStudents.push(newStudent);
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.syncToCloud('students', newStudents);
    return newStudents;
  },
  removeStudent(id) {
    let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    students = students.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    this.deleteFromCloud('students', id);
  },
  removeAttendanceByDate(classId, date) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    records = records.filter(r => !(r.class_id === classId && r.date === date));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));

    if (supabaseClient) {
      supabaseClient.from('attendance').delete().eq('class_id', classId).eq('date', date)
        .then(({ error }) => { if (error) console.error('Cloud Delete Attendance Error:', error); });
    }
  },
  getAttendance(classId, date, semester) {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    return records.filter(r => {
      const matchClass = !classId || r.class_id === classId;
      const matchDate = !date || r.date === date;
      const matchSem = !semester || !r.semester || String(r.semester) === String(semester);
      return matchClass && matchDate && matchSem;
    });
  },
  saveAttendanceRecord(classId, date, time, studentStatuses, semester) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    records = records.filter(r => !(r.class_id === classId && r.date === date));

    const sem = semester || (window.getCurrentSemester ? window.getCurrentSemester() : '1');

    studentStatuses.forEach(item => {
      const newRec = {
        id: generateUUID(),
        class_id: classId,
        date: date,
        time: time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        student_id: item.student_id,
        status: item.status,
        semester: sem
      };
      records.push(newRec);
      this.syncToCloud('attendance', newRec);
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },
  getGrades(classId, semester) {
    const grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    return grades.filter(g => {
      const matchClass = !classId || g.class_id === classId;
      const matchSem = !semester || !g.semester || String(g.semester) === String(semester);
      return matchClass && matchSem;
    });
  },
  saveGradeRecord(classId, date, category, studentScores, semester) {
    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category));
    
    const sem = semester || (window.getCurrentSemester ? window.getCurrentSemester() : '1');

    studentScores.forEach(item => {
      const newGrade = {
        id: generateUUID(),
        class_id: classId,
        date: date,
        category: category,
        title: category,
        student_id: item.student_id,
        score: parseFloat(item.score) || 0,
        semester: sem
      };
      grades.push(newGrade);
      this.syncToCloud('grades', newGrade);
    });

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },
  removeGradeRecord(classId, date, category) {
    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    if (supabaseClient) {
      supabaseClient.from('grades').delete()
        .eq('class_id', classId)
        .eq('date', date)
        .eq('category', category)
        .then(({ error }) => { if (error) console.error('Cloud Delete Grade Error:', error); });
    }
  },
  getNotes(classId) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
    return classId ? notes.filter(n => n.class_id === classId) : notes;
  },
  saveNoteItem(classId, noteData) {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
    let noteItem = null;

    if (noteData.id) {
      notes = notes.map(n => {
        if (n.id === noteData.id) {
          noteItem = { ...n, ...noteData, class_id: classId };
          return noteItem;
        }
        return n;
      });
    }

    if (!noteItem) {
      noteItem = {
        id: noteData.id || generateUUID(),
        class_id: classId,
        title: noteData.title || 'Catatan Baru',
        tag: noteData.tag || 'Tugas',
        content: noteData.content || '',
        date: noteData.date || new Date().toISOString().split('T')[0]
      };
      notes.push(noteItem);
    }

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.syncToCloud('notes', noteItem);
    return noteItem;
  },
  deleteNoteItem(noteId) {
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    this.deleteFromCloud('notes', noteId);
  },
  async syncToCloud(tableName, payload) {
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from(tableName).upsert([payload]);
        if (error) console.error(`Cloud Sync Error (${tableName}):`, error);
      } catch (err) {
        console.error("Cloud Sync Exception:", err);
      }
    }
  },
  async deleteFromCloud(tableName, id) {
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
        if (error) console.error(`Cloud Delete Error (${tableName}):`, error);
      } catch (err) {
        console.error("Cloud Delete Exception:", err);
      }
    }
  },
  async fetchFromCloud() {
    if (!supabaseClient) return false;
    try {
      // Smart Merge Classes (Combine Local + Cloud)
      const { data: cloudClasses, error: errCls } = await supabaseClient.from('classes').select('*');
      if (!errCls && cloudClasses) {
        const localClasses = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES)) || [];
        const classMap = new Map();
        localClasses.forEach(c => classMap.set(c.id, c));
        cloudClasses.forEach(c => classMap.set(c.id, c));

        const mergedClasses = Array.from(classMap.values());
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mergedClasses));

        // Push any local classes missing in cloud
        localClasses.forEach(lc => {
          if (!cloudClasses.some(cc => cc.id === lc.id)) {
            this.syncToCloud('classes', lc);
          }
        });
      }

      // Smart Merge Students
      const { data: cloudStudents, error: errStd } = await supabaseClient.from('students').select('*');
      if (!errStd && cloudStudents) {
        const localStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
        const stdMap = new Map();
        localStudents.forEach(s => stdMap.set(s.id, s));
        cloudStudents.forEach(s => stdMap.set(s.id, s));

        const mergedStudents = Array.from(stdMap.values());
        mergedStudents.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));

        localStudents.forEach(ls => {
          if (!cloudStudents.some(cs => cs.id === ls.id)) {
            this.syncToCloud('students', ls);
          }
        });
      }

      // Smart Merge Attendance
      const { data: cloudAtt, error: errAtt } = await supabaseClient.from('attendance').select('*');
      if (!errAtt && cloudAtt) {
        const localAtt = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
        const attMap = new Map();
        localAtt.forEach(a => attMap.set(a.id, a));
        cloudAtt.forEach(a => attMap.set(a.id, a));

        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(Array.from(attMap.values())));
      }

      // Smart Merge Grades
      const { data: cloudGrades, error: errGrd } = await supabaseClient.from('grades').select('*');
      if (!errGrd && cloudGrades) {
        const localGrades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
        const grdMap = new Map();
        localGrades.forEach(g => grdMap.set(g.id, g));
        cloudGrades.forEach(g => grdMap.set(g.id, g));

        localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(Array.from(grdMap.values())));
      }

      return true;
    } catch (err) {
      console.error('Cloud Sync Pull Error:', err);
      return false;
    }
  },
  async syncAllToCloudBatch() {
    if (!supabaseClient) return false;
    try {
      const classes = this.getClasses();
      const students = this.getStudents();
      const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
      const grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];

      if (classes.length > 0) await supabaseClient.from('classes').upsert(classes);
      if (students.length > 0) await supabaseClient.from('students').upsert(students);
      if (attendance.length > 0) await supabaseClient.from('attendance').upsert(attendance);
      if (grades.length > 0) await supabaseClient.from('grades').upsert(grades);

      return true;
    } catch (err) {
      console.error('Batch Sync Error:', err);
      return false;
    }
  }
};

window.DataStore = DataStore;
window.getSupabaseConfig = getSupabaseConfig;
window.saveSupabaseConfig = saveSupabaseConfig;
window.initSupabase = initSupabase;
window.loadInitialSeedData = loadInitialSeedData;
window.generateUUID = generateUUID;
