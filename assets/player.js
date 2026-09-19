(() => {
  'use strict';
  const video = document.getElementById('lesson-video');
  if (!video) return;
  const byId = id => document.getElementById(id);
  const loading = byId('player-loading');
  const error = byId('player-error');
  const resumeNote = byId('resume-note');
  const key = `after-class-position:${video.dataset.lesson || location.pathname}`;
  let storedTime = 0;
  let lastSaved = 0;
  let waitTimer;
  let resumeOffered = false;

  const stopLoading = () => {
    clearTimeout(waitTimer);
    loading.hidden = true;
  };
  const showError = () => {
    stopLoading();
    error.hidden = false;
  };
  const showLoading = () => {
    clearTimeout(waitTimer);
    waitTimer = setTimeout(() => {
      if (!video.error && video.readyState < 3) loading.hidden = false;
    }, 3500);
  };
  const remember = force => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    if (!force && Date.now() - lastSaved < 5000) return;
    lastSaved = Date.now();
    try {
      if (video.ended || video.currentTime > video.duration - 5) localStorage.removeItem(key);
      else if (video.currentTime > 3) localStorage.setItem(key, String(Math.floor(video.currentTime)));
    } catch (_) { /* Playback remains available if browser storage is unavailable. */ }
  };
  const offerResume = () => {
    if (resumeOffered || !Number.isFinite(video.duration)) return;
    resumeOffered = true;
    if (storedTime <= 10 || storedTime >= video.duration - 10) return;
    const minutes = Math.floor(storedTime / 60);
    const seconds = String(Math.floor(storedTime % 60)).padStart(2, '0');
    byId('resume-message').textContent = `这台设备上次看到 ${minutes}:${seconds}`;
    resumeNote.hidden = false;
  };
  try { storedTime = Math.max(0, Number(localStorage.getItem(key)) || 0); } catch (_) {}
  video.addEventListener('loadstart', showLoading);
  video.addEventListener('waiting', showLoading);
  video.addEventListener('seeking', showLoading);
  ['playing', 'canplay', 'seeked', 'pause', 'ended'].forEach(name => video.addEventListener(name, stopLoading));
  video.addEventListener('loadedmetadata', () => { error.hidden = true; stopLoading(); offerResume(); });
  video.addEventListener('error', showError);
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', showError));
  // Metadata and an error may arrive before this deferred script is evaluated.
  if (video.error) error.hidden = false;
  else if (video.readyState >= 1) offerResume();
  else showLoading();
  byId('retry-video').addEventListener('click', () => {
    error.hidden = true;
    video.load();
    showLoading();
  });
  byId('resume-video').addEventListener('click', () => {
    video.currentTime = storedTime;
    resumeNote.hidden = true;
    video.play().catch(() => { video.focus(); });
  });
  byId('dismiss-resume').addEventListener('click', () => { resumeNote.hidden = true; });
  video.addEventListener('play', () => { resumeNote.hidden = true; });
  video.addEventListener('timeupdate', () => remember(false));
  video.addEventListener('pause', () => remember(true));
  video.addEventListener('ended', () => remember(true));
  window.addEventListener('pagehide', () => remember(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) remember(true); });

  const speed = byId('playback-speed');
  byId('speed-control').hidden = false;
  speed.addEventListener('change', () => { video.playbackRate = Number(speed.value); });

  const copyButton = byId('copy-link');
  const copyStatus = byId('copy-status');
  const fallback = byId('copy-fallback');
  const urlInput = byId('share-url');
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    const url = copyButton.dataset.url || location.href;
    fallback.hidden = true;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      copyStatus.textContent = '本课链接已复制。';
    } catch (_) {
      copyStatus.textContent = '请手动复制下方链接。';
      fallback.hidden = false;
      urlInput.value = url;
      urlInput.focus();
      urlInput.select();
      urlInput.setSelectionRange(0, url.length);
    } finally { copyButton.disabled = false; }
  });
})();
