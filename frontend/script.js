// =====================================================
// J.A.R.V.I.S MOBILE EDITION
// COMPLETE FRONTEND SCRIPT
// =====================================================

"use strict";

// -----------------------------
// ELEMENTS
// -----------------------------
const input = document.getElementById("msg");
const chat = document.getElementById("chat");

const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");
const camBtn = document.getElementById("cam-btn");
const clearBtn = document.getElementById("clear-btn");

const imgInput = document.getElementById("cam-input");

// -----------------------------
// GEMINI SETTINGS
// -----------------------------

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY);
    }
}

// Current model
const MODEL = "gemini-3.8-flash";

const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL +
    ":generateContent";

// -----------------------------
// MEMORY
// -----------------------------

let MEMORY = JSON.parse(
    localStorage.getItem("jarvis_memory") || "[]"
);

function saveMemory() {
    localStorage.setItem(
        "jarvis_memory",
        JSON.stringify(MEMORY)
    );
}

// -----------------------------
// CHAT DISPLAY
// -----------------------------

function addMessage(text, type = "ai") {

    if (!chat) return;

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}

// -----------------------------
// GEMINI FUNCTION
// -----------------------------

async function askGemini(question, imageData = null) {

    if (!API_KEY) {
        addMessage(
            "J.A.R.V.I.S: Gemini API key is missing.",
            "ai"
        );
        return;
    }

    addMessage("YOU: " + question, "user");

    addMessage("J.A.R.V.I.S: Processing...", "ai");

    try {

        const parts = [
            {
                text:
                    "You are J.A.R.V.I.S, a helpful personal AI assistant. " +
                    "Answer clearly and briefly. " +
                    "User says: " + question
            }
        ];

        // -----------------------------
        // IMAGE INPUT
        // -----------------------------

        if (imageData) {

            parts.push({
                inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64
                }
            });
        }

        const response = await fetch(
            API_URL + "?key=" + encodeURIComponent(API_KEY),
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: parts
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error("Gemini error:", data);

            let errorText =
                data?.error?.message ||
                "Gemini API request failed.";

            throw new Error(errorText);
        }

        const answer =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!answer) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        // Remove "Processing..." message
        const messages =
            chat ? chat.querySelectorAll(".msg") : [];

        if (messages.length > 0) {
            const last = messages[messages.length - 1];

            if (
                last.textContent.includes("Processing...")
            ) {
                last.remove();
            }
        }

        addMessage(
            "J.A.R.V.I.S: " + answer,
            "ai"
        );

        // Save memory
        MEMORY.push({
            role: "user",
            text: question
        });

        MEMORY.push({
            role: "model",
            text: answer
        });

        // Keep memory manageable
        if (MEMORY.length > 30) {
            MEMORY = MEMORY.slice(-30);
        }

        saveMemory();

        // Voice response
        speak(answer);

    } catch (error) {

        console.error(error);

        const messages =
            chat ? chat.querySelectorAll(".msg") : [];

        if (messages.length > 0) {
            const last = messages[messages.length - 1];

            if (
                last.textContent.includes("Processing...")
            ) {
                last.remove();
            }
        }

        addMessage(
            "J.A.R.V.I.S ERROR: " + error.message,
            "ai"
        );
    }
}

// -----------------------------
// EXECUTE BUTTON
// -----------------------------

if (sendBtn) {

    sendBtn.addEventListener("click", function () {

        const text = input?.value.trim();

        if (!text) {
            addMessage(
                "J.A.R.V.I.S: Please enter a command.",
                "ai"
            );
            return;
        }

        input.value = "";

        askGemini(text);
    });
}

// -----------------------------
// ENTER KEY
// -----------------------------

if (input) {

    input.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            if (sendBtn) {
                sendBtn.click();
            }
        }
    });
}

// =====================================================
// MICROPHONE
// =====================================================

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.onstart = function () {

        if (micBtn) {
            micBtn.textContent = "🔴";
        }
    };

    recognition.onend = function () {

        if (micBtn) {
            micBtn.textContent = "🎙️";
        }
    };

    recognition.onresult = function (event) {

        const text =
            event.results[0][0].transcript;

        if (input) {
            input.value = text;
        }
    };

    recognition.onerror = function (event) {

        console.error(
            "Speech recognition error:",
            event.error
        );

        if (micBtn) {
            micBtn.textContent = "🎙️";
        }
    };
}

if (micBtn) {

    micBtn.addEventListener("click", function () {

        if (!recognition) {

            alert(
                "Voice recognition is not supported by this browser."
            );

            return;
        }

        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }
    });
}

// =====================================================
// CAMERA
// =====================================================

// IMPORTANT:
// HTML uses id="cam-input"
// NOT id="img-input"

if (camBtn && imgInput) {

    camBtn.addEventListener("click", function () {

        imgInput.click();

    });
}

if (imgInput) {

    imgInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image file."
                );

                return;
            }

            const reader = new FileReader();

            reader.onload = function () {

                const result =
                    reader.result;

                const base64 =
                    result.split(",")[1];

                const mimeType =
                    file.type;

                addMessage(
                    "YOU: 📸 Image selected",
                    "user"
                );

                askGemini(
                    "Analyze this image and describe what you see.",
                    {
                        base64: base64,
                        mimeType: mimeType
                    }
                );
            };

            reader.readAsDataURL(file);

            // Allows selecting the same image again
            imgInput.value = "";
        }
    );
}

// =====================================================
// CLEAR MEMORY
// =====================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            MEMORY = [];

            localStorage.removeItem(
                "jarvis_memory"
            );

            if (chat) {
                chat.innerHTML = "";
            }

            addMessage(
                "J.A.R.V.I.S: Memory cleared successfully.",
                "ai"
            );
        }
    );
}

// =====================================================
// TEXT TO SPEECH
// =====================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    speech.rate = 0.95;

    speech.pitch = 0.8;

    speech.volume = 1;

    window.speechSynthesis.speak(speech);
}

// =====================================================
// STARTUP
// =====================================================

console.log(
    "J.A.R.V.I.S Mobile Edition loaded successfully."
);

console.log(
    "Execute:",
    !!sendBtn
);

console.log(
    "Microphone:",
    !!micBtn
);

console.log(
    "Camera:",
    !!camBtn,
    "Input:",
    !!imgInput
);

console.log(
    "Clear Memory:",
    !!clearBtn
);
