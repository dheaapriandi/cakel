// Supabase & LocalStorage Data Engine
const STORAGE_KEYS = {
  CLASSES: 'absensi_classes_data',
  STUDENTS: 'absensi_students_data',
  ATTENDANCE: 'absensi_attendance_data',
  GRADES: 'absensi_grades_data',
  CONFIG: 'absensi_supabase_config'
};

let supabaseClient = null;

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

// Initial Seed Data matching screenshot ("Kelas X DKV", 1 student)
function loadInitialSeedData() {
  let classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES));
  if (!classes || classes.length === 0) {
    classes = [
      { id: 'cls-1', name: 'Kelas X DKV' }
    ];
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS));
  if (!students || students.length === 0) {
    students = [
      { id: 'std-1', class_id: 'cls-1', name: 'Ahmad Rizky', nis: '1001' }
    ];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE));
  if (!attendance || attendance.length === 0) {
    attendance = [
      { id: 'att-1', class_id: 'cls-1', date: '2026-07-24', time: '09.18', student_id: 'std-1', status: 'Hadir' }
    ];
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  let grades = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES));
  if (!grades || grades.length === 0) {
    grades = [
      { id: 'grd-1', class_id: 'cls-1', date: '2026-07-21', category: 'Ulangan', title: 'Ulangan', student_id: 'std-1', score: 80 }
    ];
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  }
}

// Data Access API
const DataStore = {
  getClasses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES)) || [];
  },
  addClass(name) {
    const classes = this.getClasses();
    const newClass = { id: 'cls-' + Date.now(), name };
    classes.push(newClass);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.syncToCloud('classes', newClass);
    return newClass;
  },
  getStudents(classId) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    return classId ? students.filter(s => s.class_id === classId) : students;
  },
  addStudent(classId, name, nis) {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    const newStudent = { id: 'std-' + Date.now(), class_id: classId, name, nis: nis || '' };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.syncToCloud('students', newStudent);
    return newStudent;
  },
  getAttendance(classId, date) {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    return records.filter(r => r.class_id === classId && (!date || r.date === date));
  },
  saveAttendanceRecord(classId, date, time, studentStatuses) {
    let records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
    // Remove existing records for this class & date
    records = records.filter(r => !(r.class_id === classId && r.date === date));

    studentStatuses.forEach(item => {
      const newRec = {
        id: 'att-' + Date.now() + '-' + item.student_id,
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
        id: 'grd-' + Date.now() + '-' + item.student_id,
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
        const { error } = await supabaseClient.from(tableName).insert([payload]);
        if (error) console.error(`Cloud Sync Error (${tableName}):`, error);
      } catch (err) {
        console.error("Cloud Sync Exception:", err);
      }
    }
  }
};

window.DataStore = DataStore;
window.getSupabaseConfig = getSupabaseConfig;
window.saveSupabaseConfig = saveSupabaseConfig;
window.initSupabase = initSupabase;
window.loadInitialSeedData = loadInitialSeedData;
