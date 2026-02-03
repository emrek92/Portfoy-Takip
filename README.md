# Portföy Yönetimi

Profesyonel yatırım portföyü takip ve analiz uygulaması. Tauri + React + Rust ile geliştirilmiştir.

## Özellikler

- 📊 **Portföy Takibi**: TEFAS fonları, hisse senetleri, döviz, kripto ve emtia
- 📈 **Performans Analizi**: Günlük, haftalık, aylık ve yıllık getiri hesaplamaları
- 💰 **Gerçek Zamanlı Fiyatlar**: Otomatik piyasa verisi güncelleme
- 📋 **İşlem Geçmişi**: Detaylı alım/satım kayıtları
- 🎨 **Modern Arayüz**: Karanlık tema, animasyonlar ve responsive tasarım

## Gereksinimler

Bu projeyi geliştirmek veya çalıştırmak için aşağıdaki araçların bilgisayarınızda kurulu olması gerekmektedir:

### Temel Araçlar
- [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri)
- [Rust](https://www.rust-lang.org/tools/install) (Backend derlemesi için gereklidir)
- [Git](https://git-scm.com/)

### Windows İçin Gerekli Derleme Araçları
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Kurulum sırasında "Desktop development with C++" seçeneğini işaretleyin.

### Önerilen Geliştirme Ortamı
- [Visual Studio Code](https://code.visualstudio.com/)
- Eklentiler:
  - Rust-analyzer
  - Tauri
  - ES7+ React/Redux/React-Native snippets

## Kurulum

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Teknolojiler

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend**: Rust, Tauri 2, SQLite
- **Veri Kaynakları**: TEFAS API, Canlı Döviz
