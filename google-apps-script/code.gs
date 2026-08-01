/**
 * Cakel - Google Apps Script Backend (code.gs)
 * Hubungkan script ini ke Google Sheet Anda.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Cakel - Catatan Kelas & Absensi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- DATABASE HOOKS (GOOGLE SHEETS CRUD) ---

function getSpreadsheet() {
  // Secara default menggunakan spreadsheet yang aktif (di-bind ke script ini)
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // Fallback: Jika standalone, silakan masukkan ID Spreadsheet Anda di bawah ini
    const SPREADSHEET_ID = ""; // ISI ID SPREADSHEET JIKA STANDALONE
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    throw new Error("Spreadsheet tidak ditemukan. Silakan hubungkan script ke Google Sheet Anda.");
  }
}

function getOrCreateSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
  }
  return sheet;
}

function getSheetData(sheetName, headers) {
  const sheet = getOrCreateSheet(sheetName, headers);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const sheetHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < sheetHeaders.length; j++) {
      row[sheetHeaders[j]] = values[i][j];
    }
    result.push(row);
  }
  return result;
}

function writeSheetData(sheetName, headers, dataArray) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  sheet = getOrCreateSheet(sheetName, headers);
  
  if (dataArray.length === 0) return;
  
  const values = [];
  dataArray.forEach(row => {
    const rowValues = [];
    headers.forEach(h => {
      rowValues.push(row[h] !== undefined ? row[h] : "");
    });
    values.push(rowValues);
  });
  
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

// --- API METHODS EXPOSED TO FRONTEND ---

// 1. Classes CRUD
const CLASSES_HEADERS = ["id", "name"];
function getClasses() {
  return getSheetData("classes", CLASSES_HEADERS);
}
function addClass(newClass) {
  const sheet = getOrCreateSheet("classes", CLASSES_HEADERS);
  sheet.appendRow([newClass.id, newClass.name]);
  return newClass;
}
function removeClass(id) {
  // Remove class
  const classes = getClasses().filter(c => c.id !== id);
  writeSheetData("classes", CLASSES_HEADERS, classes);
  
  // Cascade delete students
  const students = getStudents().filter(s => s.class_id !== id);
  writeSheetData("students", STUDENTS_HEADERS, students);
  
  // Cascade delete attendance
  const attendance = getSheetData("attendance", ATTENDANCE_HEADERS).filter(a => a.class_id !== id);
  writeSheetData("attendance", ATTENDANCE_HEADERS, attendance);
  
  // Cascade delete grades
  const grades = getSheetData("grades", GRADES_HEADERS).filter(g => g.class_id !== id);
  writeSheetData("grades", GRADES_HEADERS, grades);
}

// 2. Students CRUD
const STUDENTS_HEADERS = ["id", "class_id", "name", "nis"];
function getStudents() {
  const students = getSheetData("students", STUDENTS_HEADERS);
  // Sort alphabetically
  students.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
  return students;
}
function addStudent(newStudent) {
  const sheet = getOrCreateSheet("students", STUDENTS_HEADERS);
  sheet.appendRow([newStudent.id, newStudent.class_id, newStudent.name, newStudent.nis]);
  return newStudent;
}
function addStudentsBatch(studentsArray) {
  if (studentsArray.length === 0) return;
  const sheet = getOrCreateSheet("students", STUDENTS_HEADERS);
  const values = studentsArray.map(s => [s.id, s.class_id, s.name, s.nis || ""]);
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, 4).setValues(values);
}
function removeStudent(id) {
  const students = getStudents().filter(s => s.id !== id);
  writeSheetData("students", STUDENTS_HEADERS, students);
}

// 3. Attendance CRUD
const ATTENDANCE_HEADERS = ["id", "class_id", "date", "time", "student_id", "status", "semester"];
function getAttendance() {
  return getSheetData("attendance", ATTENDANCE_HEADERS);
}
function saveAttendanceRecordBatch(classId, date, time, studentStatuses, semester) {
  let records = getAttendance();
  // Remove old records for same class, date, and semester to avoid duplicates
  records = records.filter(r => !(r.class_id === classId && r.date === date && String(r.semester || '1') === String(semester)));
  
  studentStatuses.forEach(item => {
    records.push({
      id: item.id,
      class_id: classId,
      date: date,
      time: time,
      student_id: item.student_id,
      status: item.status,
      semester: String(semester)
    });
  });
  
  writeSheetData("attendance", ATTENDANCE_HEADERS, records);
}
function removeAttendanceByDate(classId, date) {
  let records = getAttendance();
  records = records.filter(r => !(r.class_id === classId && r.date === date));
  writeSheetData("attendance", ATTENDANCE_HEADERS, records);
}

// 4. Grades CRUD
const GRADES_HEADERS = ["id", "class_id", "date", "category", "title", "student_id", "score", "semester"];
function getGrades() {
  return getSheetData("grades", GRADES_HEADERS);
}
function saveGradeRecordBatch(classId, date, category, studentScores, semester) {
  let grades = getGrades();
  // Remove old records for same class, date, and category
  grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category));
  
  studentScores.forEach(item => {
    grades.push({
      id: item.id,
      class_id: classId,
      date: date,
      category: category,
      title: category,
      student_id: item.student_id,
      score: Number(item.score) || 0,
      semester: String(semester)
    });
  });
  
  writeSheetData("grades", GRADES_HEADERS, grades);
}
function removeGradeRecord(classId, date, category) {
  let grades = getGrades();
  grades = grades.filter(g => !(g.class_id === classId && g.date === date && g.category === category));
  writeSheetData("grades", GRADES_HEADERS, grades);
}

// 5. Notes CRUD
const NOTES_HEADERS = ["id", "class_id", "title", "tag", "content", "date"];
function getNotes() {
  return getSheetData("notes", NOTES_HEADERS);
}
function saveNoteItem(classId, noteData) {
  let notes = getNotes();
  const exists = notes.some(n => n.id === noteData.id);
  
  if (exists) {
    notes = notes.map(n => n.id === noteData.id ? { ...n, ...noteData, class_id: classId } : n);
  } else {
    notes.push({
      id: noteData.id,
      class_id: classId,
      title: noteData.title,
      tag: noteData.tag,
      content: noteData.content,
      date: noteData.date
    });
  }
  writeSheetData("notes", NOTES_HEADERS, notes);
}
function deleteNoteItem(noteId) {
  const notes = getNotes().filter(n => n.id !== noteId);
  writeSheetData("notes", NOTES_HEADERS, notes);
}

// 6. Admin Credentials CRUD
const APP_SETTINGS_HEADERS = ["key", "value"];
function getAdminCredentials() {
  const settings = getSheetData("app_settings", APP_SETTINGS_HEADERS);
  const row = settings.find(s => s.key === "admin_credentials");
  if (row && row.value) {
    try {
      return JSON.parse(row.value);
    } catch(e) {}
  }
  return { username: "admin", password: "admin" };
}
function saveAdminCredentials(username, password) {
  let settings = getSheetData("app_settings", APP_SETTINGS_HEADERS);
  const creds = { username, password };
  
  const exists = settings.some(s => s.key === "admin_credentials");
  if (exists) {
    settings = settings.map(s => s.key === "admin_credentials" ? { key: "admin_credentials", value: JSON.stringify(creds) } : s);
  } else {
    settings.push({ key: "admin_credentials", value: JSON.stringify(creds) });
  }
  writeSheetData("app_settings", APP_SETTINGS_HEADERS, settings);
}
