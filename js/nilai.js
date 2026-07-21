// Nilai (Grades) Module & UI Renderer
function renderNilaiTab(classId) {
  const container = document.getElementById('nilai-history-list');
  if (!container) return;

  const grades = window.DataStore.getGrades(classId);
  const students = window.DataStore.getStudents(classId);
  
  if (grades.length === 0) {
    container.innerHTML = `
      <div class="card p-20 text-center">
        <div class="text-muted mb-12">Belum ada riwayat nilai untuk kelas ini.</div>
        <button class="btn btn-primary" onclick="openInputNilaiModal()">+ Tambah Nilai</button>
      </div>
    `;
    return;
  }

  // Group by Date + Title/Category
  const grouped = {};
  grades.forEach(g => {
    const key = `${g.date}_${g.category}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: g.date,
        title: g.category || 'Ulangan',
        items: []
      };
    }
    grouped[key].items.push(g);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  let html = '';
  Object.keys(grouped).sort().reverse().forEach(key => {
    const group = grouped[key];
    const scores = group.items.map(i => i.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = scores.length > 0 ? Math.round(sum / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const isToday = group.date === todayStr;

    const formattedDate = window.formatDateIndo(group.date);
    const encodedTitle = encodeURIComponent(group.title);

    html += `
      <div class="history-item-card">
        <div class="history-card-header" style="justify-content: space-between;">
          <div>
            ${isToday ? '<span class="pill-badge">HARI INI</span>' : ''}
            <span class="history-date">${formattedDate}</span>
          </div>
          <div>
            <button class="btn-text" style="color: #4f46e5; font-size: 13px; font-weight: 600;" onclick="viewOrEditExamRecord('${group.date}', '${encodedTitle}')">✏️ Lihat & Edit</button>
            <button class="btn-text" style="color: #ef4444; font-size: 13px; font-weight: 600; margin-left: 8px;" onclick="deleteExamRecordConfirm('${classId}', '${group.date}', '${encodedTitle}')">🗑️ Hapus</button>
          </div>
        </div>
        <div class="history-exam-title">${group.title}</div>
        <div class="history-main-score">${avg}</div>
        <div class="status-lbl mb-8">Rata-rata</div>
        <div class="history-stats-row">
          <div class="stat-pair"><span>Tertinggi:</span> <span class="val">${max}</span></div>
          <div class="stat-pair"><span>Terendah:</span> <span class="val">${min}</span></div>
          <div class="stat-pair"><span>Siswa:</span> <span class="val">${group.items.length}/${students.length || group.items.length}</span></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function viewOrEditExamRecord(date, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const currentClassId = document.getElementById('class-dropdown').value;
  const students = window.DataStore.getStudents(currentClassId);
  const grades = window.DataStore.getGrades(currentClassId);

  const titleInput = document.getElementById('input-nilai-title');
  const dateInput = document.getElementById('input-nilai-date');
  if (titleInput) titleInput.value = title;
  if (dateInput) dateInput.value = date;

  // Build map of existing student scores
  const scoreMap = new Map();
  grades.filter(g => g.date === date && (g.category === title || g.title === title)).forEach(g => {
    scoreMap.set(g.student_id, g.score);
  });

  const container = document.getElementById('nilai-students-container');
  if (container) {
    let html = '';
    students.forEach(s => {
      const existingScore = scoreMap.has(s.id) ? scoreMap.get(s.id) : 80;
      html += `
        <div class="student-item-row" data-student-id="${s.id}">
          <div class="student-name">${s.name}</div>
          <input type="number" min="0" max="100" class="form-input score-input" style="width: 80px; text-align: center;" placeholder="0-100" value="${existingScore}">
        </div>
      `;
    });
    container.innerHTML = html;
  }

  const modal = document.getElementById('modal-input-nilai');
  if (modal) modal.classList.add('open');
}

function deleteExamRecordConfirm(classId, date, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const formattedDate = window.formatDateIndo(date);
  if (confirm(`Apakah Anda yakin ingin menghapus data nilai "${title}" pada tanggal ${formattedDate}?`)) {
    window.DataStore.removeGradeRecord(classId, date, title);
    if (window.refreshAppViews) window.refreshAppViews();
  }
}

function openInputNilaiModal() {
  const currentClassId = document.getElementById('class-dropdown').value;
  const students = window.DataStore.getStudents(currentClassId);

  if (students.length === 0) {
    alert('Tambah data siswa terlebih dahulu di menu Pengaturan.');
    return;
  }

  const titleInput = document.getElementById('input-nilai-title');
  if (titleInput) titleInput.value = 'Ulangan Harian';

  const dateInput = document.getElementById('input-nilai-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const container = document.getElementById('nilai-students-container');
  if (container) {
    let html = '';
    students.forEach(s => {
      html += `
        <div class="student-item-row" data-student-id="${s.id}">
          <div class="student-name">${s.name}</div>
          <input type="number" min="0" max="100" class="form-input score-input" style="width: 80px; text-align: center;" placeholder="0-100" value="80">
        </div>
      `;
    });
    container.innerHTML = html;
  }

  const modal = document.getElementById('modal-input-nilai');
  if (modal) modal.classList.add('open');
}

function saveInputNilai() {
  const currentClassId = document.getElementById('class-dropdown').value;
  const titleInput = document.getElementById('input-nilai-title');
  const dateInput = document.getElementById('input-nilai-date');
  
  const category = titleInput ? titleInput.value.trim() || 'Ulangan' : 'Ulangan';
  const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

  const studentRows = document.querySelectorAll('#nilai-students-container .student-item-row');
  const studentScores = [];

  studentRows.forEach(row => {
    const studentId = row.getAttribute('data-student-id');
    const scoreVal = row.querySelector('.score-input').value;
    studentScores.push({
      student_id: studentId,
      score: scoreVal !== '' ? parseFloat(scoreVal) : 0
    });
  });

  window.DataStore.saveGradeRecord(currentClassId, date, category, studentScores);

  const modal = document.getElementById('modal-input-nilai');
  if (modal) modal.classList.remove('open');

  alert('Data Nilai Berhasil Disimpan!');
  if (window.refreshAppViews) window.refreshAppViews();
}

window.renderNilaiTab = renderNilaiTab;
window.openInputNilaiModal = openInputNilaiModal;
window.saveInputNilai = saveInputNilai;
window.viewOrEditExamRecord = viewOrEditExamRecord;
window.deleteExamRecordConfirm = deleteExamRecordConfirm;
