"use strict";

/* =====================================================
   J.A.R.V.I.S MOBILE EDITION
   STABLE FRONTEND SCRIPT
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const input = document.getElementById("msg");
    const chat = document.getElementById("chat");

    const sendBtn = document.getElementById("send");
    const micBtn = document.getElementById("mic-btn");
    const camBtn = document.getElementById("cam-btn");
    const clearBtn = document.getElementById("clear-btn");

    /* IMPORTANT: your HTML uses img-input */
    const imgInput = document.getElementById("img-input");


    /* ================= API KEY ================= */

    let API_KEY = localStorage.getItem("jarvis_key");

    if (!API_KEY) {
        API_KEY = prompt("Enter your Gemini API Key:");

        if (API_KEY) {
            localStorage.setItem("jarvis_key", API_KEY);
        }
    }


    /* ================= MODELS ================= */

    const MODELS = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];


    /* ================= MEMORY ================= */

    let MEMORY = [];

    try {
        MEMORY = JSON.parse(
            localStorage.getItem("jarvis_memory") || "[]"
        );

        if (!Array.isArray(MEMORY)) {
            MEMORY = [];
        }

    } catch (error) {
        MEMORY = [];
    }


    function saveMemory() {

        localStorage.setItem(
            "jarvis_memory",
            JSON.stringify(MEMORY)
        );
    }


    /* ================= CHAT ================= */

    function addMessage(text, type = "ai") {

        if (!chat) {
            console.error("Chat element not found.");
            return;
        }

        const div = document.createElement("div");

        div.className = "msg " + type;

        div.textContent = text;

        chat.appendChild(div);

        chat.scrollTop = chat.scrollHeight;
    }


    function removeProcessing() {

        if (!chat) return;

        const messages =
            chat.querySelectorAll(".msg");

        messages.forEach(message => {

            if (
                message.textContent.includes(
                    "Processing..."
                )
            ) {
                message.remove();
            }

        });
    }


    /* ================= GEMINI ================= */

    async function askGemini(question, imageData = null) {

        if (!API_KEY) {

            addMessage(
                "J.A.R.V.I.S: API key is missing.",
                "ai"
            );

            return;
        }


        addMessage(
            "YOU: " + question,
            "user"
        );

        addMessage(
            "J.A.R.V.I.S: Processing...",
            "ai"
        );


        let lastError = null;


        for (const model of MODELS) {

            try {

                const parts = [

                    {
                        text:
                            "You are J.A.R.V.I.S, a helpful " +
                            "personal AI assistant. " +
                            "Answer clearly and naturally. " +
                            "User says: " +
                            question
                    }

                ];


                /* IMAGE */

                if (imageData) {

                    parts.push({

                        inline_data: {

                            mime_type:
                                imageData.mimeType,

                            data:
                                imageData.base64
                        }

                    });

                }


                const url =
                    "https://generativelanguage.googleapis.com/" +
                    "v1beta/models/" +
                    model +
                    ":generateContent?key=" +
                    encodeURIComponent(API_KEY);


                const response = await fetch(

                    url,

                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
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


                const data =
                    await response.json();


                /* API ERROR */

                if (!response.ok) {

                    const message =
                        data?.error?.message ||
                        "Gemini request failed.";

                    lastError =
                        new Error(message);

                    console.warn(
                        "Model failed:",
                        model,
                        message
                    );

                    continue;
                }


                /* RESPONSE */

                const answer =
                    data
                        ?.candidates?.[0]
                        ?.content?.parts
                        ?.map(part => part.text || "")
                        .join("")
                        .trim();


                if (!answer) {

                    lastError =
                        new Error(
                            "Gemini returned no answer."
                        );

                    continue;
                }


                /* SUCCESS */

                removeProcessing();

                addMessage(
                    "J.A.R.V.I.S: " + answer,
                    "ai"
                );


                /* MEMORY */

                MEMORY.push({

                    role: "user",

                    text: question

                });


                MEMORY.push({

                    role: "model",

                    text: answer

                });


                if (MEMORY.length > 30) {

                    MEMORY =
                        MEMORY.slice(-30);

                }


                saveMemory();


                /* VOICE */

                speak(answer);


                return;

            } catch (error) {

                lastError = error;

                console.error(
                    "Request error:",
                    error
                );

            }

        }


        /* ALL MODELS FAILED */

        removeProcessing();


        addMessage(

            "J.A.R.V.I.S ERROR: " +
            (lastError?.message ||
             "Unable to connect to Gemini."),

            "ai"

        );

    }


    /* ================= EXECUTE ================= */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            () => {

                const text =
                    input?.value.trim();

                if (!text) {

                    addMessage(
                        "J.A.R.V.I.S: Please enter a command.",
                        "ai"
                    );

                    return;
                }


                input.value = "";

                askGemini(text);

            }
        );

    }


    /* ================= ENTER KEY ================= */

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendBtn?.click();

                }

            }
        );

    }


    /* ================= MICROPHONE ================= */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    let recognition = null;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();

        recognition.lang = "en-IN";

        recognition.continuous = false;

        recognition.interimResults = false;


        recognition.onstart = () => {

            if (micBtn) {
                micBtn.textContent = "🔴";
            }

        };


        recognition.onend = () => {

            if (micBtn) {
                micBtn.textContent = "🎙️";
            }

        };


        recognition.onresult = event => {

            const text =
                event
                    .results[0][0]
                    .transcript;

            if (input) {
                input.value = text;
            }

        };


        recognition.onerror = event => {

            console.log(
                "Voice error:",
                event.error
            );

            if (micBtn) {
                micBtn.textContent = "🎙️";
            }

        };

    }


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            () => {

                if (!recognition) {

                    alert(
                        "Voice recognition is not supported in this browser."
                    );

                    return;
                }


                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Microphone:",
                        error
                    );

                }

            }
        );

    }


    /* ================= CAMERA ================= */

    if (camBtn && imgInput) {

        camBtn.addEventListener(
            "click",
            () => {

                imgInput.click();

            }
        );

    }


    if (imgInput) {

        imgInput.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;


                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select an image."
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = () => {

                    const result =
                        reader.result;


                    const base64 =
                        result.split(",")[1];


                    addMessage(
                        "YOU: 📸 Image selected",
                        "user"
                    );


                    askGemini(

                        "Analyze this image and describe what you see.",

                        {

                            base64: base64,

                            mimeType: file.type

                        }

                    );

                };


                reader.readAsDataURL(file);


                /* allow same image again */

                imgInput.value = "";

            }
        );

    }


    /* ================= CLEAR MEMORY ================= */

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            () => {

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


    /* ================= TEXT TO SPEECH ================= */

    function speak(text) {

        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(text);


        speech.lang = "en-IN";

        speech.rate = 0.95;

        speech.pitch = 0.8;

        speech.volume = 1;


        window.speechSynthesis.speak(
            speech
        );

    }


    /* ================= STARTUP ================= */

    console.log(
        "J.A.R.V.I.S READY"
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

});
