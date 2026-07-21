// Data Export Utility (SheetJS / XLSX & CSV)
function exportDataToExcel(classId) {
  const currentClass = window.DataStore.getClasses().find(c => c.id === classId) || { name: 'Kelas' };
  const students = window.DataStore.getStudents(classId);
  const attendance = window.DataStore.getAttendance(classId);
  const grades = window.DataStore.getGrades(classId);

  if (typeof XLSX === 'undefined') {
    alert('Library SheetJS belum siap.');
    return;
  }

  // Sheet 1: Daftar Siswa & Ringkasan
  const studentRows = students.map((s, index) => {
    const studentAtt = attendance.filter(a => a.student_id === s.id);
    const hadir = studentAtt.filter(a => a.status === 'Hadir').length;
    const izin = studentAtt.filter(a => a.status === 'Izin').length;
    const sakit = studentAtt.filter(a => a.status === 'Sakit').length;
    const alpa = studentAtt.filter(a => a.status === 'Alpa').length;

    const studentGrades = grades.filter(g => g.student_id === s.id);
    const avgScore = studentGrades.length > 0 ? (studentGrades.reduce((a, b) => a + b.score, 0) / studentGrades.length).toFixed(1) : '-';

    return {
      'No': index + 1,
      'Nama Siswa': s.name,
      'NIS': s.nis || '-',
      'Total Hadir': hadir,
      'Total Izin': izin,
      'Total Sakit': sakit,
      'Total Alpa': alpa,
      'Rata-Rata Nilai': avgScore
    };
  });

  // Sheet 2: Detail Absensi
  const attendanceRows = attendance.map((a, idx) => {
    const std = students.find(s => s.id === a.student_id);
    return {
      'No': idx + 1,
      'Tanggal': a.date,
      'Waktu': a.time || '-',
      'Nama Siswa': std ? std.name : a.student_id,
      'Status Kehadiran': a.status
    };
  });

  // Sheet 3: Detail Nilai
  const gradeRows = grades.map((g, idx) => {
    const std = students.find(s => s.id === g.student_id);
    return {
      'No': idx + 1,
      'Tanggal': g.date,
      'Kategori/Judul': g.category,
      'Nama Siswa': std ? std.name : g.student_id,
      'Nilai': g.score
    };
  });

  const wb = XLSX.utils.book_new();
  
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Daftar Siswa');

  if (attendanceRows.length > 0) {
    const wsAtt = XLSX.utils.json_to_sheet(attendanceRows);
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Data Absensi');
  }

  if (gradeRows.length > 0) {
    const wsGrades = XLSX.utils.json_to_sheet(gradeRows);
    XLSX.utils.book_append_sheet(wb, wsGrades, 'Data Nilai');
  }

  const filename = `Laporan_${currentClass.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

window.exportDataToExcel = exportDataToExcel;
