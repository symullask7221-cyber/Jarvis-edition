// ============================================================
// J.A.R.V.I.S.
// Gemini AI + Voice Input + Voice Output
// ============================================================


// ============================================================
// 1. GEMINI API KEY
// ============================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {

    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY);
    }
}


// Stop if API key is missing
if (!API_KEY) {
    console.warn("Gemini API key was not provided.");
}


// ============================================================
// 2. GEMINI MODEL
// ============================================================

// IMPORTANT:
// Make sure this model is actually available to your Gemini API
// account. If you get 404 NOT_FOUND, replace the model name
// with one currently available to your account.

const MODELS = ["gemini-3.1-flash-lite"];


// ============================================================
// 3. HTML ELEMENTS
// ============================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send");


// ============================================================
// 4. CHECK REQUIRED HTML ELEMENTS
// ============================================================

if (!chat) {
    console.error("ERROR: Element #chat was not found.");
}

if (!input) {
    console.error("ERROR: Element #msg was not found.");
}

if (!micBtn) {
    console.error("ERROR: Element #mic-btn was not found.");
}

if (!sendBtn) {
    console.error("ERROR: Element #send was not found.");
}


// ============================================================
// 5. TEXT-TO-SPEECH VARIABLES
// ============================================================

let voices = [];


// ============================================================
// 6. LOAD AVAILABLE VOICES
// ============================================================

function loadVoices() {

    voices = window.speechSynthesis
        ? speechSynthesis.getVoices()
        : [];
}

loadVoices();

if ("speechSynthesis" in window) {

    speechSynthesis.onvoiceschanged =
        loadVoices;
}


// ============================================================
// 7. STOP CURRENT J.A.R.V.I.S. SPEECH
// ============================================================

function stopSpeaking() {

    if ("speechSynthesis" in window) {

        try {

            speechSynthesis.cancel();

        } catch (error) {

            console.error(
                "Speech cancellation error:",
                error
            );
        }
    }
}


// ============================================================
// 8. J.A.R.V.I.S. SPEAK
// ============================================================

function speak(text) {

    if (!text || !text.trim()) {
        return;
    }


    if (!("speechSynthesis" in window)) {

        console.warn(
            "Text-to-Speech is not supported."
        );

        return;
    }


    // Stop previous speech
    stopSpeaking();


    const utterance =
        new SpeechSynthesisUtterance(text);


    // Voice settings
    utterance.rate = 0.92;
    utterance.pitch = 1.10;
    utterance.volume = 1.0;


    // Find English voice
    const englishVoice =
        voices.find(voice => {

            return (
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
            );
        });


    if (englishVoice) {
        utterance.voice = englishVoice;
    }


    utterance.onstart = () => {

        console.log(
            "J.A.R.V.I.S started speaking."
        );
    };


    utterance.onend = () => {

        console.log(
            "J.A.R.V.I.S finished speaking."
        );
    };


    utterance.onerror = (event) => {

        console.error(
            "Speech error:",
            event.error
        );
    };


    speechSynthesis.speak(utterance);
}


// ============================================================
// 9. ADD MESSAGE
// ============================================================

function add(text, type) {

    if (!chat) {
        return;
    }


    const div =
        document.createElement("div");


    div.className =
        "msg " + type;


    div.innerText = text;


    chat.appendChild(div);


    chat.scrollTop =
        chat.scrollHeight;
}


// ============================================================
// 10. GEMINI API
// ============================================================

async function callGemini(prompt) {

    if (!API_KEY) {

        throw new Error(
            "Gemini API key is missing."
        );
    }


    let lastError =
        new Error(
            "Gemini request failed."
        );


    for (const model of MODELS) {

        try {

            const url =
                "https://generativelanguage.googleapis.com/" +
                "v1beta/models/" +
                model +
                ":generateContent?key=" +
                encodeURIComponent(API_KEY);


            const response =
                await fetch(url, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt
                                    }
                                ]
                            }
                        ]

                    })

                });


            const data =
                await response.json();


            // ------------------------------------------------
            // API ERROR
            // ------------------------------------------------

            if (!response.ok || data.error) {

                lastError =
                    new Error(
                        data?.error?.message ||
                        `HTTP ${response.status}`
                    );


                console.error(
                    "Gemini API error:",
                    lastError.message
                );


                // Try next model
                continue;
            }


            // ------------------------------------------------
            // CHECK CANDIDATE
            // ------------------------------------------------

            if (
                !data.candidates ||
                data.candidates.length === 0
            ) {

                throw new Error(
                    "Gemini returned no candidates."
                );
            }


            const candidate =
                data.candidates[0];


            if (
                !candidate.content ||
                !candidate.content.parts
            ) {

                throw new Error(
                    "Gemini returned an invalid response."
                );
            }


            // ------------------------------------------------
            // GET TEXT
            // ------------------------------------------------

            const reply =
                candidate.content.parts
                    .map(part => part.text || "")
                    .join("")
                    .trim();


            if (!reply) {

                throw new Error(
                    "Gemini returned an empty response."
                );
            }


            return reply;


        } catch (error) {

            lastError = error;

            console.error(
                "Gemini request failed:",
                error
            );
        }
    }


    throw lastError;
}


// ============================================================
// 11. ASK GEMINI
// ============================================================

async function askGemini(prompt) {

    add(
        "J.A.R.V.I.S: Thinking...",
        "ai"
    );


    try {

        const reply =
            await callGemini(prompt);


        // Get the latest AI message
        const lastMessage =
            chat
                ? chat.lastElementChild
                : null;


        if (lastMessage) {

            lastMessage.innerText =
                "J.A.R.V.I.S: " +
                reply;
        }


        // Speak only the latest response
        speak(reply);


    } catch (error) {

        console.error(
            "askGemini error:",
            error
        );


        const errorMessage =
            "ERROR - " +
            (
                error?.message ||
                "Unable to get a response."
            );


        const lastMessage =
            chat
                ? chat.lastElementChild
                : null;


        if (lastMessage) {

            lastMessage.innerText =
                "J.A.R.V.I.S: " +
                errorMessage;

        } else {

            add(
                "J.A.R.V.I.S: " +
                errorMessage,
                "ai"
            );
        }
    }
}


// ============================================================
// 12. SPEECH RECOGNITION
// ============================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let rec = null;

let isListening = false;


// ============================================================
// 13. CREATE SPEECH RECOGNITION
// ============================================================

if (SpeechRecognition) {

    rec =
        new SpeechRecognition();


    // English voice commands
    rec.lang = "en-US";


    // Stop after one command
    rec.continuous = false;


    // Only final result
    rec.interimResults = false;


    // --------------------------------------------------------
    // Recognition started
    // --------------------------------------------------------

    rec.onstart = () => {

        isListening = true;


        // IMPORTANT:
        // Stop JARVIS if it is currently speaking
        stopSpeaking();


        if (micBtn) {

            micBtn.innerText =
                "LISTENING...";
        }


        console.log(
            "J.A.R.V.I.S listening..."
        );
    };


    // --------------------------------------------------------
    // Recognition result
    // --------------------------------------------------------

    rec.onresult = (event) => {

        try {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (!transcript) {
                return;
            }


            console.log(
                "You said:",
                transcript
            );


            // Stop previous speech
            stopSpeaking();


            // Show user message
            add(
                "YOU: " +
                transcript,
                "user"
            );


            // Send to Gemini
            askGemini(transcript);


        } catch (error) {

            console.error(
                "Recognition result error:",
                error
            );
        }
    };


    // --------------------------------------------------------
    // Recognition ended
    // --------------------------------------------------------

    rec.onend = () => {

        isListening = false;


        if (micBtn) {

            micBtn.innerText =
                "🎙️";
        }


        console.log(
            "J.A.R.V.I.S stopped listening."
        );
    };


    // --------------------------------------------------------
    // Recognition error
    // --------------------------------------------------------

    rec.onerror = (event) => {

        console.error(
            "Speech Recognition error:",
            event.error
        );


        isListening = false;


        if (micBtn) {

            micBtn.innerText =
                "🎙️";
        }
    };


} else {

    console.error(
        "Speech Recognition is not supported by this browser."
    );
}


// ============================================================
// 14. MICROPHONE BUTTON
// ============================================================

if (micBtn) {

    micBtn.onclick = () => {


        // Stop JARVIS immediately
        stopSpeaking();


        // Browser does not support recognition
        if (!rec) {

            alert(
                "Speech Recognition is not supported in this browser."
            );

            return;
        }


        // Already listening
        if (isListening) {

            console.log(
                "Already listening..."
            );

            return;
        }


        try {

            rec.start();

        } catch (error) {

            console.error(
                "Could not start recognition:",
                error
            );
        }
    };
}


// ============================================================
// 15. SEND BUTTON
// ============================================================

if (sendBtn) {

    sendBtn.onclick = () => {


        if (!input) {
            return;
        }


        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        // Stop previous JARVIS speech
        stopSpeaking();


        // Clear input
        input.value = "";


        // Show user message
        add(
            "YOU: " +
            text,
            "user"
        );


        // Send to Gemini
        askGemini(text);
    };
}


// ============================================================
// 16. ENTER KEY
// ============================================================

if (input) {

    input.addEventListener(
        "keydown",
        (event) => {


            if (
                event.key === "Enter"
            ) {

                event.preventDefault();


                if (sendBtn) {
                    sendBtn.click();
                }
            }
        }
    );
}


// ============================================================
// 17. INITIAL MESSAGE
// ============================================================

add(
    "J.A.R.V.I.S: Online. How can I help you?",
    "ai"
);
