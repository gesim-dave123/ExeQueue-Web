import { useState } from "react";

const ANNOUNCE_COOLDOWN = 4100;

// 🔓 Step 1: Unlock speech synthesis after first user tap
export const unlockSpeech = () => {
  try {
    const msg = new SpeechSynthesisUtterance("ready");
    msg.volume = 0; // muted
    window.speechSynthesis.speak(msg);
    console.log("🔊 Speech synthesis unlocked by user gesture");
  } catch (err) {
    console.warn("⚠️ Speech unlock failed:", err);
  }
};

// Automatically unlock on first tap (mobile-friendly)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const enableSpeechOnTap = () => {
    unlockSpeech();
    window.removeEventListener("touchstart", enableSpeechOnTap);
    window.removeEventListener("click", enableSpeechOnTap);
  };
  window.addEventListener("touchstart", enableSpeechOnTap);
  window.addEventListener("click", enableSpeechOnTap);
}

// 🗣️ Step 2: Voice handling utilities
const getVoice = (voices) => {
  const zira = voices.find((v) =>
    ["zira", "Microsoft Zira"].some((name) =>
      v.name.toLowerCase().includes(name.toLowerCase())
    )
  );
  if (zira) return zira;

  const englishVoice =
    voices.find((v) => v.lang.includes("en-US")) ||
    voices.find((v) => v.lang.includes("en"));
  return englishVoice || voices[0];
};

const configureSpeech = (text, voice) => {
  const s = new SpeechSynthesisUtterance(text);
  s.volume = 1;
  s.rate = 0.8;
  s.pitch = 1;
  s.voice = voice;
  return s;
};

const loadVoices = async () => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    window.speechSynthesis.onvoiceschanged = () =>
      resolve(window.speechSynthesis.getVoices());
  });
};

const speak = (speech) =>
  new Promise((resolve, reject) => {
    speech.onend = resolve;
    speech.onerror = reject;
    window.speechSynthesis.speak(speech);
  });

// 📣 Step 3: The actual announcer
export const AnnounceQueue = async (nextQueueNo, windowName = "Window 1") => {
  try {
    // Safari iOS fix: small delay ensures voices loaded
    await new Promise((r) => setTimeout(r, 250));

    const voices = await loadVoices();
    if (!voices.length) {
      console.warn("⚠️ No voices available on this device");
      return;
    }

    const selectedVoice = getVoice(voices);
    const text = `Queue number ${nextQueueNo}, please proceed to ${windowName}`;

    const speech = configureSpeech(text, selectedVoice);
    window.speechSynthesis.cancel(); // stop overlapping voices
    await speak(speech);
  } catch (error) {
    console.error("📢 Announcement failed:", error);
  }
};

// 🕒 Cooldown button handler
export const handleButtonClick = (
  callback,
  disabledForSeconds,
  lastAnnounceTime,
  setDisabledForSeconds,
  setLastAnnounceTime
) => {
  const now = Date.now();
  if (!("speechSynthesis" in window)) {
    alert("Speech synthesis not supported in this browser");
    return;
  }
  if (disabledForSeconds || now - lastAnnounceTime < ANNOUNCE_COOLDOWN) return;
  setDisabledForSeconds(true);
  setLastAnnounceTime(now);
  callback();
  const timer = setTimeout(
    () => setDisabledForSeconds(false),
    ANNOUNCE_COOLDOWN
  );
  return () => clearTimeout(timer);
};

export const useAnnounceQueueStates = () => {
  const [lastAnnounceTime, setLastAnnounceTime] = useState(0);
  const [disabledForSeconds, setDisabledForSeconds] = useState(false);
  return {
    lastAnnounceTime,
    setLastAnnounceTime,
    disabledForSeconds,
    setDisabledForSeconds,
  };
};
