document.addEventListener("DOMContentLoaded", () => {
  const LEVEL_NAMES = {
    1: "Ruang Kantor Tua",
    2: "Perpustakaan Rahasia",
    3: "Ruang Tamu Tua"
  };

  const ROOM_TIME_LIMIT = 300;

  const SoundSystem = (() => {
    let audioCtx = null;
    let isMusicMuted = false;
    let isSfxMuted = false;
    let isBgmRunning = false;

    const bgmAudio = new Audio("musik-saya.mp3");
    bgmAudio.loop = true;
    bgmAudio.volume = 0.35;

    const successAudio = new Audio("benar.mp3");
    successAudio.volume = 0.7;

    const errorAudio = new Audio("salah.mp3");
    errorAudio.volume = 0.7;

    const doorAudio = new Audio("buka-pintu.mp3");
    doorAudio.volume = 0.75;

    function initCtx() {
      try {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume();
        }
      } catch (err) {}
    }

    function playTone(freq, duration, type = "sine", vol = 0.08, isBgm = false) {
      if (isBgm && isMusicMuted) return;
      if (!isBgm && isSfxMuted) return;

      initCtx();
      if (!audioCtx) return;

      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration + 0.05);
      } catch (err) {}
    }

    function playSfxFile(audioEl) {
      if (isSfxMuted || !audioEl) return;
      try {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      } catch (err) {}
    }

    function startBGM() {
      initCtx();
      isBgmRunning = true;
      bgmAudio.muted = isMusicMuted;
      bgmAudio.play().catch(() => {});
    }

    function toggleMusic() {
      initCtx();
      isMusicMuted = !isMusicMuted;
      bgmAudio.muted = isMusicMuted;

      if (!isMusicMuted) {
        if (!isBgmRunning) {
          startBGM();
        } else if (bgmAudio.paused) {
          bgmAudio.play().catch(() => {});
        }
      }
      return isMusicMuted;
    }

    function toggleSfx() {
      initCtx();
      isSfxMuted = !isSfxMuted;
      if (!isSfxMuted) {
        playClick();
      }
      return isSfxMuted;
    }

    function playSuccess() {
      playSfxFile(successAudio);
    }

    function playError() {
      playSfxFile(errorAudio);
    }

    function playDoorOpen() {
      playSfxFile(doorAudio);
    }

    function playClick() {
      playTone(460, 0.08, "sine", 0.06, false);
    }

    return {
      startBGM,
      toggleMusic,
      toggleSfx,
      playSuccess,
      playError,
      playDoorOpen,
      playClick
    };
  })();

  const state = {
    playerName: "Pemain",
    currentLevel: 1,
    totalSeconds: ROOM_TIME_LIMIT,
    timerInterval: null,
    isPlaying: false,
    score: 0,
    keys: { A: false, B: false, C: false },
    objectAssignments: {},
    activeObjectId: null
  };

  const startScreen = document.getElementById("start-screen");
  const btnOpenNameModal = document.getElementById("btn-open-name-modal");
  const nameModal = document.getElementById("name-modal");
  const btnCloseName = document.getElementById("btn-close-name");
  const playerNameInput = document.getElementById("player-name");
  const btnStart = document.getElementById("btn-start");

  const pauseModal = document.getElementById("pause-modal");
  const btnPauseMenu = document.getElementById("btn-pause-menu");
  const btnResumeGame = document.getElementById("btn-resume-game");
  const btnExitToMenu = document.getElementById("btn-exit-to-menu");

  const guideModal = document.getElementById("guide-modal");
  const btnCloseGuide = document.getElementById("btn-close-guide");
  const btnCloseGuideBottom = document.getElementById("btn-close-guide-bottom");

  const formulaModal = document.getElementById("formula-modal");
  const btnCloseFormula = document.getElementById("btn-close-formula");
  const btnCloseFormulaBottom = document.getElementById("btn-close-formula-bottom");

  const hud = document.getElementById("hud");
  const hudPlayer = document.getElementById("hud-player");
  const hudLevel = document.getElementById("hud-level");
  const hudTimer = document.getElementById("hud-timer");
  const timerBox = document.getElementById("timer-box");

  const keySlotA = document.getElementById("key-slot-A");
  const keySlotB = document.getElementById("key-slot-B");
  const keySlotC = document.getElementById("key-slot-C");

  const puzzleModal = document.getElementById("puzzle-modal");
  const puzzleTitle = document.getElementById("puzzle-title");
  const puzzleStory = document.getElementById("puzzle-story");
  const puzzleAnswer = document.getElementById("puzzle-answer");
  const puzzleFeedback = document.getElementById("puzzle-feedback");
  const btnSubmitAnswer = document.getElementById("btn-submit-answer");
  const btnClosePuzzle = document.getElementById("btn-close-puzzle");
  const btnHint = document.getElementById("btn-hint");

  const levelClearModal = document.getElementById("level-clear-modal");
  const levelClearTitle = document.getElementById("level-clear-title");
  const levelClearDesc = document.getElementById("level-clear-desc");
  const btnNextLevel = document.getElementById("btn-next-level");

  const endModal = document.getElementById("end-modal");
  const endTitle = document.getElementById("end-title");
  const endSummary = document.getElementById("end-summary");
  const btnRestart = document.getElementById("btn-restart");

  const toastEl = document.getElementById("toast");
  const btnFocusDoor = document.getElementById("btn-focus-door");
  const btnFocusCenter = document.getElementById("btn-focus-center");

  let toastTimeout = null;
  function showToast(msg, duration = 2600) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, duration);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateHUD() {
    if (hudPlayer) hudPlayer.textContent = state.playerName;
    if (hudLevel) hudLevel.textContent = `Level ${state.currentLevel}: ${LEVEL_NAMES[state.currentLevel]}`;
    if (hudTimer) hudTimer.textContent = formatTime(state.totalSeconds);

    if (keySlotA) keySlotA.classList.toggle("collected", state.keys.A);
    if (keySlotB) keySlotB.classList.toggle("collected", state.keys.B);
    if (keySlotC) keySlotC.classList.toggle("collected", state.keys.C);

    if (typeof Room3D !== "undefined") {
      Room3D.updateDoorLocks(state.keys.A, state.keys.B, state.keys.C);
    }
  }

  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (!state.isPlaying) return;
      state.totalSeconds--;
      if (hudTimer) hudTimer.textContent = formatTime(state.totalSeconds);

      if (timerBox) {
        if (state.totalSeconds <= 60) {
          timerBox.classList.add("danger");
        } else {
          timerBox.classList.remove("danger");
        }
      }

      if (state.totalSeconds <= 0) {
        state.totalSeconds = 0;
        endGame(false);
      }
    }, 1000);
  }

  function setupLevel(levelNum) {
    state.currentLevel = levelNum;
    state.totalSeconds = ROOM_TIME_LIMIT;
    state.keys = { A: false, B: false, C: false };
    state.objectAssignments = {};
    state.activeObjectId = null;

    if (timerBox) timerBox.classList.remove("danger");

    if (typeof Room3D !== "undefined") {
      Room3D.buildRoom(levelNum);
      Room3D.focusCamera("center");

      const searchable = [...Room3D.SEARCHABLE_IDS].sort(() => Math.random() - 0.5);
      const chosenObjects = searchable.slice(0, 3);
      const questions = typeof SoalPeluang !== "undefined"
        ? SoalPeluang.getQuestionsForLevel(levelNum)
        : [];
      const keyLabels = ["A", "B", "C"];

      chosenObjects.forEach((objId, idx) => {
        if (questions[idx]) {
          state.objectAssignments[objId] = {
            keyId: keyLabels[idx],
            question: questions[idx],
            solved: false
          };
        }
      });
    }

    updateHUD();
    startTimer();
    showToast(`Level ${levelNum}: ${LEVEL_NAMES[levelNum]}. Waktu 05:00 dimulai! Cari 3 kunci tersembunyi!`);
  }

  function startGame() {
    const inputName = playerNameInput ? playerNameInput.value.trim() : "";
    state.playerName = inputName || "Pemain";
    state.score = 0;
    state.isPlaying = true;

    SoundSystem.startBGM();
    SoundSystem.playClick();

    if (nameModal) nameModal.classList.add("hidden");
    if (pauseModal) pauseModal.classList.add("hidden");
    if (startScreen) startScreen.classList.add("hidden");
    if (hud) hud.classList.remove("hidden");

    setupLevel(1);
  }

  function openPauseModal() {
    if (!state.isPlaying || !pauseModal) return;
    SoundSystem.playClick();
    state.isPlaying = false;
    pauseModal.classList.remove("hidden");
  }

  function resumeGame() {
    if (!pauseModal) return;
    SoundSystem.playClick();
    pauseModal.classList.add("hidden");
    state.isPlaying = true;
  }

  function backToMainMenuFromGame() {
    SoundSystem.playClick();
    state.isPlaying = false;
    state.activeObjectId = null;
    clearInterval(state.timerInterval);

    if (pauseModal) pauseModal.classList.add("hidden");
    if (puzzleModal) puzzleModal.classList.add("hidden");
    if (levelClearModal) levelClearModal.classList.add("hidden");
    if (endModal) endModal.classList.add("hidden");
    if (hud) hud.classList.add("hidden");
    if (startScreen) startScreen.classList.remove("hidden");

    if (typeof Room3D !== "undefined") {
      Room3D.buildRoom(1);
      Room3D.focusCamera("center");
    }
  }

  function handleObjectClick(objectId) {
    if (!state.isPlaying) return;
    SoundSystem.playClick();

    if (objectId === "door") {
      if (state.keys.A && state.keys.B && state.keys.C) {
        Room3D.setObjectOpen("door", true);
        SoundSystem.playDoorOpen();
        clearInterval(state.timerInterval);

        if (state.currentLevel < 3) {
          state.isPlaying = false;
          if (levelClearTitle) levelClearTitle.textContent = `${LEVEL_NAMES[state.currentLevel]} Berhasil Dilewati!`;
          if (levelClearDesc) levelClearDesc.textContent = `Semua kunci terkumpul. Bersiap memasuki ${LEVEL_NAMES[state.currentLevel + 1]} (waktu akan diulang 5 menit)...`;
          if (levelClearModal) levelClearModal.classList.remove("hidden");
        } else {
          state.isPlaying = false;
          Room3D.playExitNatureSequence(() => {
            endGame(true);
          });
        }
      } else {
        const missing = ["A", "B", "C"].filter(k => !state.keys[k]).join(", ");
        showToast(`Pintu terkunci! Kamu masih membutuhkan Kunci ${missing}.`);
      }
      return;
    }

    Room3D.setObjectOpen(objectId, true);

    const assignment = state.objectAssignments[objectId];
    if (!assignment) {
      const objName = Room3D.OBJECT_NAMES[objectId] || "Benda ini";
      showToast(`${objName} kosong. Tidak ada kunci di sini.`);
      return;
    }

    if (assignment.solved) {
      showToast(`Kunci ${assignment.keyId} dari benda ini sudah kamu dapatkan.`);
      return;
    }

    state.activeObjectId = objectId;
    if (puzzleTitle) puzzleTitle.textContent = `Kunci ${assignment.keyId} — ${assignment.question.title}`;
    if (puzzleStory) puzzleStory.textContent = assignment.question.story;
    if (puzzleAnswer) puzzleAnswer.value = "";
    if (puzzleFeedback) {
      puzzleFeedback.textContent = "";
      puzzleFeedback.className = "feedback-text";
    }
    if (puzzleModal) puzzleModal.classList.remove("hidden");
    setTimeout(() => {
      if (puzzleAnswer) puzzleAnswer.focus();
    }, 80);
  }

  function submitAnswer() {
    if (!state.activeObjectId) return;
    const assignment = state.objectAssignments[state.activeObjectId];
    if (!assignment) return;

    const result = SoalPeluang.checkAnswer(puzzleAnswer.value, assignment.question.answer);

    if (puzzleFeedback) {
      puzzleFeedback.textContent = result.message;
      puzzleFeedback.className = `feedback-text ${result.correct ? "success" : "error"}`;
    }

    if (result.correct) {
      SoundSystem.playSuccess();
      assignment.solved = true;
      state.keys[assignment.keyId] = true;
      state.score += 100 * state.currentLevel;
      updateHUD();

      setTimeout(() => {
        if (puzzleModal) puzzleModal.classList.add("hidden");
        state.activeObjectId = null;

        if (state.keys.A && state.keys.B && state.keys.C) {
          showToast("Ketiga kunci lengkap! Klik pintu ruangan untuk keluar!");
          Room3D.focusCamera("door");
        } else {
          showToast(`Kunci ${assignment.keyId} berhasil didapatkan!`);
        }
      }, 950);
    } else {
      SoundSystem.playError();
    }
  }

  function endGame(isWin) {
    state.isPlaying = false;
    clearInterval(state.timerInterval);

    if (isWin) SoundSystem.playSuccess();
    else SoundSystem.playError();

    if (endTitle) {
      endTitle.textContent = isWin ? "SELAMAT! KAMU BERHASIL KELUAR!" : "WAKTU HABIS!";
    }
    if (endSummary) {
      endSummary.textContent = isWin
        ? `Hebat, ${state.playerName}! Kamu berhasil memecahkan seluruh misteri peluang di semua ruangan dan keluar dari rumah tua dengan sisa waktu ${formatTime(state.totalSeconds)} di ruangan terakhir.`
        : `Waktu 5 menit di ${LEVEL_NAMES[state.currentLevel]} telah habis sebelum kamu berhasil membuka pintu. Jangan menyerah, coba lagi!`;
    }
    if (endModal) endModal.classList.remove("hidden");
  }

  if (btnOpenNameModal && nameModal) {
    btnOpenNameModal.addEventListener("click", (e) => {
      e.preventDefault();
      SoundSystem.playClick();
      nameModal.classList.remove("hidden");
      setTimeout(() => {
        if (playerNameInput) playerNameInput.focus();
      }, 60);
    });
  }

  if (btnCloseName && nameModal) {
    btnCloseName.addEventListener("click", () => {
      SoundSystem.playClick();
      nameModal.classList.add("hidden");
    });
  }

  if (btnStart) {
    btnStart.addEventListener("click", (e) => {
      e.preventDefault();
      startGame();
    });
  }

  if (playerNameInput) {
    playerNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startGame();
      }
    });
  }

  if (btnPauseMenu) {
    btnPauseMenu.addEventListener("click", (e) => {
      e.preventDefault();
      openPauseModal();
    });
  }

  if (btnResumeGame) {
    btnResumeGame.addEventListener("click", (e) => {
      e.preventDefault();
      resumeGame();
    });
  }

  if (btnExitToMenu) {
    btnExitToMenu.addEventListener("click", (e) => {
      e.preventDefault();
      backToMainMenuFromGame();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const isHudVisible = hud && !hud.classList.contains("hidden");
      const isPuzzleOpen = puzzleModal && !puzzleModal.classList.contains("hidden");
      if (!isHudVisible || isPuzzleOpen) return;

      if (pauseModal && !pauseModal.classList.contains("hidden")) {
        resumeGame();
      } else if (state.isPlaying) {
        openPauseModal();
      }
    }
  });

  document.querySelectorAll(".btn-guide-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      SoundSystem.playClick();
      if (guideModal) guideModal.classList.remove("hidden");
    });
  });

  if (btnCloseGuide && guideModal) {
    btnCloseGuide.addEventListener("click", () => {
      SoundSystem.playClick();
      guideModal.classList.add("hidden");
    });
  }
  if (btnCloseGuideBottom && guideModal) {
    btnCloseGuideBottom.addEventListener("click", () => {
      SoundSystem.playClick();
      guideModal.classList.add("hidden");
    });
  }

  document.querySelectorAll(".btn-formula-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      SoundSystem.playClick();
      if (formulaModal) formulaModal.classList.remove("hidden");
    });
  });

  if (btnCloseFormula && formulaModal) {
    btnCloseFormula.addEventListener("click", () => {
      SoundSystem.playClick();
      formulaModal.classList.add("hidden");
    });
  }
  if (btnCloseFormulaBottom && formulaModal) {
    btnCloseFormulaBottom.addEventListener("click", () => {
      SoundSystem.playClick();
      formulaModal.classList.add("hidden");
    });
  }

  document.querySelectorAll(".btn-music-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const muted = SoundSystem.toggleMusic();
      document.querySelectorAll(".btn-music-trigger").forEach(b => {
        b.textContent = muted ? "🎵 Musik: Mati" : "🎵 Musik: Nyala";
        b.classList.toggle("muted-state", muted);
      });
    });
  });

  document.querySelectorAll(".btn-sfx-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const muted = SoundSystem.toggleSfx();
      document.querySelectorAll(".btn-sfx-trigger").forEach(b => {
        b.textContent = muted ? "🔇 Suara: Mati" : "🔊 Suara: Nyala";
        b.classList.toggle("muted-state", muted);
      });
    });
  });

  if (btnSubmitAnswer) {
    btnSubmitAnswer.addEventListener("click", submitAnswer);
  }
  if (puzzleAnswer) {
    puzzleAnswer.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitAnswer();
      }
    });
  }
  if (btnClosePuzzle && puzzleModal) {
    btnClosePuzzle.addEventListener("click", () => {
      SoundSystem.playClick();
      puzzleModal.classList.add("hidden");
      state.activeObjectId = null;
    });
  }
  if (btnHint) {
    btnHint.addEventListener("click", () => {
      SoundSystem.playClick();
      if (!state.activeObjectId) return;
      const assignment = state.objectAssignments[state.activeObjectId];
      if (assignment && puzzleFeedback) {
        puzzleFeedback.textContent = `Petunjuk: ${assignment.question.hint}`;
        puzzleFeedback.className = "feedback-text hint";
      }
    });
  }

  if (btnNextLevel && levelClearModal) {
    btnNextLevel.addEventListener("click", () => {
      SoundSystem.playClick();
      levelClearModal.classList.add("hidden");
      state.isPlaying = true;
      setupLevel(state.currentLevel + 1);
    });
  }

  if (btnRestart && endModal) {
    btnRestart.addEventListener("click", () => {
      SoundSystem.playClick();
      endModal.classList.add("hidden");
      state.score = 0;
      state.isPlaying = true;
      setupLevel(1);
    });
  }

  if (btnFocusDoor) {
    btnFocusDoor.addEventListener("click", () => {
      SoundSystem.playClick();
      Room3D.focusCamera("door");
    });
  }
  if (btnFocusCenter) {
    btnFocusCenter.addEventListener("click", () => {
      SoundSystem.playClick();
      Room3D.focusCamera("center");
    });
  }

  try {
    if (typeof Room3D !== "undefined") {
      Room3D.init(handleObjectClick);
    }
  } catch (err) {
    console.error("Gagal memuat scene 3D:", err);
  }
});