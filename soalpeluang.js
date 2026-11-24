const SoalPeluang = (() => {
  const BANK_SOAL = {
    // Soal Level 1
    1: [
      {
        id: "L1_Q1",
        title: "Berkas di Laci Meja Kantor",
        story: "Di dalam laci meja kantor terdapat 10 map berkas yang terdiri dari 3 map merah dan 7 map biru. Jika diambil 1 map secara acak, berapa peluang terambilnya map merah? (Tulis dalam bentuk pecahan paling sederhana, contoh: 3/10)",
        answer: "3/10",
        hint: "Peluang = n(A) / n(S)"
      },
      {
        id: "L1_Q2",
        title: "Dadu Kayu di Atas Meja",
        story: "Sebuah dadu bersisi 6 dilemparkan satu kali di atas meja kantor. Berapa peluang munculnya mata dadu bilangan genap? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/2",
        hint: "Peluang = n(A) / n(S), tentukan dulu mata dadu genap lalu sederhanakan pecahannya."
      },
      {
        id: "L1_Q3",
        title: "Gantungan Kunci Brankas",
        story: "Di dalam kotak kunci terdapat 8 anak kunci, dan hanya 2 anak kunci yang dapat membuka brankas besi. Jika diambil 1 kunci secara acak, berapa peluang terambil kunci yang cocok? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/4",
        hint: "Peluang = n(A) / n(S), jangan lupa sederhanakan pecahannya."
      },
      {
        id: "L1_Q4",
        title: "Koin Tua di Peti Kayu",
        story: "Sekeping koin kuno memiliki dua sisi: Angka (A) dan Gambar (G). Jika koin tersebut dilempar satu kali, berapa peluang munculnya sisi Gambar? (Tulis dalam bentuk pecahan)",
        answer: "1/2",
        hint: "Peluang = n(A) / n(S)"
      },
      {
        id: "L1_Q5",
        title: "Stempel di Rak Arsip",
        story: "Dalam kotak alat tulis terdapat 12 pulpen, 4 di antaranya bertinta hitam dan sisanya bertinta biru. Berapa peluang terambilnya 1 pulpen bertinta hitam secara acak? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/3",
        hint: "Peluang = n(A) / n(S), lalu bagi pembilang dan penyebut dengan FPB-nya."
      },
      {
        id: "L1_Q6",
        title: "Kartu Nomor Loker",
        story: "Terdapat 9 kartu bernomor 1 sampai 9 di dalam kotak surat. Jika diambil 1 kartu secara acak, berapa peluang terambilnya kartu bernomor kelipatan 3? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/3",
        hint: "Peluang = n(A) / n(S), cari bilangan 1 sampai 9 yang habis dibagi 3."
      }
    ],

    // Soal Level 2
    2: [
      {
        id: "L2_Q1",
        title: "Dua Koin di Meja Baca",
        story: "Dua keping koin logam dilemparkan secara bersamaan di atas meja perpustakaan. Berapa peluang munculnya kedua sisi Angka (AA)? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/4",
        hint: "Daftarkan seluruh pasangan sisi dari 2 koin sebagai n(S), lalu gunakan P(A) = n(A) / n(S)."
      },
      {
        id: "L2_Q2",
        title: "Manuskrip Bukan Bahasa Latin",
        story: "Di rak buku klasik terdapat 15 buku kuno, 6 di antaranya berbahasa Latin dan sisanya berbahasa Yunani. Jika diambil 1 buku secara acak, berapa peluang terambil buku yang BUKAN berbahasa Latin? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "3/5",
        hint: "Gunakan peluang komplemen P(A') = 1 - P(A) atau hitung sisa buku selain bahasa Latin terlebih dahulu."
      },
      {
        id: "L2_Q3",
        title: "Dua Dadu Penjaga Rak",
        story: "Dua buah dadu bersisi 6 dilemparkan bersamaan. Berapa peluang munculnya mata dadu berjumlah 9? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/9",
        hint: "Ruang sampel dua dadu adalah n(S) = 6 x 6. Cari pasangan mata dadu yang jumlahnya 9, lalu sederhanakan."
      },
      {
        id: "L2_Q4",
        title: "Bola Kaca di Dua Wadah",
        story: "Kotak A berisi 2 bola merah dan 3 bola putih. Kotak B berisi 1 bola merah dan 3 bola putih. Jika diambil 1 bola dari masing-masing kotak, berapa peluang keduanya berwarna merah? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/10",
        hint: "Kejadian saling bebas: P(A ∩ B) = P(A) x P(B)."
      },
      {
        id: "L2_Q5",
        title: "Kode Kartu Huruf Rahasia",
        story: "Dari kartu-kartu yang membentuk kata 'PUSTAKA' (7 huruf), diambil 1 kartu secara acak. Berapa peluang terambilnya kartu huruf vokal (A atau U)? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "3/7",
        hint: "Hitung banyak huruf vokal pada kata PUSTAKA, lalu bagi dengan total seluruh huruf."
      },
      {
        id: "L2_Q6",
        title: "Lilin dan Koin Katalog",
        story: "Sebuah dadu bersisi 6 dan sekeping koin dilempar bersamaan. Berapa peluang munculnya mata dadu kurang dari 3 DAN sisi Gambar pada koin? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/6",
        hint: "Gunakan rumus kejadian saling bebas: P(A ∩ B) = P(dadu < 3) x P(koin Gambar)."
      }
    ],

    // Soal Level 3
    3: [
      {
        id: "L3_Q1",
        title: "Cangkir Teh Antik Tanpa Pengembalian",
        story: "Di dalam lemari bufet terdapat 4 cangkir porselen putih dan 6 cangkir keramik cokelat. Jika diambil 2 cangkir satu per satu TANPA pengembalian, berapa peluang kedua cangkir yang terambil berwarna putih? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "2/15",
        hint: "Tanpa pengembalian: P(A ∩ B) = P(A) x P(B | A). Total benda dan cangkir putih berkurang 1 pada pengambilan kedua."
      },
      {
        id: "L3_Q2",
        title: "Tiga Koin di Depan Perapian",
        story: "Tiga keping koin dilemparkan secara bersamaan. Berapa peluang munculnya tepat 2 sisi Gambar dan 1 sisi Angka? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "3/8",
        hint: "Total ruang sampel 3 koin adalah n(S) = 2^3. Susun kombinasi urutan yang memuat tepat dua G dan satu A."
      },
      {
        id: "L3_Q3",
        title: "Dua Dadu Jam Pendulum",
        story: "Dua buah dadu dilempar bersamaan. Berapa peluang munculnya kedua mata dadu yang hasil kalinya sama dengan 12? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "1/9",
        hint: "Cari semua pasangan bilangan 1 sampai 6 yang hasil kalinya 12, bagi banyaknya dengan n(S) dua dadu, lalu sederhanakan."
      },
      {
        id: "L3_Q4",
        title: "Peti Kunci Emas dan Perak",
        story: "Sebuah peti berisi 5 kunci emas dan 3 kunci perak. Jika diambil 2 kunci sekaligus secara acak, berapa peluang terambil 1 kunci emas dan 1 kunci perak? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "15/28",
        hint: "Gunakan rumus kombinasi: P(A) = [C(n1, r1) x C(n2, r2)] / C(total, 2)."
      },
      {
        id: "L3_Q5",
        title: "Pengambilan Bola Berbeda Warna",
        story: "Dalam guci ruang tamu terdapat 3 bola merah dan 4 bola biru. Diambil 2 bola satu per satu tanpa pengembalian. Berapa peluang terambilnya bola pertama merah DAN bola kedua biru? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "2/7",
        hint: "Gunakan aturan tanpa pengembalian: P(Merah 1) x P(Biru 2 | Merah 1), lalu sederhanakan hasilnya."
      },
      {
        id: "L3_Q6",
        title: "Brankas Utama Pintu Keluar",
        story: "Dua buah dadu bersisi 6 dilemparkan secara bersamaan. Berapa peluang munculnya jumlah kedua mata dadu merupakan bilangan prima kurang dari 6? (Tulis dalam bentuk pecahan paling sederhana)",
        answer: "7/36",
        hint: "Tentukan bilangan prima yang kurang dari 6 terlebih dahulu, lalu hitung seluruh pasangan mata dadu yang menghasilkan jumlah tersebut."
      }
    ]
  };

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  function getQuestionsForLevel(level) {
    const list = BANK_SOAL[level] || BANK_SOAL[1];
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  function checkAnswer(userInput, expectedAnswer) {
    const cleaned = (userInput || "").trim().replace(/\s+/g, "");

    if (!cleaned) {
      return {
        valid: false,
        correct: false,
        message: "Masukkan jawaban dalam bentuk pecahan terlebih dahulu (contoh: 1/2)."
      };
    }

    if (cleaned.includes(".") || cleaned.includes(",")) {
      return {
        valid: false,
        correct: false,
        message: "Jawaban tidak boleh dalam bentuk desimal! Tuliskan dalam bentuk pecahan (contoh: 3/10)."
      };
    }

    const match = cleaned.match(/^(\d+)\/(\d+)$/);
    if (!match) {
      return {
        valid: false,
        correct: false,
        message: "Format harus berupa pecahan a/b (contoh: 1/4 atau 7/36)."
      };
    }

    const num = parseInt(match[1], 10);
    const den = parseInt(match[2], 10);

    if (den === 0) {
      return {
        valid: false,
        correct: false,
        message: "Penyebut pecahan tidak boleh nol (0)."
      };
    }

    const [expNum, expDen] = expectedAnswer.split("/").map(Number);

    if (num * expDen === expNum * den && gcd(num, den) > 1) {
      return {
        valid: false,
        correct: false,
        message: "Nilainya sudah benar, tetapi pecahan belum paling sederhana! Sederhanakan pecahanmu."
      };
    }

    if (num === expNum && den === expDen) {
      return {
        valid: true,
        correct: true,
        message: "Tepat sekali! Jawaban pecahanmu benar dan paling sederhana."
      };
    }

    return {
      valid: true,
      correct: false,
      message: "Jawaban belum tepat. Periksa kembali ruang sampel dan titik sampelnya!"
    };
  }

  return {
    BANK_SOAL,
    getQuestionsForLevel,
    checkAnswer
  };
})();