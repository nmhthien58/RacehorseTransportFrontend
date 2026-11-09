/**
 * @file notificationSound.js
 * @description Phát âm thanh thông báo chuông (chime) nhẹ nhàng, chuyên nghiệp
 * Sử dụng Web Audio API tổng hợp âm thanh 2 âm sắc (D5: 587Hz -> A5: 880Hz)
 * Không phụ thuộc file ngoài, không phát sinh lỗi 404/CORS, không có độ trễ mạng.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Lắng nghe tương tác đầu tiên của người dùng để mở khóa autoplay policy của trình duyệt
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}

/**
 * Phát tiếng chuông thông báo (ting-ting)
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nốt 1: 587.33 Hz (D5) - Âm vang nhẹ
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    // Envelope: Attack nhanh 15ms, Decay 220ms
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Nốt 2: 880 Hz (A5) - Âm cao ngân vang tươi sáng
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.1);

    // Envelope: Attack nhanh 15ms, Decay 380ms
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.32, now + 0.115);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.52);
  } catch (err) {
    // Không làm gián đoạn ứng dụng nếu trình duyệt chặn âm thanh
    console.debug('[notificationSound] Could not play audio chime:', err);
  }
}

export default playNotificationSound;

