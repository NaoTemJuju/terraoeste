/*
 * Módulo de áudio e efeitos sonoros
 *
 * Centraliza a definição de window.sfx, a lógica de música ambiente e
 * os sons associados a rolagens de dados. O estado de mudo da
 * música é persistido via localStorage para que a preferência do
 * usuário seja mantida entre recarregamentos.
 */
(function(){
  // =====================
  // Helper de efeitos sonoros
  // =====================
  window.sfx = (() => {
    function play(id, { volume = 0.7, overlap = true } = {}) {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        if (overlap) {
          const c = el.cloneNode(true);
          c.volume = volume;
          c.play().catch(() => {});
        } else {
          el.pause?.();
          el.currentTime = 0;
          el.volume = volume;
          el.play().catch(() => {});
        }
      } catch {}
    }
    return { play };
  })();

  // =====================
  // Música ambiente
  // =====================
  /**
   * Alterna a reprodução da música ambiente, persistindo a
   * preferência de mudo em localStorage. Inicia a música em volume
   * baixo para evitar sustos.
   */
  function toggleMusic(){
    const audio = document.getElementById('bg-music');
    if (!audio) return;
    if (audio.paused){
      audio.volume = 0.3;
      audio.play().catch(() => {});
      try { localStorage.setItem('bg-music-muted', 'false'); } catch {}
    } else {
      audio.pause();
      try { localStorage.setItem('bg-music-muted', 'true'); } catch {}
    }
  }

  // =====================
  // Eventos de inicialização
  // =====================
  document.addEventListener('DOMContentLoaded', () => {
    // === Autoplay da música de fundo ===
    const bgAudio = document.getElementById('bg-music');
    if (bgAudio) {
      // Padrão: tocar, a menos que o usuário tenha salvo como mutado
      let muted = false;
      try {
        const saved = localStorage.getItem('bg-music-muted');
        muted = (saved === 'true');
        if (saved === null) localStorage.setItem('bg-music-muted', 'false');
      } catch { /* sem localStorage, seguimos com padrão (tocar) */ }

      const tryPlay = () => {
        bgAudio.volume = 0.3;
        return bgAudio.play();
      };

      // Se o navegador bloquear autoplay, tocamos na primeira interação
      const resumeOnFirstInteraction = () => {
        const resume = () => {
          tryPlay().finally(() => {
            document.removeEventListener('pointerdown', resume, true);
            document.removeEventListener('keydown', resume, true);
          });
        };
        document.addEventListener('pointerdown', resume, true);
        document.addEventListener('keydown', resume, true);
      };

      if (!muted) {
        tryPlay().catch(() => {
          // Autoplay bloqueado: retoma na primeira interação do usuário
          resumeOnFirstInteraction();
        });
      } else {
        bgAudio.pause();
      }
    }

    // SFX para rolagem de atributos (dados)
    let isPlaying = false;
    const rollBtn = document.getElementById('btnRollAttrs');
    if (rollBtn) {
      rollBtn.addEventListener('click', () => {
        if (!isPlaying) {
          isPlaying = true;
          window.sfx.play('sfx-dice', { volume: 0.4, overlap: false });
          const audioElement = document.getElementById('sfx-dice');
          if (audioElement) {
            audioElement.onended = () => { isPlaying = false; };
          } else {
            setTimeout(() => { isPlaying = false; }, 1000);
          }
        }
      });
    }

    // SFX para rolagem de PV
    const rollPvBtn = document.getElementById('btnRollHP');
    if (rollPvBtn) {
      rollPvBtn.addEventListener('click', () => {
        window.sfx.play('sfx-dicepv', { volume: 0.8, overlap: false });
      });
    }

    // SFX para rolagem de Ouro
    const goldBtn = document.getElementById('btnRollGold');
    if (goldBtn) {
      goldBtn.addEventListener('click', () => {
        window.sfx.play('sfx-dicegold', { volume: 0.7, overlap: false });
      });
    }

    // Botão de música (mute/unmute)
    const btnMusic = document.getElementById('btnToggleMusic');
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        try {
          toggleMusic();
        } catch {}
      });
    }
  });

  // =====================
  // Exposição no namespace global
  // =====================
  if (!window.app) window.app = {};
  window.app.toggleMusic = toggleMusic;
})();
