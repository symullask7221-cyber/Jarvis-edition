// ======================================================
// J.A.R.V.I.S MOBILE EDITION
// Gemini AI + Voice Recognition + Male Voice TTS
// ======================================================


// ======================================================
// 1. GEMINI API KEY
// ======================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {

    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        API_KEY = API_KEY.trim();
        localStorage.setItem("jarvis_key", API_KEY);
    }
}


// ======================================================
// 2. GEMINI MODEL
// ======================================================

const MODEL = "gemini-3.6-flash";


// ======================================================
// 3. GET HTML ELEMENTS
// ======================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");


// ======================================================
// 4. ADD MESSAGE TO CHAT
// ======================================================

function add(text, type) {

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// ======================================================
// 5. GEMINI AI
// ======================================================

async function callGemini(promptText) {

    if (!API_KEY) {
        throw new Error("Gemini API key is missing.");
    }

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent?key=" +
        encodeURIComponent(API_KEY);


    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            contents: [
                {
                    parts: [
                        {
                            text:
                                "You are J.A.R.V.I.S, a helpful AI assistant. " +
                                "Answer clearly and naturally. " +
                                "Keep responses concise unless detailed information is requested.\n\n" +
                                promptText
                        }
                    ]
                }
            ]

        })

    });


    const data = await response.json();


    // API ERROR
    if (!response.ok) {

        let message =
            data?.error?.message ||
            "Unknown Gemini API error.";

        if (response.status === 429) {

            message =
                "Gemini quota exceeded. Please check your API quota or try again later.";

        }

        throw new Error(message);
    }


    // RESPONSE CHECK
    const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!reply) {

        throw new Error(
            "Gemini returned an empty response."
        );
    }


    return reply;
}


// ======================================================
// 6. ASK JARVIS
// ======================================================

async function askGemini(promptText) {

    add(
        "J.A.R.V.I.S: Thinking...",
        "ai"
    );


    try {

        const reply =
            await callGemini(promptText);


        chat.lastChild.innerText =
            "J.A.R.V.I.S: " + reply;


        // Speak AI response
        speak(reply);


    } catch (error) {

        console.error(
            "JARVIS ERROR:",
            error
        );


        chat.lastChild.innerText =
            "J.A.R.V.I.S: ERROR - " +
            error.message;
    }
}


// ======================================================
// 7. SEND BUTTON
// ======================================================

if (sendBtn) {

    sendBtn.onclick = function () {

        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        add(
            "YOU: " + text,
            "user"
        );


        input.value = "";


        askGemini(text);
    };

}


// ======================================================
// 8. ENTER KEY SEND
// ======================================================

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendBtn.click();
            }

        }
    );

}


// ======================================================
// 9. SPEECH RECOGNITION
// ======================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    // English voice recognition
    recognition.lang = "en-IN";


    recognition.continuous = false;


    recognition.interimResults = false;


    recognition.onstart = function () {

        if (micBtn) {
            micBtn.innerText =
                "LISTENING...";
        }
    };


    recognition.onresult = function (event) {

        const text =
            event.results[0][0].transcript;


        add(
            "YOU: " + text,
            "user"
        );


        askGemini(text);
    };


    recognition.onerror = function (event) {

        console.error(
            "Speech recognition error:",
            event.error
        );


        if (micBtn) {
            micBtn.innerText = "🎙";
        }
    };


    recognition.onend = function () {

        if (micBtn) {
            micBtn.innerText = "🎙";
        }
    };


    if (micBtn) {

        micBtn.onclick = function () {

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Microphone already active."
                );

            }

        };

    }

} else {

    console.log(
        "Speech Recognition is not supported."
    );


    if (micBtn) {

        micBtn.onclick = function () {

            alert(
                "Voice recognition is not supported in this browser."
            );

        };

    }

}


// ======================================================
// 10. TEXT TO SPEECH
// ======================================================

let voices = [];


function loadVoices() {

    voices =
        window.speechSynthesis.getVoices();

}


loadVoices();


speechSynthesis.onvoiceschanged =
    loadVoices;


// ======================================================
// 11. JARVIS VOICE
// ======================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {

        console.log(
            "Text-to-Speech is not supported."
        );

        return;
    }


    // Stop previous speech
    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(text);


    // JARVIS-style voice settings
    utterance.rate = 0.95;

    utterance.pitch = 0.75;

    utterance.volume = 1.0;


    // Try to find an English male voice
    const maleVoice =
        voices.find(function (voice) {

            return (
                /male|david|mark|daniel|alex|george|fred/i
                    .test(voice.name)
                &&
                voice.lang.startsWith("en")
            );

        });


    // Fallback English voice
    const englishVoice =
        voices.find(function (voice) {

            return voice.lang.startsWith("en");

        });


    if (maleVoice) {

        utterance.voice =
            maleVoice;

    } else if (englishVoice) {

        utterance.voice =
            englishVoice;

    }


    speechSynthesis.speak(
        utterance
    );

}


// ======================================================
// 12. TEST JARVIS VOICE
// ======================================================

function testJarvisVoice() {

    speak(
        "Hello. I am J.A.R.V.I.S. Your mobile AI assistant is online."
    );

}


// ======================================================
// 13. INITIAL STATUS
// ======================================================

console.log(
    "J.A.R.V.I.S MOBILE EDITION ONLINE"
);

console.log(
    "Gemini model:",
    MODEL
);
