// Attendance Logic & Tab Rendering
function renderAbsensiTab(classId) {
  const datePicker = document.getElementById('absensi-date-picker');
  if (datePicker && !datePicker.value) {
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
  }

  const currentDate = datePicker.value;
  const students = window.DataStore.getStudents(classId);
  const existingAttendance = window.DataStore.getAttendance(classId, currentDate);
  
  const container = document.getElementById('absensi-student-list');
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '<div class="text-muted p-12">Belum ada siswa di kelas ini. Tambahkan di menu Pengaturan.</div>';
    return;
  }

  let html = '';
  students.forEach(student => {
    const record = existingAttendance.find(r => r.student_id === student.id);
    const currentStatus = record ? record.status : 'Hadir';

    html += `
      <div class="student-item-row" data-student-id="${student.id}">
        <div>
          <div class="student-name">${student.name}</div>
          <div class="student-nis">${student.nis ? 'NIS: ' + student.nis : ''}</div>
        </div>
        <div class="attendance-toggle-group">
          <button class="toggle-btn ${currentStatus === 'Hadir' ? 'active hadir' : ''}" onclick="setAttendanceStatus('${student.id}', 'Hadir', this)">Hadir</button>
          <button class="toggle-btn ${currentStatus === 'Izin' ? 'active izin' : ''}" onclick="setAttendanceStatus('${student.id}', 'Izin', this)">Izin</button>
          <button class="toggle-btn ${currentStatus === 'Sakit' ? 'active sakit' : ''}" onclick="setAttendanceStatus('${student.id}', 'Sakit', this)">Sakit</button>
          <button class="toggle-btn ${currentStatus === 'Alpa' ? 'active alpa' : ''}" onclick="setAttendanceStatus('${student.id}', 'Alpa', this)">Alpa</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  renderAbsensiHistory(classId);
}

function setAttendanceStatus(studentId, status, btnElement) {
  const group = btnElement.parentElement;
  const buttons = group.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => {
    btn.className = 'toggle-btn';
  });

  const lower = status.toLowerCase();
  btnElement.className = `toggle-btn active ${lower}`;
}

function saveCurrentAbsensi(classId) {
  const datePicker = document.getElementById('absensi-date-picker');
  const currentDate = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  
  const studentRows = document.querySelectorAll('#absensi-student-list .student-item-row');
  const studentStatuses = [];

  studentRows.forEach(row => {
    const studentId = row.getAttribute('data-student-id');
    const activeBtn = row.querySelector('.toggle-btn.active');
    const status = activeBtn ? activeBtn.innerText : 'Hadir';
    studentStatuses.push({ student_id: studentId, status });
  });

  window.DataStore.saveAttendanceRecord(classId, currentDate, nowTime, studentStatuses);
  alert('Data Absensi Berhasil Disimpan!');
  
  // Refresh Beranda & Absensi view
  if (window.refreshAppViews) window.refreshAppViews();
}

function markAllHadir() {
  const buttons = document.querySelectorAll('#absensi-student-list .toggle-btn');
  buttons.forEach(btn => {
    if (btn.innerText === 'Hadir') {
      btn.click();
    }
  });
}

function renderAbsensiHistory(classId) {
  const container = document.getElementById('absensi-history-list');
  if (!container) return;

  const records = window.DataStore.getAttendance(classId);
  if (records.length === 0) {
    container.innerHTML = '<div class="text-muted p-12">Belum ada riwayat absensi.</div>';
    return;
  }

  // Group by date & deduplicate per student_id
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = new Map();
    grouped[r.date].set(r.student_id, r);
  });

  const totalStudents = window.DataStore.getStudents(classId).length || 1;

  let html = '';
  Object.keys(grouped).sort().reverse().forEach(dateStr => {
    const studentMap = grouped[dateStr];
    const items = Array.from(studentMap.values());
    const hadir = items.filter(i => i.status === 'Hadir').length;
    const izin = items.filter(i => i.status === 'Izin').length;
    const sakit = items.filter(i => i.status === 'Sakit').length;
    const alpa = items.filter(i => i.status === 'Alpa').length;
    const total = items.length || totalStudents;

    const formattedDate = formatDateIndo(dateStr);

    html += `
      <div class="card last-entry-card mb-12">
        <div class="card-top-row">
          <span class="card-title-bold">Absensi</span>
          <span class="card-date-light">${formattedDate} ${items[0] && items[0].time ? ', ' + items[0].time : ''}</span>
        </div>
        <div class="big-fraction-value">${hadir}/${total}</div>
        <div class="status-grid mini">
          <div class="status-item"><span class="status-num text-hadir">${hadir}</span><span class="status-lbl">Hadir</span></div>
          <div class="status-item"><span class="status-num text-izin">${izin}</span><span class="status-lbl">Izin</span></div>
          <div class="status-item"><span class="status-num text-sakit">${sakit}</span><span class="status-lbl">Sakit</span></div>
          <div class="status-item"><span class="status-num text-alpa">${alpa}</span><span class="status-lbl">Alpa</span></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

window.renderAbsensiTab = renderAbsensiTab;
window.setAttendanceStatus = setAttendanceStatus;
window.saveCurrentAbsensi = saveCurrentAbsensi;
window.markAllHadir = markAllHadir;
window.formatDateIndo = formatDateIndo;
