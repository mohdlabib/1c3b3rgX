# 1c3b3rgX 🎥🚀

**1c3b3rgX** adalah aplikasi Node.js yang otomatis mengelola video dan menghasilkan thumbnail secara real-time. 

## 🔥 Fitur

- 📂 **Manajemen Video**: Ganti nama file video otomatis.
- 🖼️ **Thumbnail Otomatis**: Buat thumbnail dari video.
- 🛡️ **API Aman**: Dapatkan metadata video dengan API key.
- 🔄 **Monitoring Real-Time**: Deteksi video baru dengan `chokidar`.
- ⭐ **Favorite**: Menyimpan video favorit.

## 🚀 Cara Kerja

1. **Upload Video** ke folder `public/videos`.
2. Video diberi nama baru & thumbnail otomatis dibuat.
3. Metadata video disimpan dalam file `data.json`.
4. Akses metadata melalui API: `/db?apikey=YOUR_API_KEY`.

## 🛠️ Install

1. Clone repo:
   ```bash
   git clone https://github.com/mohdlabib/1c3b3rgX.git
   cd 1c3b3rgX
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   npm start
   ```
4. Docker Run:
   ```bash
   docker run -d \
   -v /{nama folder}/:/usr/src/app/public \
   -p 3000:3000 \
   --name iceborg \
   nama_image
   ```

## 🔑 API

- **GET** `/db?apikey=YOUR_API_KEY`: Mengembalikan metadata video.

## ⚙️ Konfigurasi

- **API Key**: Ubah `API_KEY` di kode (default `'asd'`).
- **Port**: Default `3000`, bisa diubah dengan variabel `PORT`.

## 📦 Dependencies

- `express`
- `fluent-ffmpeg`
- `chokidar`
- `cors`

## 📜 License

MIT License.
```

Singkat, jelas, dan dengan emoji! 😊
