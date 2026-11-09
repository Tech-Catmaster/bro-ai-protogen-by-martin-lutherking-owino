/* =========================================================
   PROTOGEN AI — MAIN SCRIPT
   Apple-style orb | Continuous voice | Synchronized answers
   ========================================================= */

"use strict";

/* =========================================================
   HTML ELEMENTS
========================================================= */

const assistant = document.getElementById("assistant");
const greeting = document.getElementById("greeting");
const headline = document.getElementById("headline");
const statusText = document.getElementById("status");
const conversation = document.getElementById("conversation");
const composer = document.getElementById("composer");
const questionInput = document.getElementById("question");
const chatButton = document.getElementById("chatButton");
const voiceButton = document.getElementById("voiceButton");
const stopButton = document.getElementById("stopButton");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const speechSupported = "speechSynthesis" in window;

/* =========================================================
   APPLICATION STATE
========================================================= */

let recognition = null;

let isListening = false;
let autoListenEnabled = false;
let requestInProgress = false;
let speechActive = false;

let chatHistory = [];
let selectedVoice = null;

let currentAudio = null;
let currentAudioUrl = null;
let currentAudioCancel = null;
let currentBrowserCancel = null;

let speechGeneration = 0;
let chatAbortController = null;

let silenceTimer = null;
let listeningRestartTimer = null;

/* =========================================================
   REQUIRED ELEMENT CHECK
========================================================= */

if (
  !assistant ||
  !statusText ||
  !conversation ||
  !composer ||
  !questionInput ||
  !voiceButton
) {
  console.error("PROTOGEN: Required HTML elements are missing.");
}

/* =========================================================
   ASSISTANT STATE
========================================================= */

function setState(state, message = "") {
  if (!assistant || !statusText) return;

  assistant.classList.remove(
    "listening",
    "thinking",
    "speaking"
  );

  if (state) {
    assistant.classList.add(state);
  }

  statusText.textContent = message;
}

/* =========================================================
   COMPOSER VISIBILITY
   The typing box stays hidden unless the text icon is pressed.
========================================================= */

function hideComposer() {
  if (!composer) return;

  composer.hidden = true;
  composer.setAttribute("aria-hidden", "true");
  composer.style.setProperty("display", "none", "important");

  if (assistant) {
    assistant.classList.remove("typing");
  }
}

function showComposer() {
  if (!composer) return;

  composer.hidden = false;
  composer.removeAttribute("aria-hidden");
  composer.style.removeProperty("display");

  if (assistant) {
    assistant.classList.add("typing");
  }

  questionInput.focus({
    preventScroll: true
  });
}

/* =========================================================
   TEXT ICON
   Press once to show the composer.
   Press again to hide it.
========================================================= */

if (chatButton) {
  chatButton.addEventListener("click", () => {
    if (composer.hidden) {
      showComposer();
    } else {
      hideComposer();
    }
  });
}

/* Keep the composer hidden when PROTOGEN first loads. */
hideComposer();

/* =========================================================
   ANSWER DISPLAY
   Text appears in groups of two sentences.
   Each group is displayed when its audio is about to play.
========================================================= */

function styleAnswerBubble(bubble) {
  if (!bubble) return;

  bubble.style.fontSize = "16px";
  bubble.style.fontWeight = "800";
  bubble.style.lineHeight = "1.5";
  bubble.style.textAlign = "center";
  bubble.style.width = "100%";
  bubble.style.maxWidth = "100%";
  bubble.style.margin = "0 auto";
  bubble.style.opacity = "1";
  bubble.style.transition = "none";
}

function addMessage(text, role, provider = "") {
  if (!conversation || role !== "bot") return null;

  const bubble = createAnswerDisplay(provider);

  if (!bubble) return null;

  bubble.dataset.completeAnswer = String(text || "").trim();
  bubble.textContent = bubble.dataset.completeAnswer;

  conversation.replaceChildren(bubble);
  conversation.scrollTop = conversation.scrollHeight;

  return bubble;
}

function createAnswerDisplay(provider = "") {
  if (!conversation) return null;

  const bubble = document.createElement("div");

  bubble.className = "message bot";
  bubble.textContent = "";
  bubble.setAttribute("role", "status");
  bubble.dataset.completeAnswer = "";

  if (provider) {
    bubble.dataset.provider = provider;
  }

  bubble.title = "Click to hear the answer again";

  styleAnswerBubble(bubble);

  bubble.addEventListener("click", () => {
    const completeAnswer = bubble.dataset.completeAnswer;

    if (completeAnswer) {
      speak(completeAnswer, bubble);
    }
  });

  // Do not display the bubble yet.
  return bubble;
}

function appendAnswerGroup(bubble, group) {
  if (!bubble || !group) return;

  styleAnswerBubble(bubble);

  // Display only the current two-sentence group.
  bubble.textContent = group;

  if (conversation && !bubble.isConnected) {
    conversation.replaceChildren(bubble);
  }

  conversation.scrollTop = conversation.scrollHeight;
}

async function hideAnswerGroup(bubble, generation) {
  if (!bubble || generation !== speechGeneration) return;

  // Start the five-second countdown only after the audio has finished.
  await new Promise(resolve => setTimeout(resolve, 5000));

  if (generation !== speechGeneration) return;

  // Completely remove the answer group from the page.
  if (bubble.isConnected) {
    bubble.remove();
  }
}

/* =========================================================
   VOICE SELECTION
========================================================= */

function chooseMaleVoice() {
  if (!speechSupported) return null;

  const voices = window.speechSynthesis.getVoices();

  const english = voices.filter(voice =>
    /^en([-_]|$)/i.test(voice.lang)
  );

  const preferred = [
    /microsoft.*(guy|ryan|david|mark|james|christopher)/i,
    /\b(guy|ryan|david|daniel|alex|fred|tom|james)\b/i,
    /google.*english/i,
    /microsoft.*english/i
  ];

  for (const pattern of preferred) {
    const match = english.find(voice =>
      pattern.test(voice.name)
    );

    if (match) return match;
  }

  return (
    english.find(voice =>
      /en-US/i.test(voice.lang)
    ) ||
    english[0] ||
    null
  );
}

function loadVoices() {
  selectedVoice = chooseMaleVoice();

  console.log(
    "PROTOGEN browser voice:",
    selectedVoice?.name || "Default voice"
  );
}

if (speechSupported) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/* =========================================================
   CLEAN TEXT BEFORE SPEAKING
========================================================= */

function prepareSpeech(text) {
  let s = String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "the link")
    .replace(/\\\(|\\\)|\\\[|\\\]/g, " ");

  s = s
    .replace(
      /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
      "$1 divided by $2"
    )
    .replace(
      /\\sqrt\s*\{([^{}]+)\}/g,
      "the square root of $1"
    )
    .replace(/\\times\b/g, " multiplied by ")
    .replace(/\\cdot\b/g, " times ")
    .replace(/\\div\b/g, " divided by ")
    .replace(/\\pm\b/g, " plus or minus ")
    .replace(/\\leq?\b/g, " is less than or equal to ")
    .replace(/\\geq?\b/g, " is greater than or equal to ")
    .replace(/\\neq\b/g, " is not equal to ")
    .replace(/\\pi\b/g, " pi ")
    .replace(/\\infty\b/g, " infinity ")
    .replace(/\\text\s*\{([^{}]+)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/²/g, " squared")
    .replace(/³/g, " cubed")
    .replace(/√\s*/g, " square root of ")
    .replace(/≤/g, " is less than or equal to ")
    .replace(/≥/g, " is greater than or equal to ")
    .replace(/≠/g, " is not equal to ")
    .replace(/≈/g, " is approximately ")
    .replace(/×/g, " multiplied by ")
    .replace(/÷/g, " divided by ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

/* =========================================================
   SENTENCE GROUPING
   Two sentences are grouped together for display and speech.
========================================================= */

function splitIntoSentences(text) {
  const clean = String(text || "").trim();

  if (!clean) return [];

  if (typeof Intl.Segmenter === "function") {
    try {
      const segmenter = new Intl.Segmenter("en", {
        granularity: "sentence"
      });

      return Array.from(
        segmenter.segment(clean),
        item => item.segment.trim()
      ).filter(Boolean);

    } catch (error) {
      console.warn("Sentence segmentation fallback:", error);
    }
  }

  return (
    clean.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) || [clean]
  )
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function splitIntoDisplayGroups(text, sentencesPerGroup = 2) {
  const sentences = splitIntoSentences(text);
  const groups = [];

  for (let i = 0; i < sentences.length; i += sentencesPerGroup) {
    groups.push(
      sentences
        .slice(i, i + sentencesPerGroup)
        .join(" ")
    );
  }

  return groups;
}

/* =========================================================
   SPLIT LONG SPEECH INTO API-SAFE CHUNKS
========================================================= */

function splitSpeech(text, maxLength = 185) {
  const sentences = splitIntoSentences(text);
  const chunks = [];

  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = "";
      }

      let part = "";

      for (const word of sentence.split(/\s+/)) {
        const candidate = part
          ? `${part} ${word}`
          : word;

        if (candidate.length > maxLength && part) {
          chunks.push(part);
          part = word;
        } else {
          part = candidate;
        }
      }

      if (part) chunks.push(part);

      continue;
    }

    const candidate = current
      ? `${current} ${sentence}`
      : sentence;

    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = sentence;
    }
  }

  if (current) chunks.push(current);

  return chunks;
}
/* =========================================================
   STOP ALL SPEECH
========================================================= */

function stopSpeaking() {
  speechGeneration++;
  speechActive = false;

  if (currentAudio) {
    const audio = currentAudio;
    currentAudio = null;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  if (currentAudioCancel) {
    const cancel = currentAudioCancel;
    currentAudioCancel = null;
    cancel();
  }

  if (currentBrowserCancel) {
    const cancel = currentBrowserCancel;
    currentBrowserCancel = null;
    cancel();
  }

  if (speechSupported) {
    window.speechSynthesis.cancel();
  }
}

/* =========================================================
   PLAY GENERATED AUDIO
========================================================= */

function playAudioBlob(blob, generation) {
  return new Promise((resolve, reject) => {
    if (generation !== speechGeneration) {
      resolve();
      return;
    }

    const url = URL.createObjectURL(blob);
    currentAudioUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    let finished = false;

    function cleanup() {
      if (finished) return;

      finished = true;

      audio.onended = null;
      audio.onerror = null;

      if (currentAudioUrl === url) {
        URL.revokeObjectURL(url);
        currentAudioUrl = null;
      }

      if (currentAudio === audio) {
        currentAudio = null;
      }

      currentAudioCancel = null;
    }

    function finish() {
      if (finished) return;

      cleanup();
      resolve();
    }

    currentAudioCancel = finish;
    audio.onended = finish;

    audio.onerror = () => {
      if (finished) return;

      cleanup();
      reject(new Error("Generated voice could not be played."));
    };

    audio.play().catch(error => {
      if (finished) return;

      cleanup();
      reject(error);
    });
  });
}

/* =========================================================
   GROQ NATURAL VOICE
========================================================= */

async function speakWithGroq(text, generation) {
  const chunks = splitSpeech(text, 185);

  for (const chunk of chunks) {
    if (generation !== speechGeneration) return;

    const response = await fetch("/api/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: chunk
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(65000)
    });

    if (!response.ok) {
      let message = `Voice service returned HTTP ${response.status}.`;

      try {
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};

        if (data.error) {
          message = data.error;
        }
      } catch (error) {
        console.warn("Could not read speech error:", error);
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("Voice service returned empty audio.");
    }

    if (generation !== speechGeneration) return;

    setState("speaking", "Bro is speaking...");

    await playAudioBlob(blob, generation);
  }
}

/* =========================================================
   BROWSER VOICE FALLBACK
========================================================= */

function speakWithBrowser(text, generation) {
  if (!speechSupported) {
    return Promise.reject(
      new Error("Browser speech is unavailable.")
    );
  }

  const chunks = splitSpeech(text, 220);

  return new Promise((resolve, reject) => {
    let index = 0;
    let finished = false;

    function finish() {
      if (finished) return;

      finished = true;
      currentBrowserCancel = null;
      resolve();
    }

    currentBrowserCancel = finish;

    function next() {
      if (finished) return;

      if (generation !== speechGeneration) {
        finish();
        return;
      }

      if (index >= chunks.length) {
        finish();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(
        chunks[index]
      );

      if (!selectedVoice) {
        selectedVoice = chooseMaleVoice();
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = "en-US";
      }

      utterance.rate = 0.94;
      utterance.pitch = 0.96;
      utterance.volume = 1;

      utterance.onstart = () => {
        if (generation === speechGeneration) {
          setState("speaking", "Bro is speaking...");
        }
      };

      utterance.onend = () => {
        if (generation !== speechGeneration) {
          finish();
          return;
        }

        index++;
        window.setTimeout(next, 100);
      };

      utterance.onerror = event => {
        if (generation !== speechGeneration) {
          finish();
          return;
        }

        console.error("Browser speech error:", event.error);

        if (finished) return;

        finished = true;
        currentBrowserCancel = null;

        reject(new Error("Browser speech playback failed."));
      };

      window.speechSynthesis.speak(utterance);
    }

    next();
  });
}

/* =========================================================
   SYNCHRONIZED ANSWER PLAYBACK
   Display two sentences, speak them, then continue.
========================================================= */

async function speak(text, bubble = null) {
  const clean = prepareSpeech(text);

  if (!clean) return;

  stopSpeaking();

  const generation = speechGeneration;
  speechActive = true;

  const displayBubble = bubble || createAnswerDisplay();

  if (displayBubble) {
    displayBubble.textContent = "";
    displayBubble.dataset.completeAnswer = clean;
    styleAnswerBubble(displayBubble);
  }

  const groups = splitIntoDisplayGroups(clean, 2);

  if (!groups.length) {
    speechActive = false;
    return;
  }

  let useBrowserVoice = false;

  setState("speaking", "Preparing voice...");

  try {
    for (let i = 0; i < groups.length; i++) {
      if (generation !== speechGeneration) return;

      const group = groups[i];

      // Prepare and play the audio before moving to the next group.
      if (!useBrowserVoice) {
        try {
          const chunks = splitSpeech(group, 185);

          for (const chunk of chunks) {
            if (generation !== speechGeneration) return;

            const response = await fetch("/api/speech", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ text: chunk }),
              cache: "no-store",
              signal: AbortSignal.timeout(65000)
            });

            if (!response.ok) {
              throw new Error("Voice service unavailable.");
            }

            const blob = await response.blob();

            if (!blob.size) {
              throw new Error("Empty audio received.");
            }

            if (generation !== speechGeneration) return;

            // Reveal the two sentences when Bro starts speaking.
            appendAnswerGroup(displayBubble, group);

            setState(
              "speaking",
              `Bro is speaking... ${i + 1} of ${groups.length}`
            );

            await playAudioBlob(blob, generation);
          }

        } catch (error) {
          if (generation !== speechGeneration) return;

          console.warn("Switching to browser voice:", error);
          useBrowserVoice = true;
        }
      }

      // Browser voice fallback.
      if (useBrowserVoice) {
        if (generation !== speechGeneration) return;

        appendAnswerGroup(displayBubble, group);

        setState(
          "speaking",
          `Bro is speaking... ${i + 1} of ${groups.length}`
        );

        await speakWithBrowser(group, generation);
      }

      if (generation !== speechGeneration) return;

      // Hide this group five seconds after Bro finishes speaking.
      await hideAnswerGroup(displayBubble, generation);
    }

    if (generation !== speechGeneration) return;

    speechActive = false;
    setState("", "Ready to help");
    scheduleListeningRestart();

  } catch (error) {
    if (generation !== speechGeneration) return;

    console.error("Speech playback failed:", error);

    speechActive = false;
    setState("", "Voice playback failed.");
    scheduleListeningRestart();
  }
}
/* =========================================================
   AUTOMATIC LISTENING RESTART
========================================================= */

function scheduleListeningRestart() {
  if (!autoListenEnabled) return;

  if (listeningRestartTimer) {
    clearTimeout(listeningRestartTimer);
  }

  listeningRestartTimer = window.setTimeout(() => {
    listeningRestartTimer = null;

    if (!autoListenEnabled) return;
    if (requestInProgress) return;
    if (speechActive) return;
    if (isListening) return;

    beginRecognition();
  }, 600);
}

/* =========================================================
   STOP RECOGNITION
========================================================= */

function stopRecognition() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  if (listeningRestartTimer) {
    clearTimeout(listeningRestartTimer);
    listeningRestartTimer = null;
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.warn("Recognition already stopped:", error);
    }
  }

  isListening = false;

  if (voiceButton) {
    voiceButton.setAttribute(
      "aria-label",
      "Start voice input"
    );
  }
}

/* =========================================================
   STOP CONTROL
========================================================= */

if (stopButton) {
  stopButton.addEventListener("click", () => {
    autoListenEnabled = false;

    stopRecognition();
    stopSpeaking();

    if (chatAbortController) {
      chatAbortController.abort();
    }

    setState("", "Stopped.");
  });
}

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    autoListenEnabled = false;

    stopRecognition();
    stopSpeaking();

    if (chatAbortController) {
      chatAbortController.abort();
    }

    setState("", "Stopped.");
  }
});

/* =========================================================
   READ SERVER RESPONSES SAFELY
========================================================= */

async function readServerResponse(response) {
  const raw = await response.text();

  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Invalid server response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      data.error ||
      data.details ||
      "Something went wrong.";

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}

/* =========================================================
   SEND QUESTION TO PROTOGEN AI
========================================================= */

async function answerQuestion(question, fromTypingBox = false) {
  question = String(question || "").trim();

  if (!question || requestInProgress) return;

  // Stop any previous speech.
  stopSpeaking();

  requestInProgress = true;
  chatAbortController = new AbortController();

  // Typed questions clear the previous answer and hide the composer
  // immediately, before the server request begins.
  if (fromTypingBox) {
    conversation.replaceChildren();
    hideComposer();
  }

  setState("thinking", "Bro is thinking...");

  questionInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: question,
        history: chatHistory
      }),
      cache: "no-store",
      signal: chatAbortController.signal
    });

    const data = await readServerResponse(response);

    if (
      typeof data.answer !== "string" ||
      !data.answer.trim()
    ) {
      throw new Error("PROTOGEN received an empty answer.");
    }

    const answer = data.answer.trim();

    chatHistory.push(
      {
        role: "user",
        text: question
      },
      {
        role: "model",
        text: answer
      }
    );

    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    const provider = data.provider || data.model || "AI";

    // Prepare the answer without displaying it yet.
    const bubble = createAnswerDisplay(provider);

    if (bubble) {
      bubble.dataset.completeAnswer = answer;
    }

    console.log("Answered by:", provider);

    // The answer appears only when Bro begins speaking.
    await speak(answer, bubble);

  } catch (error) {
    if (error.name === "AbortError") {
      setState("", "Request stopped.");
      return;
    }

    console.error("PROTOGEN error:", error);

    const message =
      "Sorry, I couldn't process that. " + error.message;

    // Keep the error answer hidden until its speech begins too.
    const bubble = createAnswerDisplay();

    if (bubble) {
      bubble.dataset.completeAnswer = message;
    }

    setState("", "Connection problem.");

    await speak(message, bubble);

  } finally {
    requestInProgress = false;
    chatAbortController = null;

    // IMPORTANT:
    // Do not show the composer here.
    // It stays hidden until the user presses the text icon.

    if (
      autoListenEnabled &&
      !speechActive &&
      !isListening
    ) {
      scheduleListeningRestart();
    }
  }
}

/* =========================================================
   TEXT INPUT SUPPORT
   Enter and the Send button both submit this form.
========================================================= */

composer.addEventListener("submit", event => {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (!question || requestInProgress) return;

  answerQuestion(question, true);
});
/* =========================================================
   START SPEECH RECOGNITION
========================================================= */

function beginRecognition() {
  if (!SpeechRecognition) {
    setState(
      "",
      "Voice recognition is unavailable. Use Chrome or Edge."
    );

    return;
  }

  if (!autoListenEnabled) return;
  if (isListening) return;

  if (requestInProgress || speechActive) {
    return;
  }

  const activeRecognition = new SpeechRecognition();

  recognition = activeRecognition;

  activeRecognition.lang = "en-US";
  activeRecognition.continuous = true;
  activeRecognition.interimResults = true;
  activeRecognition.maxAlternatives = 1;

  let finalTranscript = "";

  isListening = true;

  voiceButton.setAttribute(
    "aria-label",
    "Stop voice input"
  );

  setState("listening", "Listening... speak naturally.");

  activeRecognition.onresult = event => {
    let interimTranscript = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();

      if (result.isFinal && transcript) {
        finalTranscript +=
          (finalTranscript ? " " : "") + transcript;
      } else if (transcript) {
        interimTranscript += transcript + " ";
      }
    }

    if (interimTranscript) {
      statusText.textContent =
        "Hearing: " + interimTranscript.trim();
    }

    if (!finalTranscript.trim()) return;

    // Wait for a natural pause before submitting the question.
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }

    silenceTimer = window.setTimeout(() => {
      const question = finalTranscript.trim();

      finalTranscript = "";
      silenceTimer = null;

      if (!question) return;

      console.log("Recognised speech:", question);

      if (recognition === activeRecognition) {
        isListening = false;

        try {
          activeRecognition.stop();
        } catch (error) {
          console.warn("Could not stop recognition:", error);
        }
      }

      answerQuestion(question);

    }, 1100);
  };

  activeRecognition.onerror = event => {
    console.error("Microphone error:", event.error);

    isListening = false;

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      autoListenEnabled = false;

      setState(
        "",
        "Microphone permission blocked. Allow microphone access in Chrome."
      );

      return;
    }

    if (event.error === "audio-capture") {
      autoListenEnabled = false;

      setState(
        "",
        "No microphone detected. Check your microphone."
      );

      return;
    }

    if (event.error === "no-speech") {
      setState("", "Still here. I'm listening...");
      scheduleListeningRestart();
      return;
    }

    if (autoListenEnabled) {
      setState("", "Reconnecting microphone...");
      scheduleListeningRestart();
    }
  };

  activeRecognition.onend = () => {
    if (recognition === activeRecognition) {
      isListening = false;
    }

    if (!autoListenEnabled) return;

    if (requestInProgress || speechActive) {
      return;
    }

    scheduleListeningRestart();
  };

  try {
    activeRecognition.start();

  } catch (error) {
    console.error("Could not start recognition:", error);

    isListening = false;

    setState(
      "",
      "Couldn't start the microphone. Try again."
    );

    scheduleListeningRestart();
  }
}

/* =========================================================
   MICROPHONE BUTTON
   First click enables continuous conversation.
   Second click disables it.
========================================================= */

function startListening() {
  if (!SpeechRecognition) {
    setState(
      "",
      "Voice recognition is unavailable. Use Chrome or Edge."
    );

    return;
  }

  if (autoListenEnabled) {
    autoListenEnabled = false;

    stopRecognition();

    setState("", "Voice listening paused.");

    return;
  }

  autoListenEnabled = true;

  stopSpeaking();

  if (requestInProgress) {
    setState("thinking", "I'll listen when I'm ready.");
    return;
  }

  beginRecognition();
}

/* =========================================================
   ORB CLICK ACTIVATES MICROPHONE
========================================================= */

voiceButton.addEventListener("click", startListening);

/* =========================================================
   START PROTOGEN
========================================================= */

window.addEventListener("load", async () => {
  if (greeting) {
    greeting.textContent = "Hello there";
  }

  if (!SpeechRecognition) {
    statusText.textContent =
      "Voice recognition is unavailable. Use Chrome or Edge.";
  }

  if (!speechSupported) {
    console.warn("Browser speech synthesis is unavailable.");
  }

  // Do not focus the hidden typing box on page load.
  hideComposer();

  try {
    const response = await fetch("/api/status", {
      cache: "no-store"
    });

    const data = await readServerResponse(response);

    if (data.online) {
      console.log("PROTOGEN server connected.");
      console.log("Primary provider:", data.provider);
      console.log("Primary model:", data.model);
      console.log("Local fallback:", data.localModel);

      setState("", "Ready to help");

    } else {
      setState("", "AI connection unavailable.");
    }

  } catch (error) {
    console.error("Server connection error:", error);

    setState(
      "",
      "Cannot connect to PROTOGEN's server."
    );
  }
});

console.log("PROTOGEN AI interface initialized.");