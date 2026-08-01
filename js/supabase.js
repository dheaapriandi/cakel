// Supabase & LocalStorage Data Engine with Smart Merge & Valid UUIDs
const STORAGE_KEYS = {
  CLASSES: 'absensi_classes_data',
  STUDENTS: 'absensi_students_data',
  ATTENDANCE: 'absensi_attendance_data',
  GRADES: 'absensi_grades_data',
  NOTES: 'absensi_notes_data',
  SUBJECTS: 'absensi_subjects_data',
  AUTH: 'absensi_auth_credentials',
  CONFIG: 'absensi_supabase_config'
};

function generateDeterministicUUID(seed) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, c; i < seed.length; i++) {
    c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = ((h1 >>> 0).toString(16).padStart(8, '0') + 
               (h2 >>> 0).toString(16).padStart(8, '0') + 
               (h1 ^ h2 >>> 0).toString(16).padStart(16, '0')).slice(0, 32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

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

async function saveSupabaseConfig(url, key) {
  const originalConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ url, key }));

  const initialized = initSupabase();
  if (!initialized) {
    if (originalConfig) localStorage.setItem(STORAGE_KEYS.CONFIG, originalConfig);
    else localStorage.removeItem(STORAGE_KEYS.CONFIG);
    initSupabase();
    return { success: false, error: 'Format URL atau Key tidak valid.' };
  }

  try {
    // Probe database schema connection by reading classes
    const { error } = await supabaseClient.from('classes').select('id').limit(1);
    if (error) throw error;

    // Trigger immediate sync
    if (window.DataStore && window.DataStore.fetchFromCloud) {
      await window.DataStore.fetchFromCloud();
    }
    if (window.DataStore && window.DataStore.syncAllToCloudBatch) {
      await window.DataStore.syncAllToCloudBatch();
    }

    return { success: true };
  } catch (err) {
    // Revert to original configuration if ping failed
    if (originalConfig) localStorage.setItem(STORAGE_KEYS.CONFIG, originalConfig);
    else localStorage.removeItem(STORAGE_KEYS.CONFIG);
    initSupabase();
    return { success: false, error: err.message || 'Koneksi ditolak oleh database Supabase.' };
  }
}

// Initial Seed Data with valid UUIDs and auto-sync to cloud
function loadInitialSeedData() {
  const defaultClass = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Kelas X DKV' };

  let classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES));
  if (!classes || classes.length === 0) {
    classes = [defaultClass];
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    if (window.DataStore && window.DataStore.syncToCloud) {
      window.DataStore.syncToCloud('classes', defaultClass);
    }
  }

  let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS));
  if (!students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  } else {
    // Strip dummy Ahmad Rizky if present
    students = students.filter(s => s.id !== 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' && s.name !== 'Ahmad Rizky');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
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
  getSubjects(classId) {
    const subjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS)) || [];
    return classId ? subjects.filter(s => s.class_id === classId) : subjects;
  },
  addSubject(classId, name) {
    const subjects = this.getSubjects();
    const newSubject = { id: generateUUID(), class_id: classId, name };
    subjects.push(newSubject);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.syncToCloud('subjects', newSubject);
    return newSubject;
  },
  removeSubject(id) {
    let subjects = this.getSubjects();
    subjects = subjects.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.deleteFromCloud('subjects', id);
  },
  removeAttendanceByDate(classId, date, subjectId) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    records = records.filter(r => !(r.class_id === classId && r.date === date && (r.subject_id || '') === (subjectId || '')));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));

    if (supabaseClient) {
      let query = supabaseClient.from('attendance').delete().eq('class_id', classId).eq('date', date);
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.is('subject_id', null);
      }
      query.then(({ error }) => { if (error) console.error('Cloud Delete Attendance Error:', error); });
    }
  },
  getAttendance(classId, date, semester, subjectId) {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    const targetSem = semester || (window.getCurrentSemester ? window.getCurrentSemester() : '1');
    return records.filter(r => {
      const matchClass = !classId || r.class_id === classId;
      const matchDate = !date || r.date === date;
      const recordSem = String(r.semester || '1');
      const matchSem = !targetSem || recordSem === String(targetSem);
      const matchSubject = !subjectId || (r.subject_id || '') === String(subjectId);
      return matchClass && matchDate && matchSem && matchSubject;
    });
  },
  saveAttendanceRecord(classId, date, time, studentStatuses, semester, subjectId) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    const sem = semester || (window.getCurrentSemester ? window.getCurrentSemester() : '1');

    // Remove old attendance for same class, date, semester, and subjectId
    records = records.filter(r => !(r.class_id === classId && r.date === date && String(r.semester || '1') === String(sem) && (r.subject_id || '') === (subjectId || '')));

    studentStatuses.forEach(item => {
      const deterministicId = generateDeterministicUUID(`${classId}_${item.student_id}_${date}_${sem}_${subjectId || 'default'}`);
      const newRec = {
        id: deterministicId,
        class_id: classId,
        date: date,
        time: time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        student_id: item.student_id,
        status: item.status,
        semester: String(sem),
        subject_id: subjectId || null
      };
      records.push(newRec);
      this.syncToCloud('attendance', newRec);
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },
  getGrades(classId, semester, subjectId) {
    const grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    return grades.filter(g => {
      const matchClass = !classId || g.class_id === classId;
      const matchSem = !semester || !g.semester || String(g.semester) === String(semester);
      const matchSubject = !subjectId || (g.subject_id || '') === String(subjectId);
      return matchClass && matchSem && matchSubject;
    });
  },
  saveGradeRecord(classId, date, category, studentScores, semester, subjectId) {
    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category && (g.subject_id || '') === (subjectId || '')));
    
    const sem = semester || (window.getCurrentSemester ? window.getCurrentSemester() : '1');

    studentScores.forEach(item => {
      const deterministicId = generateDeterministicUUID(`${classId}_${item.student_id}_${date}_${category}_${sem}_${subjectId || 'default'}`);
      const newGrade = {
        id: deterministicId,
        class_id: classId,
        date: date,
        category: category,
        title: category,
        student_id: item.student_id,
        score: parseFloat(item.score) || 0,
        semester: sem,
        subject_id: subjectId || null
      };
      grades.push(newGrade);
      this.syncToCloud('grades', newGrade);
    });

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },
  removeGradeRecord(classId, date, category, subjectId) {
    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category && (g.subject_id || '') === (subjectId || '')));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    if (supabaseClient) {
      let query = supabaseClient.from('grades').delete()
        .eq('class_id', classId)
        .eq('date', date)
        .eq('category', category);
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.is('subject_id', null);
      }
      query.then(({ error }) => { if (error) console.error('Cloud Delete Grade Error:', error); });
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
    this.deleteFromCloud('notes', noteId);
  },
  getAdminCredentials() {
    const creds = localStorage.getItem(STORAGE_KEYS.AUTH);
    return creds ? JSON.parse(creds) : { username: 'admin', password: 'admin' };
  },
  async saveAdminCredentials(username, password) {
    const creds = { username, password };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(creds));

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from('app_settings').upsert([
          { key: 'admin_credentials', value: JSON.stringify(creds) }
        ]);
        if (error) console.error("Cloud Auth Save Error:", error);
      } catch (err) {
        console.error("Cloud Auth Save Exception:", err);
      }
    }
    return creds;
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
        // Purge dummy Ahmad Rizky from cloud if present
        if (cloudStudents.some(s => s.id === 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' || s.name === 'Ahmad Rizky')) {
          this.deleteFromCloud('students', 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5');
        }

        const validCloudStudents = cloudStudents.filter(s => s.id !== 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' && s.name !== 'Ahmad Rizky');
        const localStudents = (JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || []).filter(s => s.id !== 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' && s.name !== 'Ahmad Rizky');

        const stdMap = new Map();
        localStudents.forEach(s => stdMap.set(s.id, s));
        validCloudStudents.forEach(s => stdMap.set(s.id, s));

        const mergedStudents = Array.from(stdMap.values());
        mergedStudents.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));

        localStudents.forEach(ls => {
          if (!cloudStudents.some(cs => cs.id === ls.id)) {
            this.syncToCloud('students', ls);
          }
        });
      }

      // Smart Merge Subjects
      try {
        const { data: cloudSubj, error: errSubj } = await supabaseClient.from('subjects').select('*');
        if (!errSubj && cloudSubj) {
          const localSubj = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS)) || [];
          const subjMap = new Map();
          localSubj.forEach(s => subjMap.set(s.id, s));
          cloudSubj.forEach(s => subjMap.set(s.id, s));

          localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(Array.from(subjMap.values())));

          // Push any local subjects missing in cloud
          localSubj.forEach(ls => {
            if (!cloudSubj.some(cs => cs.id === ls.id)) {
              this.syncToCloud('subjects', ls);
            }
          });
        }
      } catch (e) {
        console.warn("Cloud Subjects Sync Warning:", e);
      }

      // Smart Merge Attendance
      try {
        const { data: cloudAtt, error: errAtt } = await supabaseClient.from('attendance').select('*');
        if (!errAtt && cloudAtt) {
          const localAtt = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
          const attMap = new Map();
          
          // Use class_student_date_semester_subject composite key to merge and eliminate duplicates
          localAtt.forEach(a => {
            const key = `${a.class_id}_${a.student_id}_${a.date}_${a.semester || '1'}_${a.subject_id || 'default'}`;
            attMap.set(key, a);
          });
          cloudAtt.forEach(a => {
            const key = `${a.class_id}_${a.student_id}_${a.date}_${a.semester || '1'}_${a.subject_id || 'default'}`;
            attMap.set(key, a);
          });

          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(Array.from(attMap.values())));
          
          // Push any local attendance missing in cloud (matched by composite key)
          localAtt.forEach(la => {
            const lKey = `${la.class_id}_${la.student_id}_${la.date}_${la.semester || '1'}_${la.subject_id || 'default'}`;
            if (!cloudAtt.some(ca => `${ca.class_id}_${ca.student_id}_${ca.date}_${ca.semester || '1'}_${ca.subject_id || 'default'}` === lKey)) {
              this.syncToCloud('attendance', la);
            }
          });
        }
      } catch (e) {
        console.warn("Cloud Attendance Sync Warning:", e);
      }

      // Smart Merge Grades
      try {
        const { data: cloudGrades, error: errGrd } = await supabaseClient.from('grades').select('*');
        if (!errGrd && cloudGrades) {
          const localGrades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
          const grdMap = new Map();
          
          // Use class_student_date_category_semester_subject composite key to merge
          localGrades.forEach(g => {
            const key = `${g.class_id}_${g.student_id}_${g.date}_${g.category}_${g.semester || '1'}_${g.subject_id || 'default'}`;
            grdMap.set(key, g);
          });
          cloudGrades.forEach(g => {
            const key = `${g.class_id}_${g.student_id}_${g.date}_${g.category}_${g.semester || '1'}_${g.subject_id || 'default'}`;
            grdMap.set(key, g);
          });

          localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(Array.from(grdMap.values())));

          // Push any local grades missing in cloud (matched by composite key)
          localGrades.forEach(lg => {
            const lKey = `${lg.class_id}_${lg.student_id}_${lg.date}_${lg.category}_${lg.semester || '1'}_${lg.subject_id || 'default'}`;
            if (!cloudGrades.some(cg => `${cg.class_id}_${cg.student_id}_${cg.date}_${cg.category}_${cg.semester || '1'}_${cg.subject_id || 'default'}` === lKey)) {
              this.syncToCloud('grades', lg);
            }
          });
        }
      } catch (e) {
        console.warn("Cloud Grades Sync Warning:", e);
      }

      // Smart Merge Notes
      try {
        const { data: cloudNotes, error: errNts } = await supabaseClient.from('notes').select('*');
        if (!errNts && cloudNotes) {
          const localNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
          const noteMap = new Map();
          localNotes.forEach(n => noteMap.set(n.id, n));
          cloudNotes.forEach(n => noteMap.set(n.id, n));

          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(Array.from(noteMap.values())));

          // Push any local notes missing in cloud
          localNotes.forEach(ln => {
            if (!cloudNotes.some(cn => cn.id === ln.id)) {
              this.syncToCloud('notes', ln);
            }
          });
        }
      } catch (e) {
        console.warn("Cloud Notes Sync Warning:", e);
      }

      // Sync Admin Credentials from Cloud app_settings
      try {
        const { data: cloudAuth } = await supabaseClient.from('app_settings').select('*').eq('key', 'admin_credentials');
        if (cloudAuth && cloudAuth.length > 0 && cloudAuth[0].value) {
          const parsed = typeof cloudAuth[0].value === 'string' ? JSON.parse(cloudAuth[0].value) : cloudAuth[0].value;
          if (parsed && parsed.username && parsed.password) {
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.warn("Cloud Auth Sync Warning:", e);
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
