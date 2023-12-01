const child_process = require('child_process');

// Modul yang ingin Anda pasang
const modulYangAkanDiinstal = 'axios';

// Fungsi untuk memeriksa apakah modul sudah terinstal
function cekInstalasiModul(modul) {
  try {
    // Coba memeriksa apakah modul dapat diimpor
    require.resolve(modul);
    console.log(`Modul '${modul}' sudah terinstal.`);
  } catch (err) {
    // Jika modul tidak dapat diimpor, instal modul tersebut
    console.log(`Modul '${modul}' belum terinstal. Menginstal...`);
    instalModul(modul);
  }
}

// Fungsi untuk menginstal modul
function instalModul(modul) {
  // Jalankan perintah shell untuk menginstal modul
  const prosesInstalasi = child_process.spawn('npm', ['install', modul], { stdio: 'inherit' });

  // Tangani peristiwa saat proses instalasi selesai
  prosesInstalasi.on('close', (kodeKeluar) => {
    if (kodeKeluar === 0) {
      console.log(`Modul '${modul}' berhasil diinstal.`);
    } else {
      console.error(`Gagal menginstal modul '${modul}'.`);
    }
  });
}

// Panggil fungsi untuk memeriksa dan menginstal modul
cekInstalasiModul(modulYangAkanDiinstal);
