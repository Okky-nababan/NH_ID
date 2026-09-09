/**
 * Isi ADRT (Anggaran Dasar & Anggaran Rumah Tangga) Naposobulung HKBP
 * Immanuel Dumai periode 2026-2027, diketik ulang dari dokumen resmi
 * (lihat link unduh PDF asli di halaman /dokumen) supaya mudah dibaca
 * langsung di web tanpa perlu buka file terpisah.
 */

export type Pasal = { title: string; points: string[] };
export type Bab = { title: string; pasal: Pasal[] };

export const ADRT_BAB: Bab[] = [
  {
    title: "BAB I — Rumah Tangga Naposobulung HKBP Immanuel Dumai",
    pasal: [
      {
        title: "Pasal 1 — Nama dan Tempat Kedudukan",
        points: [
          "Nama perkumpulan ini adalah Naposobulung HKBP (Huria Kristen Batak Protestan) IMMANUEL Ressort IMMANUEL DUMAI atau disingkat dengan NHKBP Immanuel Dumai.",
          "Alamat perkumpulan ini berada di gereja HKBP IMMANUEL Ressort IMMANUEL DUMAI, Jl. Pulau Mampu Kota Dumai.",
          "Media sosial resmi NHKBP Immanuel Dumai: Instagram @nhkbp_immanuel_dumai dan TikTok @nhkbp_immanuel_dumai.",
        ],
      },
      {
        title: "Pasal 2 — Azas dan Dasar",
        points: [
          "Perkumpulan NHKBP IMMANUEL ini didirikan berdasarkan Azas dan Dasar Firman Tuhan yang Alkitabiah dan pelayanan berdasarkan kasih tali persaudaraan.",
          "Firman Tuhan yang tertulis dalam Galatia 6:2 “Bertolong-tolonglah menanggung bebanmu, demikianlah kamu memenuhi hukum Kristus”.",
        ],
      },
      {
        title: "Pasal 3 — Visi dan Misi",
        points: [
          "Visi: bersatupadu berbakti kepada Tuhan dan menciptakan pemuda/i Gereja yang setia melayani Tuhan dan sesama.",
          "Misi: menunjukkan kasih Kristus dalam hal tolong menolong baik dalam sukacita maupun dukacita kepada sesama anggota NHKBP, sehingga menumbuhkan rasa solidaritas dan toleransi. Setia dalam melayani sesama, menjadikan pemuda/i Kristen yang berwawasan maju, dialogis, serta terbuka dalam melaksanakan tri-tugas Gereja yaitu Koinonia (bersekutu), Marturia (bersaksi), dan Diakonia (melayani).",
        ],
      },
      {
        title: "Pasal 4 — Kegiatan Rutinitas",
        points: [
          "Seluruh kegiatan NHKBP IMMANUEL berada di dalam lingkungan gereja dan luar gereja yang bersifat religi.",
          "Kegiatan NHKBP IMMANUEL diadakan setiap hari Selasa dan Kamis setiap minggunya.",
          "Kegiatan NHKBP IMMANUEL masuk pukul 19.30 WIB dengan jadwal yang sudah ditentukan bersama.",
        ],
      },
      {
        title: "Pasal 5 — Keanggotaan dan Syarat Anggota",
        points: [
          "Pemuda/i yang disebut anggota dalam NHKBP IMMANUEL Ressort IMMANUEL Dumai adalah yang sudah terdaftar dalam kelompok sosial N-HKBP IMMANUEL.",
          "Anggota yang terdaftar dalam NHKBP IMMANUEL wajib aktif 4 kali pertemuan dalam kegiatan pada Pasal 4.",
          "Jika ayat 2 telah dipenuhi maka pengurus berhak memasukkan ke dalam grup WhatsApp NHKBP IMMANUEL.",
          "Anggota NHKBP adalah laki-laki ataupun perempuan yang telah mengakui pengakuan dosa atau naik sidi dan belum pernah menikah.",
          "Anggota yang terdaftar wajib mengisi biodata kepesertaan yang telah diberikan oleh pengurus.",
          "Anggota tidak sedang dalam status aktif pelajar (SMA/SMK).",
          "Anggota tidak dalam ikatan kasus kriminal kepolisian.",
        ],
      },
      {
        title: "Pasal 6 — Kewajiban Anggota",
        points: [
          "Anggota berkewajiban untuk turut menjaga citra dan nama baik perkumpulan sosial NHKBP IMMANUEL.",
          "Anggota saling membantu untuk program kerja pengurus, baik dalam latihan dan kegiatan yang diadakan maupun semua tugas-tugas yang telah ditetapkan.",
          "Anggota berkewajiban mematuhi peraturan yang diatur dalam Anggaran Dasar (AD) dan Anggaran Rumah Tangga (ART) serta ketentuan tata tertib lainnya.",
          "Anggota yang sudah terdaftar harus memberikan informasi kepada pengurus apabila berhalangan mengikuti kegiatan pada Pasal 4.",
          "Anggota berkewajiban membayar iuran bulanan senilai Rp10.000,- (Sepuluh Ribu Rupiah) terhitung sejak bulan bergabung atau sejak dimasukkan ke dalam grup WhatsApp NHKBP IMMANUEL.",
          "Setiap anggota berhak memberikan saran/pendapat/masukan kepada pengurus untuk membangun dan memajukan NHKBP IMMANUEL.",
          "Apabila anggota tidak hadir pada kegiatan Pasal 4 secara berturut-turut sebanyak 8 kali (1 bulan) tanpa alasan yang jelas, pengurus berhak mereview kembali dengan cara yang disepakati bersama seluruh anggota.",
          "Jika hasil review tidak membuahkan hasil, keanggotaan pada ayat 7 dianggap mengundurkan diri sesuai kebijakan pengurus.",
        ],
      },
    ],
  },
  {
    title: "BAB II — Hak Sukacita NHKBP Immanuel",
    pasal: [
      {
        title: "Pasal 7 — Ulang Tahun",
        points: [
          "Apabila anggota berulang tahun dan mengundang resmi NHKBP IMMANUEL melalui pengurus terkait, akan menerima kado senilai Rp100.000,- (Seratus Ribu Rupiah). Hak terpenuhi apabila iuran wajib di 2 bulan terakhir dilunasi.",
          "Apabila anggota berulang tahun tetapi tidak merayakannya, akan dirayakan bersama dengan yang berulang tahun di bulan yang sama pada akhir bulan. Anggaran kue ± Rp200.000,- (Dua Ratus Ribu Rupiah).",
        ],
      },
      {
        title: "Pasal 8 — Graduate Celebration (Kelulusan Kuliah)",
        points: [
          "Apabila salah satu anggota telah menyelesaikan masa pendidikan di bangku kuliah, akan menerima bingkisan/kado dari kas senilai Rp200.000,- (Dua Ratus Ribu Rupiah). Hak terpenuhi apabila iuran wajib di 2 bulan terakhir dilunasi dan ada pemberitahuan/undangan kepada pengurus.",
        ],
      },
      {
        title: "Pasal 9 — Pernikahan",
        points: [
          "Apabila salah satu anggota melangsungkan pernikahan dan mengundang pengurus, NHKBP akan memberikan persembahan lagu dan kado pernikahan senilai Rp300.000,- (Tiga Ratus Ribu Rupiah), dan/atau take and give dari anggota secara sukarela. Hak terpenuhi apabila iuran wajib di 2 bulan terakhir dilunasi.",
          "Apabila jemaat lain/di luar anggota NHKBP mengundang pada pernikahannya, N-HKBP hanya memberikan persembahan lagu (situasional).",
        ],
      },
      {
        title: "Pasal 10 — Lahiran Anak Pertama / Baptisan Anak Pertama",
        points: [
          "Apabila mantan anggota NHKBP pada Pasal 9 dan Pasal 12 melahirkan anak pertama serta mengundang NHKBP IMMANUEL, akan diberikan bingkisan/kado dari kas senilai Rp200.000,- (Dua Ratus Ribu Rupiah) dan melakukan doa bersama.",
        ],
      },
    ],
  },
  {
    title: "BAB III — Hak Dukacita NHKBP Immanuel",
    pasal: [
      {
        title: "Pasal 11 — Sakit dan Kecelakaan",
        points: [
          "Apabila anggota sakit/kecelakaan/opname (Rumah Sakit maupun rawat jalan) selama 3 hari berturut-turut, akan menerima santunan dari kas senilai Rp150.000,- (Seratus Lima Puluh Ribu Rupiah) dan/atau take and give dari anggota secara sukarela, serta kunjungan doa bersama.",
          "Apabila orangtua anggota sakit/kecelakaan/opname selama 3 hari berturut-turut, NHKBP akan mengunjungi dan memberikan buah tangan sebesar Rp100.000,- (Seratus Ribu Rupiah) dan/atau take and give dari anggota secara sukarela.",
          "Bagi anggota yang merantau/di luar wilayah Dumai, hanya dapat dilakukan doa bersama, tetapi hak tetap diberikan.",
          "Hak pada ayat 1 dan 2 hanya dapat diterima dengan rentang waktu minimal 3 bulan dari masa sakit seperti tertera.",
        ],
      },
      {
        title: "Pasal 12 — Perpisahan Anggota",
        points: [
          "Apabila anggota yang telah aktif selama 1 tahun pindah tugas/tempat tinggal ke luar daerah Dumai dalam waktu lama dan berpamitan secara resmi, akan menerima cenderamata dari kas senilai Rp200.000,- (Dua Ratus Ribu Rupiah). Hak terpenuhi apabila iuran wajib di 2 bulan terakhir dilunasi.",
        ],
      },
      {
        title: "Pasal 13 — Meninggal Dunia",
        points: [
          "Apabila anggota meninggal dunia, keluarga besar akan menerima uang santunan duka dari kas senilai Rp1.000.000,- (Satu Juta Rupiah) dan/atau take and give dari anggota secara sukarela.",
          "Apabila orangtua anggota meninggal dunia, keluarga menerima uang duka dari kas senilai Rp500.000,- (Lima Ratus Ribu Rupiah), ditambah bunga duka (papan bunga/bunga salib) atau take and give dari anggota secara sukarela.",
          "Apabila saudara kandung anggota meninggal dunia, keluarga menerima uang duka dari kas senilai Rp200.000,- (Dua Ratus Ribu Rupiah) dan/atau take and give dari anggota secara sukarela.",
        ],
      },
    ],
  },
  {
    title: "BAB IV — Penugasan Pengurus",
    pasal: [
      {
        title: "Pasal 14 — Utusan NHKBP Immanuel",
        points: [
          "Pengurus akan mengutus salah satu anggota untuk menghadiri undangan pernikahan, rapat/kegiatan di luar kota Dumai; utusan menerima akomodasi transportasi senilai Rp300.000,- (Tiga Ratus Ribu Rupiah) sesuai standar/kesepakatan bersama, ditambah biaya sukarela dari NHKBP.",
        ],
      },
    ],
  },
  {
    title: "BAB V — Anggaran Kegiatan NHKBP",
    pasal: [
      {
        title: "Pasal 15 — Perayaan Hari Besar dan Kegiatan Internal",
        points: [
          "Kegiatan Natal: pengurus memberikan sokongan dana dari kas senilai Rp2.000.000,- (Dua Juta Rupiah) kepada panitia terkait, dengan catatan proposal telah disepakati bersama.",
          "Kegiatan internal (Wisata Rohani) sekali 2 tahun: sokongan dana kas senilai Rp2.000.000,- (Dua Juta Rupiah) dengan catatan proposal telah disepakati bersama.",
          "Kegiatan internal lainnya (di luar ayat 1 dan 2): sokongan dana kas senilai Rp500.000,- (Lima Ratus Ribu Rupiah) dengan catatan proposal telah disepakati bersama.",
          "Apabila ada full timer (Pendeta/Bibelvrouw/Diakones) pindah tugas, NHKBP mengadakan acara perpisahan dan memberikan cenderamata dari kas senilai Rp300.000,- (Tiga Ratus Ribu Rupiah) dan/atau take and give dari anggota secara sukarela.",
        ],
      },
    ],
  },
  {
    title: "BAB VI — Sanksi-Sanksi",
    pasal: [
      {
        title: "Pasal 16 — Berakhirnya Keanggotaan",
        points: [
          "Status keanggotaan berakhir apabila: (a) pindah kota/tugas dan tidak dapat mengikuti secara aktif; (b) meninggal dunia; (c) dinyatakan tidak lagi menjadi anggota karena mencemarkan nama baik atau melakukan tindakan tidak layak (RPP, Narkoba, Pencurian, dll.); (d) mengundurkan diri atas permintaan sendiri; (e) berada di Dumai namun tidak aktif selama 2 bulan berturut-turut tanpa alasan jelas (Pasal 6 ayat 7 & 8).",
          "Dengan berakhirnya keanggotaan, segala hak dalam perkumpulan NHKBP tidak berlaku.",
        ],
      },
      {
        title: "Pasal 17 — Sanksi-Sanksi",
        points: [
          "Tidak membayar iuran sosial selama 3 bulan berturut-turut: peringatan lisan.",
          "Tidak membayar iuran sosial selama 5 bulan berturut-turut: peringatan tertulis dan segala hak tidak dipenuhi.",
          "Anggota yang menikah tidak sesuai Firman Tuhan (terkena RPP dari Huria): segala hak yang diatur pada BAB II dan BAB III tidak berlaku.",
          "Anggota tidak aktif selama 2 bulan berturut-turut (Pasal 6 ayat 7 & 8): dianggap nonaktif/keluar dari keanggotaan (Pasal 16 BAB VI).",
        ],
      },
    ],
  },
  {
    title: "BAB VII — Kepengurusan Organisasi",
    pasal: [
      {
        title: "Pasal 18 — Kepengurusan",
        points: [
          "Badan Pengurus Harian terdiri dari: (a) Pengurus inti — Ketua 1, Ketua 2, Ketua 3, Sekretaris, dan Bendahara; (b) Bidang-bidang seksi — seksi kerohanian, seksi koor dan musik, seksi sosial, seksi olahraga, seksi litbang, dan seksi humas.",
          "Masa kepengurusan ditetapkan selama 2 tahun. Pengurus yang masa baktinya berakhir dapat dipilih kembali untuk kedua kalinya.",
          "Semua pengurus bertanggung jawab atas kelangsungan persekutuan.",
          "Pengurus dipilih dan memilih langsung oleh anggota melalui rapat anggota.",
          "Rapat anggota dalam rangka memilih pengurus harus dihadiri minimum 50% + 1 dari jumlah anggota yang aktif.",
          "Sebelum masa bakti pengurus berakhir, bila ada kekosongan maka harus segera ditempatkan penggantinya.",
        ],
      },
    ],
  },
  {
    title: "BAB VIII — Sumber Dana",
    pasal: [
      {
        title: "Pasal 19 — Dana Pemasukan",
        points: [
          "Sumber dana persekutuan berasal dari: iuran kas dari anggota, biaya spontanitas.",
          "Ucapan terimakasih jemaat gereja.",
          "Usaha lainnya.",
        ],
      },
    ],
  },
  {
    title: "BAB IX — Peraturan Tambahan dan Penutup",
    pasal: [
      {
        title: "Pasal 20 — Absensi dan Hak",
        points: [
          "Setiap anggota akan dilakukan absensi untuk setiap kegiatan yang diadakan seksi sosial NHKBP.",
          "Setiap anggota akan dilakukan persentase kehadiran.",
          "Jika jumlah kehadiran kurang dari 75% dari total kegiatan NHKBP yang diadakan, berlaku ketentuan Pasal 6 ayat 7 dan 8.",
        ],
      },
      {
        title: "Pasal 21 — Penutup",
        points: [
          "AD/ART ini dibuat atas dasar kesepakatan bersama dan tidak ada unsur paksaan dari pihak manapun.",
          "Setiap perubahan pasal dan peraturan yang telah disepakati bersama dapat berubah-ubah dan diberitahukan kepada seluruh anggota melalui rapat bersama.",
          "AD/ART ini dibuat untuk dapat dilaksanakan dan dipatuhi bersama.",
        ],
      },
    ],
  },
];

export const ADRT_SIGNATORIES = [
  { role: "Pendamping Naposobulung", name: "Daniel Marpaung" },
  { role: "Pembina Naposobulung", name: "Pdt. Mentari Manalu, S.Th" },
  { role: "Pimpinan Gereja HKBP Immanuel Dumai Ressort Immanuel", name: "Pdt. Bedwin H. Simanjuntak, S.Th." },
];

export type RabSection = { title: string; items: string[] };

export const RAB_SECTIONS: RabSection[] = [
  {
    title: "A. Program Tahunan",
    items: [
      "Bonataon Naposobulung — dilaksanakan maksimal akhir Februari",
      "Paskah — ditangani Seksi Rohani dan Sosial Humas",
      "Valentine — ditangani Seksi Sosial Humas",
      "Parheheon/Godang Naposo — dilaksanakan seluruh seksi",
      "17 Agustus — ditangani Seksi Olahraga",
      "Ibadah Padang — ditangani Seksi Rohani dan Sosial Humas",
      "Natal tahun 2026",
    ],
  },
  {
    title: "B. Program Triwulan",
    items: [
      "Gotong Royong Area Gereja",
      "Kunjungan Kasih",
      "Event Olahraga",
      "Evaluasi Keanggotaan",
      "Kunjungan Pagaran",
    ],
  },
  {
    title: "C. Program Bulanan",
    items: [
      "PA (Pendalaman Alkitab) Gabungan",
      "Ulang Tahun",
      "Ibadah Siang 2x dan Ibadah Sore 2x, bergantian tiap minggu (selang-seling)",
      "Latihan Koor — jadwal Selasa dan Jumat",
    ],
  },
];
