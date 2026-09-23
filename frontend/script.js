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
// SPEAK
// ==========================================

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }


  window.speechSynthesis.cancel();


  const speech =
    new SpeechSynthesisUtterance(text);


  speech.rate = 0.92;
  speech.pitch = 0.75;
  speech.volume = 1;


  const voices =
    window.speechSynthesis.getVoices();


  const voice =
    voices.find(v =>
      /en-US|en-GB|English/i.test(v.lang)
    );


  if (voice) {
    speech.voice = voice;
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
    "jarvis_chat",
    chat.innerHTML
  );
}


// ==========================================
// LOAD CHAT
// ==========================================

function loadChat() {

  const saved =
    localStorage.getItem(
      "jarvis_chat"
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

async function callGemini(prompt) {

  if (!API_KEY) {

    API_KEY =
      prompt(
        "Enter your Gemini API Key:"
      );


    if (!API_KEY) {

      return (
        "Gemini API key is required, Boss."
      );
    }


    API_KEY =
      API_KEY.trim();


    localStorage.setItem(
      "jarvis_key",
      API_KEY
    );
  }


  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


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
                    "You are J.A.R.V.I.S, a helpful personal AI assistant. Address the user as Boss. Be concise, friendly and useful."
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


  addMessage(
    "YOU",
    command
  );


  input.value = "";


  try {

    // ======================================
    // 🤖 AGENT
    // ======================================

    const agentResult =
      await runAgent(command);


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

      localStorage.removeItem(
        "jarvis_memory"
      );


      localStorage.removeItem(
        "jarvis_chat"
      );


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
