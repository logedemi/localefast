# Email Temporary Service with Custom Domain

Layanan email sementara yang dapat dihosting di Netlify dengan domain sendiri.

## 🚀 Fitur Utama

- ✅ **Domain Custom** - Gunakan domain Anda sendiri
- ✅ **Auto Delete** - Email otomatis terhapus setelah 24 jam
- ✅ **No Registration** - Tidak perlu registrasi
- ✅ **100% Gratis** - Tanpa biaya hosting (Netlify Free Tier)
- ✅ **API Access** - Endpoint API untuk integrasi
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Dark/Light Mode** - Tema gelap/terang

## 📋 Prasyarat

- Akun [Netlify](https://netlify.com) (gratis)
- Domain custom (opsional, bisa pakai subdomain Netlify)
- Git (untuk deployment)

## 🚀 Deployment ke Netlify

### **Metode 1: Deploy dengan Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login ke Netlify
netlify login

# Inisialisasi project
netlify init

# Deploy ke production
netlify deploy --prod
