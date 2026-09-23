// ==========================================
// J.A.R.V.I.S MOBILE EDITION
// MAIN SCRIPT
// ==========================================

console.log("J.A.R.V.I.S SCRIPT LOADING...");


// ==========================================
// GEMINI SETTINGS
// ==========================================

let API_KEY =
  localStorage.getItem("jarvis_key") || "";

const MODEL =
  "gemini-3.6-flash";


// ==========================================
// PERMANENT MEMORY
// ==========================================

let JARVIS_MEMORY = JSON.parse(
  localStorage.getItem("jarvis_memory") || "{}"
);


// ==========================================
// CHAT HISTORY
// ==========================================

const CHAT_STORAGE_KEY =
  "jarvis_chat";


// ==========================================
// ELEMENTS
// ==========================================

const input =
  document.getElementById("msg");

const chat =
  document.getElementById("chat");

const sendBtn =
  document.getElementById("send");

const micBtn =
  document.getElementById("mic-btn");

const camBtn =
  document.getElementById("cam-btn");

const clearBtn =
  document.getElementById("clear-btn");

const imageInput =
  document.getElementById("img-input");


// ==========================================
// MEMORY SAVE
// ==========================================

function saveMemory() {

  localStorage.setItem(
    "jarvis_memory",
    JSON.stringify(JARVIS_MEMORY)
  );

}


// ==========================================
// GET MEMORY CONTEXT
// ==========================================

function getMemoryContext() {

  let context = "";

  if (JARVIS_MEMORY.name) {

    context +=
      `The user's name is ${JARVIS_MEMORY.name}.\n`;

  }

  return context;

}


// ==========================================
// MEMORY COMMAND PROCESSOR
// ==========================================

function processMemoryCommand(command) {

  const text =
    command.trim();

  const lower =
    text.toLowerCase();


  // ========================================
  // REMEMBER MY NAME
  // ========================================

  const nameMatch =
    text.match(
      /remember\s+(?:my\s+)?name\s+is\s+(.+)/i
    );


  if (nameMatch) {

    let name =
      nameMatch[1]
        .trim()
        .replace(/[.!?]+$/, "");


    // Remove common words accidentally included
    name =
      name
        .replace(/^called\s+/i, "")
        .trim();


    JARVIS_MEMORY.name =
      name;


    saveMemory();


    return (
      `I will remember that, Boss. Your name is ${name}.`
    );

  }


  // ========================================
  // WHAT IS MY NAME?
  // ========================================

  if (
    lower === "what is my name" ||
    lower === "what's my name" ||
    lower === "whats my name" ||
    lower === "do you remember my name" ||
    lower === "do you know my name" ||
    lower === "tell me my name" ||
    lower.includes("remember my name")
  ) {

    if (
      JARVIS_MEMORY.name
    ) {

      return (
        `Your name is ${JARVIS_MEMORY.name}, Boss.`
      );

    }


    return (
      "You haven't told me your name yet, Boss."
    );

  }


  // ========================================
  // WHO AM I?
  // ========================================

  if (
    lower === "who am i" ||
    lower === "who am i?"
  ) {

    if (
      JARVIS_MEMORY.name
    ) {

      return (
        `You are ${JARVIS_MEMORY.name}, Boss.`
      );

    }


    return (
      "I don't have your name in my memory yet, Boss."
    );

  }


  // No memory command
  return null;

}


// ==========================================
// SPEAK
// ==========================================

function speak(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  window.speechSynthesis.cancel();


  const speech =
    new SpeechSynthesisUtterance(text);


  speech.rate =
    0.92;

  speech.pitch =
    0.75;

  speech.volume =
    1;


  const voices =
    window.speechSynthesis.getVoices();


  const voice =
    voices.find(v =>
      /en-US|en-GB|English/i.test(v.lang)
    );


  if (voice) {

    speech.voice =
      voice;

  }


  window.speechSynthesis.speak(
    speech
  );

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
  sender,
  message
) {

  if (!chat) return;


  const box =
    document.createElement("div");


  box.className =
    "message";


  const title =
    document.createElement("strong");


  title.textContent =
    sender + ":";


  const text =
    document.createElement("span");


  text.textContent =
    " " + message;


  box.appendChild(title);

  box.appendChild(text);


  chat.appendChild(box);


  chat.scrollTop =
    chat.scrollHeight;


  saveChat();

}


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {

  if (!chat) return;


  localStorage.setItem(
    CHAT_STORAGE_KEY,
    chat.innerHTML
  );

}


// ==========================================
// LOAD CHAT
// ==========================================

function loadChat() {

  const saved =
    localStorage.getItem(
      CHAT_STORAGE_KEY
    );


  if (
    saved &&
    chat
  ) {

    chat.innerHTML =
      saved;


    chat.scrollTop =
      chat.scrollHeight;

  }

}


// ==========================================
// GEMINI API
// ==========================================

async function callGemini(userPrompt) {

  // ========================================
  // API KEY
  // ========================================

  if (!API_KEY) {

    const enteredKey =
      window.prompt(
        "Enter your Gemini API Key:"
      );


    if (!enteredKey) {

      return (
        "Gemini API key is required, Boss."
      );

    }


    API_KEY =
      enteredKey.trim();


    localStorage.setItem(
      "jarvis_key",
      API_KEY
    );

  }


  // ========================================
  // MEMORY CONTEXT
  // ========================================

  const memoryContext =
    getMemoryContext();


  // ========================================
  // JARVIS SYSTEM INSTRUCTION
  // ========================================

  const systemText = `
You are J.A.R.V.I.S, the user's personal AI assistant.

Always address the user as Boss.

Be concise, friendly and useful.

PERMANENT USER MEMORY:
${memoryContext}

If the user's name is present in permanent memory,
you know the user's name and may use it when appropriate.

Do not claim that you forgot information that is present
in permanent memory.
`;


  // ========================================
  // GEMINI URL
  // ========================================

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


  try {

    const response =
      await fetch(
        url,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "x-goog-api-key":
              API_KEY

          },


          body:
            JSON.stringify({

              systemInstruction: {

                parts: [

                  {
                    text:
                      systemText
                  }

                ]

              },


              contents: [

                {

                  role:
                    "user",

                  parts: [

                    {
                      text:
                        userPrompt
                    }

                  ]

                }

              ]

            })

        }
      );


    // ======================================
    // ERROR HANDLING
    // ======================================

    if (!response.ok) {

      const error =
        await response.text();


      console.error(
        "Gemini error:",
        error
      );


      // Invalid API key
      if (
        response.status === 401 ||
        response.status === 403
      ) {

        localStorage.removeItem(
          "jarvis_key"
        );

        API_KEY =
          "";


        return (
          "Your Gemini API key is invalid, Boss."
        );

      }


      // Quota
      if (
        response.status === 429
      ) {

        return (
          "Gemini quota is currently unavailable, Boss."
        );

      }


      return (
        "Gemini service error, Boss."
      );

    }


    // ======================================
    // RESPONSE
    // ======================================

    const data =
      await response.json();


    const reply =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(
          part =>
            part.text || ""
        )
        .join("")
        .trim();


    if (!reply) {

      return (
        "I did not receive a response from Gemini, Boss."
      );

    }


    return reply;


  } catch (error) {

    console.error(
      "Gemini connection error:",
      error
    );


    return (
      "I could not connect to Gemini, Boss."
    );

  }

}


// ==========================================
// EXECUTE COMMAND
// ==========================================

async function executeCommand() {

  if (!input) return;


  const command =
    input.value.trim();


  if (!command) {

    speak(
      "Please enter a command, Boss."
    );

    return;

  }


  // ========================================
  // SHOW USER COMMAND
  // ========================================

  addMessage(
    "YOU",
    command
  );


  input.value =
    "";


  try {

    // ======================================
    // 🧠 PERMANENT MEMORY FIRST
    // ======================================

    const memoryResult =
      processMemoryCommand(
        command
      );


    if (memoryResult) {

      addMessage(
        "J.A.R.V.I.S",
        memoryResult
      );


      speak(
        memoryResult
      );


      return;

    }


    // ======================================
    // 🤖 AI AGENT
    // ======================================

    const agentResult =
      await runAgent(
        command
      );


    if (agentResult) {

      addMessage(
        "J.A.R.V.I.S",
        agentResult
      );


      speak(
        agentResult
      );


      return;

    }


    // ======================================
    // 🧠 GEMINI
    // ======================================

    const reply =
      await callGemini(
        command
      );


    addMessage(
      "J.A.R.V.I.S",
      reply
    );


    speak(
      reply
    );


  } catch (error) {

    console.error(
      "Command error:",
      error
    );


    const message =
      "I encountered a system error, Boss.";


    addMessage(
      "J.A.R.V.I.S",
      message
    );


    speak(
      message
    );

  }

}


// ==========================================
// VOICE RECOGNITION
// ==========================================

let recognition =
  null;


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

        micBtn.textContent =
          "🔴";

      }

    };


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0]
          .transcript;


      if (input) {

        input.value =
          transcript;

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

        micBtn.textContent =
          "🎙️";

      }

    };


  recognition.start();

}


// ==========================================
// IMAGE / CAMERA BUTTON
// ==========================================

function openCamera() {

  if (!imageInput) {

    return;

  }


  imageInput.click();

}


if (imageInput) {

  imageInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];


      if (!file) {

        return;

      }


      addMessage(
        "YOU",
        "Image selected: " +
        file.name
      );


      speak(
        "Image received, Boss."
      );


      imageInput.value =
        "";

    }
  );

}


// ==========================================
// EXECUTE BUTTON
// ==========================================

if (sendBtn) {

  sendBtn.addEventListener(
    "click",
    executeCommand
  );

}


// ==========================================
// ENTER KEY
// ==========================================

if (input) {

  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        executeCommand();

      }

    }
  );

}


// ==========================================
// MICROPHONE
// ==========================================

if (micBtn) {

  micBtn.addEventListener(
    "click",
    startListening
  );

}


// ==========================================
// CAMERA
// ==========================================

if (camBtn) {

  camBtn.addEventListener(
    "click",
    openCamera
  );

}


// ==========================================
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    () => {

      // Clear permanent memory
      localStorage.removeItem(
        "jarvis_memory"
      );


      // Clear old memory key if present
      localStorage.removeItem(
        "jarvis_permanent_memory"
      );


      // Clear chat history
      localStorage.removeItem(
        CHAT_STORAGE_KEY
      );


      // Reset memory object
      JARVIS_MEMORY =
        {};


      if (chat) {

        chat.innerHTML =
          "";

      }


      speak(
        "Long term memory cleared, Boss."
      );

    }
  );

}


// ==========================================
// LOAD SAVED CHAT
// ==========================================

loadChat();


// ==========================================
// VOICE LOAD
// ==========================================

if (
  "speechSynthesis" in window
) {

  window.speechSynthesis.onvoiceschanged =
    () => {

      window.speechSynthesis
        .getVoices();

    };

}


// ==========================================
// READY
// ==========================================

console.log(
  "✅ J.A.R.V.I.S SYSTEM READY"
);

console.log(
  "🤖 AI AGENT ONLINE"
);

console.log(
  "🧠 PERMANENT MEMORY ONLINE"
);
