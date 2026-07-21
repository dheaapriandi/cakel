// PWA Service Worker & Install Prompt Controller
let deferredPrompt;

function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered successfully:', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
    }
  });

  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
      } else {
        alert('Untuk meng-install aplikasi:\n1. Buka menu browser HP (titik tiga di kanan atas)\n2. Pilih "Tambah ke Layar Utama" / "Install Aplikasi".');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initPWA);
