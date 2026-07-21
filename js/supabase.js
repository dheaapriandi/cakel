// Supabase & LocalStorage Data Engine with Valid UUID Generator
const STORAGE_KEYS = {
  CLASSES: 'absensi_classes_data',
  STUDENTS: 'absensi_students_data',
  ATTENDANCE: 'absensi_attendance_data',
  GRADES: 'absensi_grades_data',
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

// Initial Seed Data with valid UUIDs
function loadInitialSeedData() {
  let classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES));
  if (!classes || classes.length === 0) {
    classes = [
      { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Kelas X DKV' }
    ];
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS));
  if (!students || students.length === 0) {
    students = [
      { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5', class_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Ahmad Rizky', nis: '1001' }
    ];
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

// Data Access API
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
    return classId ? students.filter(s => s.class_id === classId) : students;
  },
  addStudent(classId, name, nis) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    const newStudent = { id: generateUUID(), class_id: classId, name, nis: nis || '' };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.syncToCloud('students', newStudent);
    return newStudent;
  },
  removeStudent(id) {
    let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    students = students.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    this.deleteFromCloud('students', id);
  },
  getAttendance(classId, date) {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    return records.filter(r => r.class_id === classId && (!date || r.date === date));
  },
  saveAttendanceRecord(classId, date, time, studentStatuses) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    records = records.filter(r => !(r.class_id === classId && r.date === date));

    studentStatuses.forEach(item => {
      const newRec = {
        id: generateUUID(),
        class_id: classId,
        date: date,
        time: time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        student_id: item.student_id,
        status: item.status
      };
      records.push(newRec);
      this.syncToCloud('attendance', newRec);
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },
  getGrades(classId) {
    const grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    return classId ? grades.filter(g => g.class_id === classId) : grades;
  },
  saveGradeRecord(classId, date, category, studentScores) {
    let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || [];
    
    studentScores.forEach(item => {
      const newGrade = {
        id: generateUUID(),
        class_id: classId,
        date: date,
        category: category,
        title: category,
        student_id: item.student_id,
        score: parseFloat(item.score) || 0
      };
      grades.push(newGrade);
      this.syncToCloud('grades', newGrade);
    });

    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },
  async syncToCloud(tableName, payload) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from(tableName).upsert([payload]);
        if (error) console.error(`Cloud Sync Error (${tableName}):`, error);
        else console.log(`Cloud Sync Success (${tableName}):`, payload);
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
      // Fetch classes
      const { data: cloudClasses, error: errCls } = await supabaseClient.from('classes').select('*');
      if (!errCls && cloudClasses && cloudClasses.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudClasses));
      }

      // Fetch students
      const { data: cloudStudents, error: errStd } = await supabaseClient.from('students').select('*');
      if (!errStd && cloudStudents && cloudStudents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cloudStudents));
      }

      // Fetch attendance
      const { data: cloudAtt, error: errAtt } = await supabaseClient.from('attendance').select('*');
      if (!errAtt && cloudAtt && cloudAtt.length > 0) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(cloudAtt));
      }

      // Fetch grades
      const { data: cloudGrades, error: errGrd } = await supabaseClient.from('grades').select('*');
      if (!errGrd && cloudGrades && cloudGrades.length > 0) {
        localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(cloudGrades));
      }

      return true;
    } catch (err) {
      console.error('Cloud Sync Pull Error:', err);
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
