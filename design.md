# rnm (readnmove) - Design System & Specification

Dokumen ini berfungsi sebagai acuan utama (*design brain*) untuk seluruh elemen visual, tata letak, dan logika interaksi aplikasi **rnm (readnmove)** berbasis **Liquid Glass Design Language**.

---

## 1. Sistem Warna & Tema (Color Palette)

Aplikasi ini menggunakan palet warna biru tergradasi (*dynamic sapphire to ice gradient*) yang memberikan kesan sejuk, profesional, dan futuristik.

| Nama Warna | Kode Hex | Penggunaan Visual |
| :--- | :--- | :--- |
| **Deep Sapphire Blue** | `#0A192F` | Gradasi latar belakang (Atas / Sisi Gelap) |
| **Light Ice Blue** | `#E2F1FF` | Gradasi latar belakang (Bawah / Sisi Terang) |
| **Mental Glass (Left)** | `rgba(10, 25, 47, 0.35)` | Kaca gelap transparan untuk area "Olah Otak" |
| **Physical Glass (Right)** | `rgba(226, 241, 255, 0.25)` | Kaca terang transparan untuk area "Olahraga" |
| **Highlight Blue** | `#007AFF` | Tombol aktif, grafik, aksen utama |
| **Glass Border** | `rgba(255, 255, 255, 0.3)` | Efek bias tepi kaca (Specular highlight) |
| **Glass Shadow** | `rgba(0, 0, 0, 0.15)` | Drop shadow halus untuk efek kedalaman kaca melayang |

---

## 2. Struktur Tata Letak & Geometri (Concentricity)

Mengikuti panduan kelengkungan layar iPhone 15, rasio lengkungan sudut menggunakan prinsip konsentris agar terlihat proporsional dan tidak kaku.

*   **iPhone Frame Container:** Radius kelengkungan `40px` (meniru lekukan fisik bezel iPhone 15).
*   **Modul / Card Utama:** Radius kelengkungan `24px` (berada di dalam frame).
*   **Tombol & Input Dalam:** Radius kelengkungan `12px` - `16px`.
*   **Bottom Navigation Bar:** Radius kelengkungan `30px` dengan margins melayang (*floating margins*).

```text
[ Bezel iPhone: Radius 40px ]
       └── [ Kontainer Kaca: Radius 24px ]
                     └── [ Input / Tombol: Radius 12px ]
```

---

## 3. Desain Antarmuka Utama (Main Home Screen)

Halaman utama merupakan **Halaman Pencatatan Note Baru** yang terbagi secara vertikal:

```
+----------------------------------------+
|               DualSphere               |
|                                        |
|  [olah otak]      |     [olahraga]     |
|                   |                    |
|  - Catatan A      |    - Latihan X     |
|  - Catatan B      |    - Latihan Y     |
|                   |                    |
|                   O (Deadpool)         |
|                   |                    |
|  [+ Tulis Note]   |    [+ Tulis Note]  |
|                   |                    |
|                                        |
|      +--------------------------+      |
|      +--------------------------+      |
+----------------------------------------+
```

### Detil Elemen Utama:
*   **Left Section (Olah Otak):** Didominasi oleh teks kontras tinggi warna putih di atas kaca safir gelap.
*   **Right Section (Olahraga):** Didominasi oleh teks navy gelap di atas kaca biru muda terang.
*   **Center Separator:** Garis pemisah setebal `1px` berwarna putih transparan. Di tengah garis ini terdapat pembatas lingkaran berisi gambar **Deadpool (`icon.jpg`)** dengan frame kaca tebal dan pendaran cahaya.
*   **Bottom Navigation:** Kontainer kaca transparan melayang di bagian bawah dengan 3 ikon fungsional yang dibuat menggunakan **Inline SVG** (bukan stiker gambar luar) agar tetap tajam, ringan, dan dapat diwarnai secara dinamis melalui CSS.
*   **UI Icons:** Seluruh ikon navigasi (Kembali `<-`, Budget, Chart, Folder) menggunakan kode **SVG bawaan (inline)** agar bersih, cepat dimuat, dan konsisten secara visual.


---

## 4. Logika Navigasi & Gestur (Gesture Logic)

Aplikasi memiliki dua alur navigasi utama:
1.  **Tab Navigation (Bottom-to-Top Slide):**
    *   Mengklik ikon **Budgeting**, **Activity Tracking**, atau **Completed Notes** pada bar bawah akan memicu pergeseran halaman (*slide transition*) yang menutup halaman utama dan menampilkan sub-page yang dipilih.
2.  **Back Navigation (Top-to-Bottom / Swipe Back):**
    *   Ketika berada di salah satu sub-page, tombol panah kembali (`<-`) akan muncul di kiri atas.
    *   Pengguna dapat mengklik tombol tersebut **atau** melakukan geseran usapan (*swipe gesture*) dari kiri ke kanan di layar untuk mengembalikan halaman ke Tampilan Utama (Halaman Pencatatan Note).

---

## 5. Spesifikasi Fungsional Sub-Pages

### A. Page 1: Budgeting
*   **Fungsi:** Pencatatan anggaran/pengeluaran finansial sederhana bertema kaca.
*   **UI:** Kartu saldo total (*glassmorphic card*) + formulir input transaksi (pemasukan/pengeluaran) + riwayat transaksi berupa list transparan.

### B. Page 2: Activity Tracking
*   **Fungsi:** Pelacakan aktivitas fisik & mental harian.
*   **UI:** Grafik batang vertikal (*visual progress bars*) yang menampilkan persentase penyelesaian target harian (misal: Air minum, Olahraga, Belajar, Meditasi).

### C. Page 3: Completed Notes
*   **Fungsi:** Arsip catatan yang sudah diselesaikan.
*   **UI:** Daftar catatan olahraga & otak yang telah dicentang selesai di Halaman Utama. Pengguna dapat melihat riwayat catatan yang telah tersimpan rapi.

---

## 6. Efek Kaca Cair & Mikro-Interaksi (Liquid Glass Effects)

Untuk memberikan kesan premium dan "hidup", efek visual berikut diterapkan:
*   **Micro-Scaling:** Semua tombol dan kartu interaktif akan mengecil secara halus sebesar `0.95x` saat ditekan (`active` state) dengan transisi mulus `0.15 detik`.
*   **Shimmering Highlight:** Lapisan pendaran cahaya putih semi-transparan menyapu tombol saat disentuh untuk mensimulasikan refleksi cahaya pada kaca nyata.
*   **Backdrop Blur:** Nilai `backdrop-filter: blur(20px)` konstan digunakan untuk semua kontainer kaca agar konten di belakangnya membaur dengan elegan tanpa mengaburkan teks.
*   **WCAG 2.1 Contrast Guarantee:** Semua teks memiliki rasio kontras warna terhadap latar belakang kacanya minimal sebesar **4.5:1** (Menggunakan teks putih untuk kaca gelap, dan teks Navy gelap `#061224` untuk kaca terang).
