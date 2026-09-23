// ==========================================
// J.A.R.V.I.S
// CLEAN VERSION
// ==========================================

console.log("J.A.R.V.I.S LOADING...");


// ==========================================
// GEMINI SETTINGS
// ==========================================

let API_KEY =
  localStorage.getItem("jarvis_key") || "";

const MODEL =
  "gemini-3.6-flash";


// ==========================================
// MEMORY
// ==========================================

let memory = JSON.parse(
  localStorage.getItem("jarvis_memory") || "{}"
);


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
// CHAT
// ==========================================

function addMessage(sender, message) {

  const box =
    document.createElement("div");

  box.className = "msg";

  box.textContent =
    sender + ": " + message;

  chat.appendChild(box);

  chat.scrollTop =
    chat.scrollHeight;

}


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {

  localStorage.setItem(
    "jarvis_chat",
    chat.innerHTML
  );

}


// ==========================================
// LOAD CHAT
// ==========================================

function loadChat() {

  const saved =
    localStorage.getItem("jarvis_chat");

  if (saved) {

    chat.innerHTML =
      saved;

    chat.scrollTop =
      chat.scrollHeight;

  }

}


// ==========================================
// SAVE MEMORY
// ==========================================

function saveMemory() {

  localStorage.setItem(
    "jarvis_memory",
    JSON.stringify(memory)
  );

}


// ==========================================
// SPEAK
// ==========================================

function speak(text) {

  if (!window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(text);

  speech.rate = 0.92;
  speech.pitch = 0.75;
  speech.volume = 1;

  const voices =
    speechSynthesis.getVoices();

  const voice =
    voices.find(v =>
      /en-US|en-GB|English/i.test(v.lang)
    );

  if (voice) {
    speech.voice = voice;
  }

  speechSynthesis.speak(speech);

}


// ==========================================
// MEMORY
// ==========================================

function checkMemory(command) {

  const text =
    command.trim();

  const lower =
    text.toLowerCase();


  // REMEMBER NAME

  const match =
    text.match(
      /remember\s+(?:my\s+)?name\s+is\s+(.+)/i
    );

  if (match) {

    const name =
      match[1]
        .trim()
        .replace(/[.!?]+$/, "");

    memory.name =
      name;

    saveMemory();

    return (
      "I will remember your name, Boss. " +
      "Your name is " +
      name +
      "."
    );
  }


  // WHAT IS MY NAME

  if (
    lower === "what is my name" ||
    lower === "what's my name" ||
    lower === "whats my name" ||
    lower === "tell me my name"
  ) {

    if (memory.name) {

      return (
        "Your name is " +
        memory.name +
        ", Boss."
      );

    }

    return (
      "You have not told me your name yet, Boss."
    );
  }


  return null;

}


// ==========================================
// GEMINI
// ==========================================

async function askGemini(command) {

  if (!API_KEY) {

    const key =
      window.prompt(
        "Enter your Gemini API Key:"
      );

    if (!key) {

      return (
        "Gemini API key is required, Boss."
      );

    }

    API_KEY =
      key.trim();

    localStorage.setItem(
      "jarvis_key",
      API_KEY
    );

  }


  const memoryInfo =
    memory.name
      ? "The user's name is " + memory.name + "."
      : "The user's name is not known.";


  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL +
    ":generateContent";


  try {

    const response =
      await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              API_KEY
          },

          body: JSON.stringify({

            systemInstruction: {

              parts: [

                {
                  text:
                    "You are J.A.R.V.I.S, a helpful personal AI assistant. " +
                    "Always call the user Boss. " +
                    "Be concise, friendly and useful. " +
                    memoryInfo
                }

              ]

            },

            contents: [

              {
                role: "user",

                parts: [

                  {
                    text: command
                  }

                ]

              }

            ]

          })

        }
      );


    if (!response.ok) {

      const error =
        await response.text();

      console.error(
        "Gemini error:",
        error
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {

        localStorage.removeItem(
          "jarvis_key"
        );

        API_KEY = "";

        return (
          "Your Gemini API key is invalid, Boss."
        );
      }

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


    const data =
      await response.json();


    const reply =
      data?.candidates?.[0]
        ?.content?.parts
        ?.map(
          part => part.text || ""
        )
        .join("")
        .trim();


    return reply ||
      "I did not receive a response from Gemini, Boss.";


  } catch (error) {

    console.error(error);

    return (
      "I could not connect to Gemini, Boss."
    );

  }

}


// ==========================================
// MAIN COMMAND
// ==========================================

async function executeCommand() {

  const command =
    input.value.trim();

  if (!command) {

    speak(
      "Please enter a command, Boss."
    );

    return;

  }


  addMessage(
    "YOU",
    command
  );

  input.value = "";


  // MEMORY FIRST

  const memoryReply =
    checkMemory(command);

  if (memoryReply) {

    addMessage(
      "J.A.R.V.I.S",
      memoryReply
    );

    saveChat();

    speak(
      memoryReply
    );

    return;

  }


  // GEMINI

  addMessage(
    "J.A.R.V.I.S",
    "Thinking..."
  );

  const messages =
    chat.querySelectorAll(".msg");

  const thinking =
    messages[messages.length - 1];


  const reply =
    await askGemini(command);


  if (thinking) {

    thinking.textContent =
      "J.A.R.V.I.S: " + reply;

  }


  saveChat();

  speak(reply);

}


// ==========================================
// EXECUTE BUTTON
// ==========================================

sendBtn.addEventListener(
  "click",
  executeCommand
);


// ==========================================
// ENTER
// ==========================================

input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      event.preventDefault();

      executeCommand();

    }

  }
);


// ==========================================
// MICROPHONE
// ==========================================

micBtn.addEventListener(
  "click",
  function() {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      alert(
        "Voice recognition is not supported in this browser."
      );

      return;

    }


    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-IN";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;


    micBtn.textContent =
      "🔴";


    recognition.onresult =
      function(event) {

        input.value =
          event.results[0][0]
            .transcript;

        executeCommand();

      };


    recognition.onend =
      function() {

        micBtn.textContent =
          "🎙️";

      };


    recognition.onerror =
      function() {

        micBtn.textContent =
          "🎙️";

      };


    recognition.start();

  }
);


// ==========================================
// CAMERA
// ==========================================

camBtn.addEventListener(
  "click",
  function() {

    imageInput.click();

  }
);


imageInput.addEventListener(
  "change",
  function(event) {

    const file =
      event.target.files[0];

    if (!file) return;

    addMessage(
      "YOU",
      "Image selected: " +
      file.name
    );

    saveChat();

    speak(
      "Image received, Boss."
    );

    imageInput.value =
      "";

  }
);


// ==========================================
// CLEAR
// ==========================================

clearBtn.addEventListener(
  "click",
  function() {

    localStorage.removeItem(
      "jarvis_memory"
    );

    localStorage.removeItem(
      "jarvis_chat"
    );

    memory = {};

    chat.innerHTML =
      "";

    speak(
      "Memory cleared, Boss."
    );

  }
);


// ==========================================
// LOAD
// ==========================================

loadChat();


// ==========================================
// READY
// ==========================================

console.log(
  "J.A.R.V.I.S SYSTEM READY"
);
