FROM node:14

WORKDIR /usr/src/app

# Menyalin package.json dan package-lock.json ke dalam container
COPY package*.json ./

# Menginstal dependensi npm
RUN npm install

# Menyalin seluruh kode sumber aplikasi ke dalam container
COPY . .

# Mengexpose port yang digunakan oleh aplikasi
EXPOSE 3000

# Menjalankan aplikasi saat container dimulai
CMD ["node", "main.js"]
