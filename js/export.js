// Robust Data Export Utility (SheetJS XLSX + CSV Blob Download Fallback)
function exportDataToExcel(classId) {
  try {
    const classes = window.DataStore.getClasses();
    const currentClass = classes.find(c => c.id === classId) || classes[0] || { id: classId, name: 'Kelas' };
    const targetClassId = currentClass.id;

    const semester = window.getCurrentSemester ? window.getCurrentSemester() : '1';
    const semesterText = semester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';

    const students = window.DataStore.getStudents(targetClassId);
    const attendance = window.DataStore.getAttendance(targetClassId, null, semester);
    const grades = window.DataStore.getGrades(targetClassId, semester);

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
          'Semester': semesterText,
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

function processBatchStudentImport(classId) {
  const fileInputEl = document.getElementById('batch-file-input');
  const textInputEl = document.getElementById('batch-text-input');
  const studentsToInsert = [];

  // Parse Text Input if provided
  const rawText = textInputEl ? textInputEl.value.trim() : '';
  if (rawText) {
    const lines = rawText.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const parts = line.split(',');
        const name = parts[0].trim();
        const nis = parts[1] ? parts[1].trim() : '';
        if (name && !/^(nama|nama siswa|name|student name)$/i.test(name)) {
          studentsToInsert.push({ name, nis });
        }
      }
    });
  }

  // Parse Excel / CSV File Input if provided
  const file = fileInputEl && fileInputEl.files ? fileInputEl.files[0] : null;
  if (file && typeof XLSX !== 'undefined') {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        jsonRows.forEach(row => {
          let name = '';
          let nis = '';

          const keys = Object.keys(row);
          const nameKey = keys.find(k => /nama|name|siswa/i.test(k));
          const nisKey = keys.find(k => /nis|nokind|no_induk|id/i.test(k));

          if (nameKey && row[nameKey] !== undefined && row[nameKey] !== null && String(row[nameKey]).trim()) {
            name = String(row[nameKey]).trim();
            if (nisKey && row[nisKey] !== undefined && row[nisKey] !== null) {
              nis = String(row[nisKey]).trim();
            }
          } else {
            // Fallback for headerless or custom column names
            const values = Object.values(row).map(v => String(v).trim()).filter(v => v.length > 0);
            const stringValues = values.filter(v => isNaN(v) || v.length > 4);
            if (stringValues.length > 0) {
              name = stringValues[0];
              const remaining = values.filter(v => v !== name);
              if (remaining.length > 0) nis = remaining[0];
            } else if (values.length > 0) {
              name = values[0];
              if (values.length > 1) nis = values[1];
            }
          }

          if (name && !/^(nama|nama siswa|name|student name|no)$/i.test(name)) {
            studentsToInsert.push({ name, nis });
          }
        });

        saveBatchStudents(classId, studentsToInsert);
      } catch (err) {
        alert('Gagal membaca file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (studentsToInsert.length > 0) {
    saveBatchStudents(classId, studentsToInsert);
  } else {
    alert('Harap unggah file Excel/CSV atau tempelkan teks daftar nama siswa.');
  }
}

function saveBatchStudents(classId, studentsArray) {
  if (studentsArray.length === 0) {
    alert('Tidak ada data nama siswa yang valid ditemukan.');
    return;
  }

  if (window.DataStore && window.DataStore.addStudentsBatch) {
    window.DataStore.addStudentsBatch(classId, studentsArray);
  } else {
    studentsArray.forEach(item => {
      window.DataStore.addStudent(classId, item.name, item.nis);
    });
  }

  alert(`✅ Berhasil mengimpor ${studentsArray.length} data siswa secara batch!`);
  
  const fileInputEl = document.getElementById('batch-file-input');
  const textInputEl = document.getElementById('batch-text-input');
  if (fileInputEl) fileInputEl.value = '';
  if (textInputEl) textInputEl.value = '';

  document.getElementById('modal-batch-import')?.classList.remove('open');
  if (window.refreshAppViews) window.refreshAppViews();
}

window.processBatchStudentImport = processBatchStudentImport;
