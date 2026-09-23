// ==========================================
// J.A.R.V.I.S MOBILE EDITION
// CLEAN MAIN SCRIPT
// ==========================================

console.log("J.A.R.V.I.S starting...");


// ==========================================
// GEMINI
// ==========================================

let API_KEY =
  localStorage.getItem("jarvis_key") || "";

const MODEL =
  "gemini-3.6-flash";


// ==========================================
// MEMORY
// ==========================================

let MEMORY = JSON.parse(
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
// SAVE MEMORY
// ==========================================

function saveMemory() {

  localStorage.setItem(
    "jarvis_memory",
    JSON.stringify(MEMORY)
  );

}


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {

  if (!chat) return;

  localStorage.setItem(
    "jarvis_chat",
    chat.innerHTML
  );

}


// ==========================================
// LOAD CHAT
// ==========================================

function loadChat() {

  if (!chat) return;

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
    voices.find(
      voice =>
        /en-US|en-GB/i.test(
          voice.lang
        )
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
// MEMORY COMMANDS
// ==========================================

function checkMemory(command) {

  const text =
    command.trim();

  const lower =
    text.toLowerCase();


  // ----------------------------------------
  // REMEMBER NAME
  // ----------------------------------------

  const nameMatch =
    text.match(
      /remember\s+(?:my\s+)?name\s+is\s+(.+)/i
    );


  if (nameMatch) {

    const name =
      nameMatch[1]
        .trim()
        .replace(/[.!?]+$/, "");


    MEMORY.name =
      name;


    saveMemory();


    return (
      `I will remember that, Boss. Your name is ${name}.`
    );
  }


  // ----------------------------------------
  // WHAT IS MY NAME
  // ----------------------------------------

  if (
    lower === "what is my name" ||
    lower === "what's my name" ||
    lower === "whats my name" ||
    lower === "tell me my name" ||
    lower === "do you remember my name"
  ) {

    if (MEMORY.name) {

      return (
        `Your name is ${MEMORY.name}, Boss.`
      );
    }


    return (
      "You haven't told me your name yet, Boss."
    );
  }


  // ----------------------------------------
  // WHO AM I
  // ----------------------------------------

  if (
    lower === "who am i" ||
    lower === "who am i?"
  ) {

    if (MEMORY.name) {

      return (
        `You are ${MEMORY.name}, Boss.`
      );
    }


    return (
      "I don't know your name yet, Boss."
    );
  }


  return null;

}


// ==========================================
// GEMINI API
// ==========================================

async function callGemini(
  userMessage
) {

  // ----------------------------------------
  // API KEY
  // ----------------------------------------

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


  // ----------------------------------------
  // MEMORY CONTEXT
  // ----------------------------------------

  let memoryText =
    "No permanent user information saved.";


  if (MEMORY.name) {

    memoryText =
      `The user's name is ${MEMORY.name}.`;

  }


  // ----------------------------------------
  // API URL
  // ----------------------------------------

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
                      `
You are J.A.R.V.I.S, a personal AI assistant.

Always address the user as Boss.

Be concise, friendly and useful.

Permanent memory:
${memoryText}

Use permanent memory when relevant.
`
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
                        userMessage
                    }

                  ]

                }

              ]

            })

        }
      );


    // --------------------------------------
    // ERROR
    // --------------------------------------

    if (!response.ok) {

      const error =
        await response.text();


      console.error(
        "Gemini API error:",
        error
      );


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


    // --------------------------------------
    // READ RESPONSE
    // --------------------------------------

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


  // Show command
  addMessage(
    "YOU",
    command
  );


  input.value =
    "";


  // ----------------------------------------
  // MEMORY FIRST
  // ----------------------------------------

  const memoryReply =
    checkMemory(command);


  if (memoryReply) {

    addMessage(
      "J.A.R.V.I.S",
      memoryReply
    );


    speak(
      memoryReply
    );


    return;
  }


  // ----------------------------------------
  // GEMINI
  // ----------------------------------------

  addMessage(
    "J.A.R.V.I.S",
    "Processing..."
  );


  const reply =
    await callGemini(
      command
    );


  // Replace Processing
  const messages =
    chat.querySelectorAll(
      ".message"
    );


  const lastMessage =
    messages[messages.length - 1];


  if (lastMessage) {

    lastMessage.innerHTML = "";

    const title =
      document.createElement("strong");

    title.textContent =
      "J.A.R.V.I.S:";


    const text =
      document.createElement("span");

    text.textContent =
      " " + reply;


    lastMessage.appendChild(
      title
    );

    lastMessage.appendChild(
      text
    );

    saveChat();

  }


  speak(
    reply
  );

}


// ==========================================
// ENTER KEY
// ==========================================

if (input) {

  input.addEventListener(
    "keydown",
    function(event) {

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
// EXECUTE BUTTON
// ==========================================

if (sendBtn) {

  sendBtn.addEventListener(
    "click",
    function() {

      executeCommand();

    }
  );

}


// ==========================================
// VOICE INPUT
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
    function() {

      if (micBtn) {

        micBtn.textContent =
          "🔴";

      }

    };


  recognition.onresult =
    function(event) {

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
    function(event) {

      console.error(
        "Voice error:",
        event.error
      );

    };


  recognition.onend =
    function() {

      if (micBtn) {

        micBtn.textContent =
          "🎙️";

      }

    };


  recognition.start();

}


// ==========================================
// MICROPHONE BUTTON
// ==========================================

if (micBtn) {

  micBtn.addEventListener(
    "click",
    function() {

      startListening();

    }
  );

}


// ==========================================
// CAMERA BUTTON
// ==========================================

function openCamera() {

  if (!imageInput) {

    return;
  }


  imageInput.click();

}


if (camBtn) {

  camBtn.addEventListener(
    "click",
    function() {

      openCamera();

    }
  );

}


// ==========================================
// IMAGE SELECTED
// ==========================================

if (imageInput) {

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


      speak(
        "Image received, Boss."
      );


      imageInput.value =
        "";

    }
  );

}


// ==========================================
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

  clearBtn.addEventListener(
    "click",
    function() {

      localStorage.removeItem(
        "jarvis_memory"
      );


      localStorage.removeItem(
        "jarvis_chat"
      );


      MEMORY =
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
// LOAD CHAT
// ==========================================

loadChat();


// ==========================================
// READY
// ==========================================

console.log(
  "================================"
);

console.log(
  "J.A.R.V.I.S READY"
);

console.log(
  "Memory: ONLINE"
);

console.log(
  "Voice: READY"
);

console.log(
  "Gemini: READY"
);

console.log(
  "================================"
);
