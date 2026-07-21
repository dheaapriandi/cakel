// Main Application Router & Controller
document.addEventListener('DOMContentLoaded', async () => {
  // Load Initial Seed Data if empty
  window.loadInitialSeedData();

  // Try initializing Supabase if credentials exist
  const hasSupabase = window.initSupabase();

  if (hasSupabase && window.DataStore.fetchFromCloud) {
    await window.DataStore.fetchFromCloud();
  }

  // Setup Class Dropdown with cloud-restored classes
  setupClassDropdown();

  // Setup Navigation Tabs
  setupNavigation();

  // Setup Modal Listeners
  setupModals();

  // Setup Header Dropdown Menu
  setupHeaderMenu();

  // Setup FAB Buttons
  setupFABs();

  // Initial View Refresh
  refreshAppViews();

  // Setup Supabase config form listeners
  setupSupabaseSettings();
});

function setupClassDropdown() {
  const dropdown = document.getElementById('class-dropdown');
  if (!dropdown) return;

  const classes = window.DataStore.getClasses();
  dropdown.innerHTML = '';

  classes.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = cls.name;
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener('change', () => {
    refreshAppViews();
  });
}

function getCurrentClassId() {
  const dropdown = document.getElementById('class-dropdown');
  return dropdown ? dropdown.value : 'cls-1';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');

      // Update nav active state
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Hide all tabs & show target
      document.querySelectorAll('.tab-page').forEach(page => {
        page.classList.remove('active');
      });
      const targetPage = document.getElementById(targetTabId);
      if (targetPage) targetPage.classList.add('active');

      // Update Title
      if (targetTabId === 'tab-beranda') pageTitle.textContent = 'Beranda';
      if (targetTabId === 'tab-absensi') pageTitle.textContent = 'Absensi';
      if (targetTabId === 'tab-nilai') pageTitle.textContent = 'Nilai';
      if (targetTabId === 'tab-pengaturan') pageTitle.textContent = 'Pengaturan';

      // Update Floating Action Buttons for active tab
      updateFABContext(targetTabId);

      // Refresh view for active tab
      refreshAppViews();
    });
  });
}

function updateFABContext(tabId) {
  const primaryFab = document.getElementById('fab-primary-btn');
  const excelFab = document.getElementById('fab-export-btn');

  if (!primaryFab || !excelFab) return;

  if (tabId === 'tab-beranda') {
    excelFab.style.display = 'flex';
    primaryFab.style.display = 'flex';

    // Green FAB: Clipboard Icon (Quick Save Absensi)
    excelFab.className = 'fab fab-excel';
    excelFab.title = 'Simpan Absensi';
    excelFab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>`;

    // Black FAB: Person User Icon (Catat Absensi)
    primaryFab.className = 'fab fab-add';
    primaryFab.title = 'Isi Absensi';
    primaryFab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>`;
  } else if (tabId === 'tab-absensi') {
    excelFab.style.display = 'flex';
    primaryFab.style.display = 'flex';

    // Green FAB: Excel Export
    excelFab.className = 'fab fab-excel';
    excelFab.title = 'Ekspor Excel';
    excelFab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`;

    // Black FAB: Plus Icon (Tambah Siswa)
    primaryFab.className = 'fab fab-add';
    primaryFab.title = 'Tambah Siswa';
    primaryFab.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>`;
  } else if (tabId === 'tab-nilai') {
    excelFab.style.display = 'flex';
    primaryFab.style.display = 'flex';

    // Green FAB: Excel Export
    excelFab.className = 'fab fab-excel';
    excelFab.title = 'Ekspor Excel';
    excelFab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>`;

    // Black FAB: Plus Icon (Tambah Nilai)
    primaryFab.className = 'fab fab-add';
    primaryFab.title = 'Tambah Nilai Baru';
    primaryFab.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>`;
  } else {
    excelFab.style.display = 'none';
    primaryFab.style.display = 'none';
  }
}

function refreshAppViews() {
  const classId = getCurrentClassId();
  
  // Refresh Beranda Dashboard
  updateBerandaSummary(classId);

  // Refresh Absensi Tab if active
  if (document.getElementById('tab-absensi').classList.contains('active')) {
    window.renderAbsensiTab(classId);
  }

  // Refresh Nilai Tab if active
  if (document.getElementById('tab-nilai').classList.contains('active')) {
    window.renderNilaiTab(classId);
  }
}

function updateBerandaSummary(classId) {
  const students = window.DataStore.getStudents(classId);
  const totalStudents = students.length || 1;

  // Render 6-Month Chart
  window.renderAttendanceChart('attendance-chart');

  // Attendance for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = window.DataStore.getAttendance(classId, todayStr);

  let hadir = 0, izin = 0, sakit = 0, alpa = 0;
  if (todayAttendance.length > 0) {
    hadir = todayAttendance.filter(a => a.status === 'Hadir').length;
    izin = todayAttendance.filter(a => a.status === 'Izin').length;
    sakit = todayAttendance.filter(a => a.status === 'Sakit').length;
    alpa = todayAttendance.filter(a => a.status === 'Alpa').length;
  } else {
    // Demo values if no attendance entered today
    hadir = totalStudents;
  }

  const todayPercentage = Math.round((hadir / totalStudents) * 100);
  document.getElementById('today-percentage').textContent = `${todayPercentage}%`;
  document.getElementById('today-fraction').textContent = `${hadir} / ${totalStudents}`;

  document.getElementById('count-hadir').textContent = hadir;
  document.getElementById('count-izin').textContent = izin;
  document.getElementById('count-sakit').textContent = sakit;
  document.getElementById('count-alpa').textContent = alpa;

  // Last Attendance Entry Card
  const allAttendance = window.DataStore.getAttendance(classId);
  if (allAttendance.length > 0) {
    const lastRec = allAttendance[allAttendance.length - 1];
    const lastRecs = allAttendance.filter(a => a.date === lastRec.date);
    const lHadir = lastRecs.filter(a => a.status === 'Hadir').length;
    const lIzin = lastRecs.filter(a => a.status === 'Izin').length;
    const lSakit = lastRecs.filter(a => a.status === 'Sakit').length;
    const lAlpa = lastRecs.filter(a => a.status === 'Alpa').length;

    document.getElementById('last-absensi-date').textContent = `${window.formatDateIndo(lastRec.date)}${lastRec.time ? ', ' + lastRec.time : ''}`;
    document.getElementById('last-absensi-ratio').textContent = `${lHadir}/${lastRecs.length}`;
    document.getElementById('last-hadir').textContent = lHadir;
    document.getElementById('last-izin').textContent = lIzin;
    document.getElementById('last-sakit').textContent = lSakit;
    document.getElementById('last-alpa').textContent = lAlpa;
  }

  // Last Grade Entry Card
  const allGrades = window.DataStore.getGrades(classId);
  if (allGrades.length > 0) {
    const lastGrade = allGrades[allGrades.length - 1];
    const categoryGrades = allGrades.filter(g => g.date === lastGrade.date && g.category === lastGrade.category);
    const scores = categoryGrades.map(g => g.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    document.getElementById('last-grade-date').textContent = window.formatDateIndo(lastGrade.date);
    document.getElementById('last-grade-title').textContent = lastGrade.category || 'Ulangan';
    document.getElementById('last-grade-students').textContent = `${scores.length}/${totalStudents}`;
    document.getElementById('last-grade-avg').textContent = avg;
    document.getElementById('last-grade-max').textContent = max;
    document.getElementById('last-grade-min').textContent = min;
  }
}

function setupHeaderMenu() {
  const menuBtn = document.getElementById('header-menu-btn');
  const dropdown = document.getElementById('header-dropdown-menu');

  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== menuBtn) {
        dropdown.classList.remove('active');
      }
    });

    document.getElementById('menu-opt-classes')?.addEventListener('click', () => {
      dropdown.classList.remove('active');
      renderClassListModal();
      document.getElementById('modal-manage-classes').classList.add('open');
    });

    document.getElementById('menu-opt-students')?.addEventListener('click', () => {
      dropdown.classList.remove('active');
      renderStudentListModal();
      document.getElementById('modal-manage-students').classList.add('open');
    });

    document.getElementById('menu-opt-export')?.addEventListener('click', () => {
      dropdown.classList.remove('active');
      window.exportDataToExcel(getCurrentClassId());
    });

    document.getElementById('menu-opt-settings')?.addEventListener('click', () => {
      dropdown.classList.remove('active');
      document.querySelector('[data-tab="tab-pengaturan"]')?.click();
    });

    document.getElementById('menu-opt-install')?.addEventListener('click', () => {
      dropdown.classList.remove('active');
      document.getElementById('install-pwa-btn')?.click();
    });
  }
}

function setupFABs() {
  const exportBtn = document.getElementById('fab-export-btn');
  const addBtn = document.getElementById('fab-primary-btn');
  const exportAllBtn = document.getElementById('export-all-excel-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-tab');
      if (activeTab === 'tab-beranda') {
        window.saveCurrentAbsensi(getCurrentClassId());
      } else {
        window.exportDataToExcel(getCurrentClassId());
      }
    });
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      window.exportDataToExcel(getCurrentClassId());
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.bottom-nav .nav-item.active')?.getAttribute('data-tab');
      if (activeTab === 'tab-absensi') {
        renderStudentListModal();
        const modal = document.getElementById('modal-manage-students');
        if (modal) modal.classList.add('open');
      } else if (activeTab === 'tab-nilai') {
        window.openInputNilaiModal();
      } else {
        // Default on Beranda
        document.querySelector('[data-tab="tab-absensi"]')?.click();
      }
    });
  }

  const saveAbsensiBtn = document.getElementById('save-absensi-btn');
  if (saveAbsensiBtn) {
    saveAbsensiBtn.addEventListener('click', () => {
      window.saveCurrentAbsensi(getCurrentClassId());
    });
  }

  const markAllBtn = document.getElementById('mark-all-hadir-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', window.markAllHadir);
  }
}

function setupModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModalId = btn.getAttribute('data-close');
      const modal = document.getElementById(targetModalId);
      if (modal) modal.classList.remove('open');
    });
  });

  // Save Nilai Btn
  const saveNilaiBtn = document.getElementById('save-nilai-btn');
  if (saveNilaiBtn) {
    saveNilaiBtn.addEventListener('click', window.saveInputNilai);
  }

  // Manage Classes Modal
  const manageClassesBtn = document.getElementById('manage-classes-btn');
  if (manageClassesBtn) {
    manageClassesBtn.addEventListener('click', () => {
      renderClassListModal();
      document.getElementById('modal-manage-classes').classList.add('open');
    });
  }

  const addClassBtn = document.getElementById('add-class-btn');
  if (addClassBtn) {
    addClassBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('new-class-name');
      const name = nameInput.value.trim();
      if (name) {
        window.DataStore.addClass(name);
        nameInput.value = '';
        setupClassDropdown();
        renderClassListModal();
      }
    });
  }

  // Manage Students Modal
  const manageStudentsBtn = document.getElementById('manage-students-btn');
  if (manageStudentsBtn) {
    manageStudentsBtn.addEventListener('click', () => {
      renderStudentListModal();
      document.getElementById('modal-manage-students').classList.add('open');
    });
  }

  const addStudentBtn = document.getElementById('add-student-btn');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('new-student-name');
      const nisInput = document.getElementById('new-student-nis');
      const name = nameInput.value.trim();
      const nis = nisInput.value.trim();
      const classId = getCurrentClassId();

      if (name) {
        window.DataStore.addStudent(classId, name, nis);
        nameInput.value = '';
        nisInput.value = '';
        renderStudentListModal();
        refreshAppViews();
      }
    });
  }
}

function renderClassListModal() {
  const container = document.getElementById('class-list-container');
  if (!container) return;

  const classes = window.DataStore.getClasses();
  if (classes.length === 0) {
    container.innerHTML = '<div class="text-muted p-12">Belum ada kelas. Silakan tambah kelas baru di atas.</div>';
    return;
  }

  let html = '';
  classes.forEach(c => {
    html += `
      <div class="student-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
        <span class="student-name">${c.name}</span>
        <button class="btn-text" style="color: #ef4444; font-size: 13px; font-weight: 600;" onclick="deleteClassConfirm('${c.id}', '${c.name}')">🗑️ Hapus</button>
      </div>
    `;
  });
  container.innerHTML = html;
}

function deleteClassConfirm(classId, className) {
  if (confirm(`Apakah Anda yakin ingin menghapus "${className}" beserta seluruh data siswa di dalamnya?`)) {
    window.DataStore.removeClass(classId);
    setupClassDropdown();
    renderClassListModal();
    refreshAppViews();
  }
}

function renderStudentListModal() {
  const container = document.getElementById('student-roster-container');
  if (!container) return;

  const classId = getCurrentClassId();
  const students = window.DataStore.getStudents(classId);

  if (students.length === 0) {
    container.innerHTML = '<div class="text-muted p-12">Belum ada siswa di kelas ini.</div>';
    return;
  }

  let html = '';
  students.forEach(s => {
    html += `
      <div class="student-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
        <div>
          <div class="student-name">${s.name}</div>
          <div class="student-nis">${s.nis ? 'NIS: ' + s.nis : ''}</div>
        </div>
        <button class="btn-text" style="color: #ef4444; font-size: 13px; font-weight: 600;" onclick="deleteStudentConfirm('${s.id}', '${s.name}')">🗑️ Hapus</button>
      </div>
    `;
  });
  container.innerHTML = html;
}

function deleteStudentConfirm(studentId, studentName) {
  if (confirm(`Hapus siswa "${studentName}" dari kelas ini?`)) {
    window.DataStore.removeStudent(studentId);
    renderStudentListModal();
    refreshAppViews();
  }
}

window.deleteClassConfirm = deleteClassConfirm;
window.deleteStudentConfirm = deleteStudentConfirm;

function setupSupabaseSettings() {
  const cfg = window.getSupabaseConfig();
  if (cfg.url) document.getElementById('cfg-supabase-url').value = cfg.url;
  if (cfg.key) document.getElementById('cfg-supabase-key').value = cfg.key;

  const saveBtn = document.getElementById('save-supabase-config');
  const statusDiv = document.getElementById('supabase-status');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const url = document.getElementById('cfg-supabase-url').value.trim();
      const key = document.getElementById('cfg-supabase-key').value.trim();

      if (url && key) {
        const success = window.saveSupabaseConfig(url, key);
        if (success) {
          statusDiv.style.color = '#22c55e';
          statusDiv.textContent = '✅ Berhasil terhubung ke Supabase!';
        } else {
          statusDiv.style.color = '#ef4444';
          statusDiv.textContent = '❌ Gagal terhubung. Periksa URL dan Key Anda.';
        }
      } else {
        statusDiv.style.color = '#ef4444';
        statusDiv.textContent = '⚠️ Harap isi URL dan Anon Key Supabase.';
      }
    });
  }
}

window.refreshAppViews = refreshAppViews;
