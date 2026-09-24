// ==========================================
// J.A.R.V.I.S MOBILE EDITION
// COMPLETE SCRIPT
// WhatsApp + Contacts + Voice
// ==========================================

console.log("J.A.R.V.I.S loading...");

// ==========================================
// SETTINGS
// ==========================================

let API_KEY = localStorage.getItem("jarvis_key") || "";
const MODEL = "gemini-3.6-flash";

// ==========================================
// ELEMENTS
// ==========================================

const input = document.getElementById("msg");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");
const camBtn = document.getElementById("cam-btn");
const clearBtn = document.getElementById("clear-btn");
const imageInput = document.getElementById("img-input");

// ==========================================
// SPEAK
// ==========================================

function speak(text) {

  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);

  speech.rate = 0.92;
  speech.pitch = 0.75;
  speech.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const voice = voices.find(v =>
    /en-US|en-GB|English/i.test(v.lang)
  );

  if (voice) {
    speech.voice = voice;
  }

  window.speechSynthesis.speak(speech);
}

// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(sender, message) {

  if (!chat) return;

  const box = document.createElement("div");
  box.className = "message";

  const title = document.createElement("strong");
  title.textContent = sender + ":";

  const text = document.createElement("span");
  text.textContent = " " + message;

  box.appendChild(title);
  box.appendChild(text);

  chat.appendChild(box);

  chat.scrollTop = chat.scrollHeight;

  saveChat();
}

// ==========================================
// SAVE / LOAD CHAT
// ==========================================

function saveChat() {

  if (!chat) return;

  localStorage.setItem(
    "jarvis_chat",
    chat.innerHTML
  );
}

function loadChat() {

  const saved =
    localStorage.getItem("jarvis_chat");

  if (saved && chat) {

    chat.innerHTML = saved;

    chat.scrollTop =
      chat.scrollHeight;
  }
}

// ==========================================
// MEMORY
// ==========================================

function getAllMemory() {

  try {

    return JSON.parse(
      localStorage.getItem("jarvis_memory") || "{}"
    );

  } catch {

    return {};
  }
}

function saveMemory(key, value) {

  const memory = getAllMemory();

  memory[key] = value;

  localStorage.setItem(
    "jarvis_memory",
    JSON.stringify(memory)
  );
}

function getMemory(key) {

  const memory = getAllMemory();

  return memory[key] || null;
}

// ==========================================
// CONTACTS
// ==========================================

function saveContact(name, number) {

  const contacts =
    JSON.parse(
      localStorage.getItem("jarvis_contacts") || "{}"
    );

  const cleanName =
    name.trim().toLowerCase();

  let cleanNumber =
    number.replace(/\D/g, "");

  // India number
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }

  contacts[cleanName] = cleanNumber;

  localStorage.setItem(
    "jarvis_contacts",
    JSON.stringify(contacts)
  );
}

function getContact(name) {

  const contacts =
    JSON.parse(
      localStorage.getItem("jarvis_contacts") || "{}"
    );

  return contacts[name.trim().toLowerCase()] || null;
}

function getAllContacts() {

  return JSON.parse(
    localStorage.getItem("jarvis_contacts") || "{}"
  );
}

function deleteContact(name) {

  const contacts = getAllContacts();

  const key = name.trim().toLowerCase();

  if (!contacts[key]) {
    return false;
  }

  delete contacts[key];

  localStorage.setItem(
    "jarvis_contacts",
    JSON.stringify(contacts)
  );

  return true;
}

// ==========================================
// WHATSAPP
// ==========================================

function openWhatsApp(number, message) {

  let cleanNumber =
    number.replace(/\D/g, "");

  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }

  const url =
    "https://wa.me/" +
    cleanNumber +
    "?text=" +
    encodeURIComponent(message);

  window.location.href = url;
}

function openWhatsAppContact(name, message) {

  const number = getContact(name);

  if (!number) {

    return (
      `I don't have ${name} in my JARVIS contacts, Boss. ` +
      `Say: remember contact ${name} as 9876543210.`
    );
  }

  openWhatsApp(number, message);

  return (
    `Opening WhatsApp for ${name}, Boss.`
  );
}

// ==========================================
// GEMINI
// ==========================================

async function callGemini(prompt) {

  if (!API_KEY) {

    API_KEY = promptForApiKey();

    if (!API_KEY) {
      return "Gemini API key is required, Boss.";
    }

    localStorage.setItem(
      "jarvis_key",
      API_KEY
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const response =
    await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },

      body: JSON.stringify({

        systemInstruction: {
          parts: [
            {
              text:
                "You are J.A.R.V.I.S, a helpful personal AI assistant. Address the user as Boss. Be concise, polite and useful."
            }
          ]
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]

      })
    });

  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Gemini error:",
      errorText
    );

    if (response.status === 400) {
      return "The Gemini API request is invalid, Boss.";
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      localStorage.removeItem(
        "jarvis_key"
      );

      API_KEY = "";

      return "The Gemini API key is invalid, Boss.";
    }

    if (response.status === 429) {
      return "Gemini quota is currently unavailable, Boss.";
    }

    return "Gemini service error, Boss.";
  }

  const data =
    await response.json();

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

  if (!reply) {
    return "I did not receive a response from Gemini, Boss.";
  }

  return reply;
}

// ==========================================
// API KEY
// ==========================================

function promptForApiKey() {

  const key =
    prompt("Enter your Gemini API Key:");

  if (!key) return "";

  return key.trim();
}

// ==========================================
// TOOLS
// ==========================================

async function handleTools(text) {

  const t =
    text.toLowerCase().trim();

  // ========================================
  // TIME
  // ========================================

  if (
    t.includes("time") ||
    t.includes("సమయం") ||
    t.includes("టైమ్")
  ) {

    return (
      "The time is " +
      new Date().toLocaleTimeString() +
      ", Boss."
    );
  }

  // ========================================
  // WEATHER
  // ========================================

  if (
    t.includes("weather") ||
    t.includes("వాతావరణం")
  ) {

    return new Promise(resolve => {

      if (!navigator.geolocation) {

        resolve(
          "Location is not supported, Boss."
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        async position => {

          try {

            const lat =
              position.coords.latitude;

            const lon =
              position.coords.longitude;

            const url =
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;

            const response =
              await fetch(url);

            if (!response.ok) {
              throw new Error("Weather failed");
            }

            const data =
              await response.json();

            const temperature =
              data.current.temperature_2m;

            resolve(
              `The current temperature is ${temperature} degrees Celsius, Boss.`
            );

          } catch (error) {

            console.error(error);

            resolve(
              "Weather service error, Boss."
            );
          }

        },

        () => {

          resolve(
            "Please allow location permission for weather, Boss."
          );
        }
      );
    });
  }

  // ========================================
  // TIMER
  // ========================================

  const timerMatch =
    t.match(
      /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
    );

  if (
    (t.includes("timer") ||
     t.includes("టైమర్")) &&
    timerMatch
  ) {

    const amount =
      parseInt(timerMatch[1]);

    const unit =
      timerMatch[2].toLowerCase();

    let factor = 60000;

    if (/hour|hours|hr|hrs/.test(unit)) {
      factor = 3600000;
    }

    if (/second|seconds|sec|secs/.test(unit)) {
      factor = 1000;
    }

    const duration =
      amount * factor;

    setTimeout(() => {

      speak(
        `Timer finished. ${amount} ${unit} completed, Boss.`
      );

      addMessage(
        "J.A.R.V.I.S",
        `Timer finished: ${amount} ${unit}.`
      );

    }, duration);

    return (
      `Timer set for ${amount} ${unit}, Boss.`
    );
  }

  // ========================================
  // TRANSLATE
  // ========================================

  if (t.startsWith("translate")) {

    const q =
      text
        .replace(/translate\s*(this)?/i, "")
        .trim();

    if (!q) {
      return "What would you like me to translate, Boss?";
    }

    try {

      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(q) +
        "&langpair=en|te";

      const response =
        await fetch(url);

      const data =
        await response.json();

      return (
        "In Telugu: " +
        data.responseData.translatedText
      );

    } catch (error) {

      return "Translation service error, Boss.";
    }
  }

  // ========================================
  // CONTACT: SAVE
  // ========================================

  const saveContactMatch =
    text.match(
      /^(?:remember|save)\s+(?:contact\s+)?(.+?)\s+(?:as|number)\s+(\+?\d[\d\s-]{8,})$/i
    );

  if (saveContactMatch) {

    const name =
      saveContactMatch[1].trim();

    const number =
      saveContactMatch[2].trim();

    saveContact(name, number);

    return (
      `Contact ${name} has been saved, Boss.`
    );
  }

  // ========================================
  // CONTACT: SHOW
  // ========================================

  if (
    t === "show contacts" ||
    t === "show my contacts" ||
    t === "list contacts"
  ) {

    const contacts =
      getAllContacts();

    const names =
      Object.keys(contacts);

    if (!names.length) {

      return (
        "There are no JARVIS contacts saved yet, Boss."
      );
    }

    return (
      "Your JARVIS contacts are: " +
      names.join(", ") +
      "."
    );
  }

  // ========================================
  // CONTACT: DELETE
  // ========================================

  const deleteMatch =
    text.match(
      /^(?:delete|remove)\s+(?:contact\s+)?(.+)$/i
    );

  if (deleteMatch) {

    const name =
      deleteMatch[1].trim();

    if (deleteContact(name)) {

      return (
        `Contact ${name} deleted, Boss.`
      );
    }

    return (
      `I couldn't find ${name}, Boss.`
    );
  }

  // ========================================
  // WHATSAPP BY NUMBER
  // ========================================

  const whatsappNumberMatch =
    text.match(
      /^(?:send\s+)?whatsapp\s+(?:message\s+)?(?:to\s+)?(\+?\d[\d\s-]{8,})(?:\s+(?:saying|message|that)\s+)(.+)$/i
    );

  if (whatsappNumberMatch) {

    const number =
      whatsappNumberMatch[1].trim();

    const message =
      whatsappNumberMatch[2].trim();

    openWhatsApp(number, message);

    return (
      "Opening WhatsApp with your message, Boss."
    );
  }

  // ========================================
  // WHATSAPP BY CONTACT NAME
  // ========================================

  const whatsappNameMatch =
    text.match(
      /^(?:send\s+)?whatsapp\s+(?:message\s+)?(?:to\s+)?(.+?)\s+(?:saying|message|that)\s+(.+)$/i
    );

  if (whatsappNameMatch) {

    const name =
      whatsappNameMatch[1].trim();

    const message =
      whatsappNameMatch[2].trim();

    const number =
      getContact(name);

    if (!number) {

      return (
        `I don't have ${name} saved, Boss. ` +
        `Say: remember contact ${name} as 9876543210.`
      );
    }

    openWhatsApp(number, message);

    return (
      `Opening WhatsApp for ${name}, Boss.`
    );
  }

  // ========================================
  // PLAY YOUTUBE
  // ========================================

  if (
    t.startsWith("play ") ||
    t.includes("youtube")
  ) {

    let query =
      text
        .replace(/youtube/ig, "")
        .replace(/search/ig, "")
        .replace(/play/ig, "")
        .trim();

    if (!query) {
      return "What would you like me to search for, Boss?";
    }

    const url =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(query);

    window.open(url, "_blank");

    return (
      `Searching YouTube for ${query}, Boss.`
    );
  }

  // ========================================
  // SIMPLE MEMORY
  // ========================================

  if (t.startsWith("remember ")) {

    const value =
      text.substring(9).trim();

    saveMemory(
      "user_note",
      value
    );

    return (
      "I will remember that, Boss."
    );
  }

  // ========================================
  // MEMORY
  // ========================================

  if (
    t.includes("what do you remember") ||
    t === "memory"
  ) {

    const memory =
      getMemory("user_note");

    if (!memory) {

      return (
        "I don't have any saved note yet, Boss."
      );
    }

    return (
      "I remember: " + memory
    );
  }

  // ========================================
  // NO TOOL
  // ========================================

  return null;
}

// ==========================================
// EXECUTE COMMAND
// ==========================================

async function executeCommand() {

  if (!input) return;

  let command =
    input.value.trim();

  if (!command) {

    speak(
      "Please enter a command, Boss."
    );

    return;
  }

  // Remove Hey JARVIS
  command =
    command
      .replace(
        /^hey\s+jarvis[\s,]*/i,
        ""
      )
      .trim();

  addMessage(
    "YOU",
    command
  );

  input.value = "";

  try {

    const toolResult =
      await handleTools(command);

    if (toolResult) {

      addMessage(
        "J.A.R.V.I.S",
        toolResult
      );

      speak(toolResult);

      return;
    }

    addMessage(
      "J.A.R.V.I.S",
      "Processing..."
    );

    const reply =
      await callGemini(command);

    const messages =
      chat.querySelectorAll(".message");

    if (messages.length) {

      const last =
        messages[messages.length - 1];

      last.textContent =
        "J.A.R.V.I.S: " + reply;
    }

    saveChat();

    speak(reply);

  } catch (error) {

    console.error(
      "Execute error:",
      error
    );

    addMessage(
      "J.A.R.V.I.S",
      "I encountered a system error, Boss."
    );

    speak(
      "I encountered a system error, Boss."
    );
  }
}

// ==========================================
// VOICE INPUT
// ==========================================

let recognition = null;

function startListening() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    alert(
      "Voice recognition is not supported in this browser."
    );

    return;
  }

  recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-IN";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  recognition.onstart =
    () => {

      if (micBtn) {
        micBtn.textContent = "🔴";
      }

    };

  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      if (input) {
        input.value = transcript;
      }

      executeCommand();
    };

  recognition.onerror =
    event => {

      console.error(
        "Voice error:",
        event.error
      );
    };

  recognition.onend =
    () => {

      if (micBtn) {
        micBtn.textContent = "🎙️";
      }
    };

  recognition.start();
}

// ==========================================
// CAMERA
// ==========================================

function openCamera() {

  if (!imageInput) return;

  imageInput.click();
}

if (imageInput) {

  imageInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];

      if (!file) return;

      addMessage(
        "YOU",
        "Image selected: " + file.name
      );

      speak(
        "Image received, Boss."
      );

      imageInput.value = "";
    }
  );
}

// ==========================================
// BUTTON EVENTS
// ==========================================

if (sendBtn) {

  sendBtn.addEventListener(
    "click",
    executeCommand
  );
}

if (input) {

  input.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        executeCommand();
      }
    }
  );
}

if (micBtn) {

  micBtn.addEventListener(
    "click",
    startListening
  );
}

if (camBtn) {

  camBtn.addEventListener(
    "click",
    openCamera
  );
}

if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "jarvis_memory"
      );

      localStorage.removeItem(
        "jarvis_chat"
      );

      localStorage.removeItem(
        "jarvis_contacts"
      );

      if (chat) {
        chat.innerHTML = "";
      }

      speak(
        "Memory and contacts cleared, Boss."
      );
    }
  );
}

// ==========================================
// LOAD
// ==========================================

loadChat();

if ("speechSynthesis" in window) {

  window.speechSynthesis.onvoiceschanged =
    () => {

      window.speechSynthesis.getVoices();

    };
}

console.log(
  "J.A.R.V.I.S SYSTEM READY"
);
