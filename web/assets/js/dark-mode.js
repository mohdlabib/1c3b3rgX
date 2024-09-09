const options = {
    top: '32px', // Ubah dari bottom ke top untuk menempatkan di atas
    right: '32px', // Atur posisi di kanan
    left: 'unset', // Hapus posisi di kiri
    time: '0.5s', // default: '0.3s'
    backgroundColor: '#e5dada', // Warna saat mode light
    buttonColorLight: '#fff', // default: '#fff'
    buttonColorDark: '#A34343', // Warna saat mode dark
    saveInCookies: true, // default: true
    label: '🌓', // default: ''
    autoMatchOsTheme: true // default: true
};

const darkmode = new Darkmode(options);
darkmode.showWidget();

// Ubah warna latar belakang halaman
function setDarkModeBackground() {
    const isDark = darkmode.isActivated();
    document.body.style.backgroundColor = isDark ? '#A34343' : '#e5dada';
}

// Set background on page load and on mode change
document.addEventListener('DOMContentLoaded', setDarkModeBackground);
