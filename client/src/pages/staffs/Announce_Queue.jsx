

import { useState } from "react";

const ANNOUNCE_COOLDOWN = 4100;

 const getVoice = (voices) => {
    const ziraVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("zira") ||
        voice.name === "Microsoft Zira Desktop" ||
        voice.name === "Microsoft Zira"
    );

    if (ziraVoice) {
      return ziraVoice;
    }

    const fallbackVoice =
      voices.find(
        (voice) => voice.lang.includes("en") && voice.name.includes("Microsoft")
      ) || voices.find((voice) => voice.lang.includes("en-US"));

    if (fallbackVoice) {
      return fallbackVoice;
    }

    throw new Error("No suitable voice found");
  };

 const configureSpeech = (text, voice) => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 0.8;
    speech.pitch = 1;
    speech.voice = voice;
    return speech;
  };

 const loadVoices = async () => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      await new Promise((resolve) => {
        window.speechSynthesis.onvoiceschanged = resolve;
      });
      voices = window.speechSynthesis.getVoices();
    }
    return voices;
  };
 const speak = (speech) => {
    return new Promise((resolve, reject) => {
      speech.onend = resolve;
      speech.onerror = reject;
      window.speechSynthesis.speak(speech);
    });
  };

export const AnnounceQueue = async (nextQueueNo) => {
  try {
    window.speechSynthesis.cancel();
    const voices = await loadVoices();
    const selectedVoice = getVoice(voices);
    const speechText = `Queue number ${nextQueueNo}, please proceed to Window 1`;
    const speech = configureSpeech(speechText, selectedVoice);
    await speak(speech);
  } catch (error) {
    console.error("Announcement failed:", error);
  }
};

export const handleButtonClick = (callback, disabledForSeconds, lastAnnounceTime, setDisabledForSeconds, setLastAnnounceTime) => {
  const now = Date.now();
  
  // Check if browser supports speech synthesis
  if (!("speechSynthesis" in window)) {
    alert("Speech synthesis not supported in this browser");
    return;
  }

  // Check cooldown
  if (disabledForSeconds || now - lastAnnounceTime < ANNOUNCE_COOLDOWN) {
    return;
  }

  // Execute callback
  setDisabledForSeconds(true);
  setLastAnnounceTime(now);
  callback();
  
  // Reset disabled state after cooldown
  const timer = setTimeout(() => {
    setDisabledForSeconds(false);
  }, ANNOUNCE_COOLDOWN);
  
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
