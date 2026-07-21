// Robust Data Export Utility (SheetJS XLSX + CSV Blob Download Fallback)
function exportDataToExcel(classId) {
  try {
    const classes = window.DataStore.getClasses();
    const currentClass = classes.find(c => c.id === classId) || classes[0] || { id: classId, name: 'Kelas' };
    const targetClassId = currentClass.id;

    const students = window.DataStore.getStudents(targetClassId);
    const attendance = window.DataStore.getAttendance(targetClassId);
    const grades = window.DataStore.getGrades(targetClassId);

    const formattedDateToday = new Date().toISOString().split('T')[0];
    const safeClassName = (currentClass.name || 'Kelas').replace(/[^a-zA-Z0-9]/g, '_');

    // Check if SheetJS (XLSX) is available
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan Siswa
      const summaryRows = students.map((s, idx) => {
        const stdAtt = attendance.filter(a => a.student_id === s.id);
        const hadir = stdAtt.filter(a => a.status === 'Hadir').length;
        const izin = stdAtt.filter(a => a.status === 'Izin').length;
        const sakit = stdAtt.filter(a => a.status === 'Sakit').length;
        const alpa = stdAtt.filter(a => a.status === 'Alpa').length;

        const stdGrades = grades.filter(g => g.student_id === s.id);
        const avg = stdGrades.length > 0 ? (stdGrades.reduce((a, b) => a + b.score, 0) / stdGrades.length).toFixed(1) : '-';

        return {
          'No': idx + 1,
          'Kelas': currentClass.name,
          'Nama Siswa': s.name,
          'NIS': s.nis || '-',
          'Total Hadir': hadir,
          'Total Izin': izin,
          'Total Sakit': sakit,
          'Total Alpa': alpa,
          'Rata-Rata Nilai': avg
        };
      });

      // Sheet 2: Detail Absensi
      const attendanceRows = attendance.map((a, idx) => {
        const std = students.find(s => s.id === a.student_id);
        return {
          'No': idx + 1,
          'Kelas': currentClass.name,
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
          'Kelas': currentClass.name,
          'Tanggal': g.date,
          'Kategori/Judul': g.category || g.title || 'Ulangan',
          'Nama Siswa': std ? std.name : g.student_id,
          'Nilai': g.score
        };
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows.length > 0 ? summaryRows : [{'Info': 'Belum ada data siswa'}]);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Siswa');

      if (attendanceRows.length > 0) {
        const wsAtt = XLSX.utils.json_to_sheet(attendanceRows);
        XLSX.utils.book_append_sheet(wb, wsAtt, 'Detail Absensi');
      }

      if (gradeRows.length > 0) {
        const wsGrades = XLSX.utils.json_to_sheet(gradeRows);
        XLSX.utils.book_append_sheet(wb, wsGrades, 'Detail Nilai');
      }

      const excelFileName = `Laporan_Cakel_${safeClassName}_${formattedDateToday}.xlsx`;

      // Generate Blob for universal Android/iOS/PWA download support
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerBlobDownload(blob, excelFileName);
      return;
    }

    // CSV Fallback if SheetJS library CDN fails to load
    exportToCSVFallback(currentClass, students, attendance, grades, formattedDateToday);

  } catch (err) {
    console.error('Export Error:', err);
    alert('Gagal mengekspor data: ' + err.message);
  }
}

function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 200);
}

function exportToCSVFallback(currentClass, students, attendance, grades, formattedDateToday) {
  let csvContent = `Laporan Catatan Kelas: ${currentClass.name}\n\n`;
  csvContent += `No,Nama Siswa,NIS,Hadir,Izin,Sakit,Alpa,Rata-Rata Nilai\n`;

  students.forEach((s, idx) => {
    const stdAtt = attendance.filter(a => a.student_id === s.id);
    const hadir = stdAtt.filter(a => a.status === 'Hadir').length;
    const izin = stdAtt.filter(a => a.status === 'Izin').length;
    const sakit = stdAtt.filter(a => a.status === 'Sakit').length;
    const alpa = stdAtt.filter(a => a.status === 'Alpa').length;

    const stdGrades = grades.filter(g => g.student_id === s.id);
    const avg = stdGrades.length > 0 ? (stdGrades.reduce((a, b) => a + b.score, 0) / stdGrades.length).toFixed(1) : '-';

    csvContent += `${idx + 1},"${s.name}","${s.nis || '-'}",${hadir},${izin},${sakit},${alpa},${avg}\n`;
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, `Laporan_Cakel_${currentClass.name}_${formattedDateToday}.csv`);
}

window.exportDataToExcel = exportDataToExcel;
