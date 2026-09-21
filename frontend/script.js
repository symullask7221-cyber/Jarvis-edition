"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // ELEMENTS
    // ==============================

    const input = document.getElementById("msg");
    const chat = document.getElementById("chat");

    const sendBtn = document.getElementById("send");
    const micBtn = document.getElementById("mic-btn");
    const camBtn = document.getElementById("cam-btn");
    const clearBtn = document.getElementById("clear-btn");
    const imgInput = document.getElementById("img-input");


    // ==============================
    // API KEY
    // ==============================

    let API_KEY =
        localStorage.getItem("jarvis_key");

    if (!API_KEY) {

        API_KEY = prompt(
            "Enter your Gemini API Key:"
        );

        if (API_KEY) {

            API_KEY = API_KEY.trim();

            localStorage.setItem(
                "jarvis_key",
                API_KEY
            );
        }
    }


    // ==============================
    // MODELS
    // ==============================

    const MODELS = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];


    // ==============================
    // PERMANENT MEMORY
    // ==============================

    const MEMORY_KEY =
        "jarvis_permanent_memory";

    let PERMANENT_MEMORY = {};

    try {

        PERMANENT_MEMORY =
            JSON.parse(
                localStorage.getItem(
                    MEMORY_KEY
                ) || "{}"
            );

        if (
            typeof PERMANENT_MEMORY !==
            "object" ||
            Array.isArray(PERMANENT_MEMORY)
        ) {

            PERMANENT_MEMORY = {};

        }

    } catch (error) {

        PERMANENT_MEMORY = {};

    }


    function savePermanentMemory() {

        localStorage.setItem(
            MEMORY_KEY,
            JSON.stringify(
                PERMANENT_MEMORY
            )
        );

    }


    // ==============================
    // CHAT MEMORY
    // ==============================

    const CHAT_MEMORY_KEY =
        "jarvis_chat_memory";

    let CHAT_MEMORY = [];

    try {

        CHAT_MEMORY =
            JSON.parse(
                localStorage.getItem(
                    CHAT_MEMORY_KEY
                ) || "[]"
            );

        if (!Array.isArray(CHAT_MEMORY)) {
            CHAT_MEMORY = [];
        }

    } catch (error) {

        CHAT_MEMORY = [];

    }


    function saveChatMemory() {

        localStorage.setItem(
            CHAT_MEMORY_KEY,
            JSON.stringify(
                CHAT_MEMORY
            )
        );

    }


    // ==============================
    // DISPLAY MESSAGE
    // ==============================

    function addMessage(
        text,
        type = "ai"
    ) {

        if (!chat) return;

        const div =
            document.createElement("div");

        div.className =
            "msg " + type;

        div.textContent =
            text;

        chat.appendChild(div);

        chat.scrollTop =
            chat.scrollHeight;
    }


    function removeProcessing() {

        if (!chat) return;

        chat.querySelectorAll(
            ".msg"
        ).forEach(message => {

            if (
                message.textContent.includes(
                    "Processing..."
                )
            ) {

                message.remove();

            }

        });

    }


    // ==============================
    // MEMORY COMMANDS
    // ==============================

    function processMemoryCommand(
        text
    ) {

        const lower =
            text.toLowerCase().trim();


        // --------------------------
        // REMEMBER
        // --------------------------

        const rememberMatch =
            text.match(
                /^(?:remember|remember that|please remember)\s+(?:my\s+)?(.+)$/i
            );


        if (rememberMatch) {

            let information =
                rememberMatch[1].trim();


            // Example:
            // "my name is John"
            const nameMatch =
                information.match(
                    /^name\s+is\s+(.+)$/i
                );


            if (nameMatch) {

                const name =
                    nameMatch[1].trim();

                PERMANENT_MEMORY.name =
                    name;

                savePermanentMemory();

                return (
                    "Okay. I'll remember that your name is " +
                    name + "."
                );
            }


            // Example:
            // "my favorite color is blue"
            const keyValueMatch =
                information.match(
                    /^(.+?)\s+is\s+(.+)$/i
                );


            if (keyValueMatch) {

                const key =
                    keyValueMatch[1]
                        .trim()
                        .toLowerCase();

                const value =
                    keyValueMatch[2]
                        .trim();

                PERMANENT_MEMORY[key] =
                    value;

                savePermanentMemory();

                return (
                    "Okay. I'll remember that your " +
                    key +
                    " is " +
                    value +
                    "."
                );
            }


            // Generic memory
            const memoryId =
                "memory_" +
                Date.now();

            PERMANENT_MEMORY[memoryId] =
                information;

            savePermanentMemory();

            return (
                "Okay. I'll remember that: " +
                information
            );
        }


        // --------------------------
        // WHAT DO YOU REMEMBER?
        // --------------------------

        if (
            lower ===
            "what do you remember" ||
            lower ===
            "what do you remember?" ||
            lower.includes(
                "what did you remember"
            )
        ) {

            const keys =
                Object.keys(
                    PERMANENT_MEMORY
                );


            if (keys.length === 0) {

                return (
                    "I don't have any saved permanent memories yet."
                );

            }


            return keys
                .map(key => {

                    return (
                        "• " +
                        key +
                        ": " +
                        PERMANENT_MEMORY[key]
                    );

                })
                .join("\n");
        }


        // --------------------------
        // WHAT IS MY NAME?
        // --------------------------

        if (
            lower.includes(
                "what is my name"
            ) ||
            lower.includes(
                "what's my name"
            ) ||
            lower.includes(
                "do you know my name"
            )
        ) {

            if (
                PERMANENT_MEMORY.name
            ) {

                return (
                    "Your name is " +
                    PERMANENT_MEMORY.name +
                    "."
                );

            }

            return (
                "You haven't asked me to remember your name yet."
            );
        }


        // --------------------------
        // FORGET EVERYTHING
        // --------------------------

        if (
            lower ===
            "forget everything" ||
            lower ===
            "forget all memory" ||
            lower ===
            "forget all memories"
        ) {

            PERMANENT_MEMORY = {};

            CHAT_MEMORY = [];

            savePermanentMemory();
            saveChatMemory();

            return (
                "All saved memories have been forgotten."
            );
        }


        // --------------------------
        // FORGET MY NAME
        // --------------------------

        if (
            lower.includes(
                "forget my name"
            )
        ) {

            if (
                PERMANENT_MEMORY.name
            ) {

                delete PERMANENT_MEMORY.name;

                savePermanentMemory();

                return (
                    "Okay. I forgot your name."
                );

            }

            return (
                "I don't have your name saved."
            );
        }


        // --------------------------
        // FORGET SPECIFIC MEMORY
        // --------------------------

        const forgetMatch =
            text.match(
                /^forget\s+(?:my\s+)?(.+)$/i
            );


        if (forgetMatch) {

            const key =
                forgetMatch[1]
                    .trim()
                    .toLowerCase();


            if (
                Object.prototype.hasOwnProperty.call(
                    PERMANENT_MEMORY,
                    key
                )
            ) {

                delete PERMANENT_MEMORY[key];

                savePermanentMemory();

                return (
                    "Okay. I forgot your " +
                    key +
                    "."
                );

            }

            return (
                "I couldn't find a saved memory for " +
                key +
                "."
            );
        }


        return null;
    }


    // ==============================
    // BUILD MEMORY CONTEXT
    // ==============================

    function getMemoryContext() {

        const permanent =
            Object.keys(
                PERMANENT_MEMORY
            )
            .map(key =>
                `${key}: ${PERMANENT_MEMORY[key]}`
            )
            .join("\n");


        const recentChat =
            CHAT_MEMORY
                .slice(-10)
                .map(item =>
                    `${item.role}: ${item.text}`
                )
                .join("\n");


        return {
            permanent,
            recentChat
        };
    }


    // ==============================
    // GEMINI
    // ==============================

    async function askGemini(
        question,
        imageData = null
    ) {

        if (!API_KEY) {

            addMessage(
                "J.A.R.V.I.S: Gemini API key is missing.",
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


        const memory =
            getMemoryContext();


        for (
            const model of MODELS
        ) {

            try {

                let prompt =

                    "You are J.A.R.V.I.S, " +
                    "a helpful personal AI assistant.\n\n" +

                    "IMPORTANT MEMORY RULES:\n" +

                    "Use the saved memory below when relevant. " +
                    "Do not claim to remember something that is not listed.\n\n";


                if (
                    memory.permanent
                ) {

                    prompt +=
                        "PERMANENT MEMORY:\n" +
                        memory.permanent +
                        "\n\n";

                }


                if (
                    memory.recentChat
                ) {

                    prompt +=
                        "RECENT CONVERSATION:\n" +
                        memory.recentChat +
                        "\n\n";

                }


                prompt +=
                    "CURRENT USER MESSAGE:\n" +
                    question;


                const parts = [

                    {
                        text: prompt
                    }

                ];


                // IMAGE
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
                    encodeURIComponent(
                        API_KEY
                    );


                const response =
                    await fetch(
                        url,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

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


                if (!response.ok) {

                    const message =
                        data?.error?.message ||
                        "Gemini request failed.";

                    lastError =
                        new Error(
                            message
                        );

                    continue;
                }


                const answer =
                    data
                        ?.candidates?.[0]
                        ?.content?.parts
                        ?.map(
                            part =>
                                part.text || ""
                        )
                        .join("")
                        .trim();


                if (!answer) {

                    lastError =
                        new Error(
                            "Gemini returned no answer."
                        );

                    continue;

                }


                removeProcessing();


                addMessage(
                    "J.A.R.V.I.S: " +
                    answer,
                    "ai"
                );


                // SAVE CHAT
                CHAT_MEMORY.push({

                    role: "user",

                    text: question

                });


                CHAT_MEMORY.push({

                    role: "assistant",

                    text: answer

                });


                if (
                    CHAT_MEMORY.length > 30
                ) {

                    CHAT_MEMORY =
                        CHAT_MEMORY.slice(
                            -30
                        );

                }


                saveChatMemory();


                speak(answer);


                return;


            } catch (error) {

                lastError =
                    error;

                console.error(
                    "Gemini error:",
                    error
                );

            }

        }


        removeProcessing();


        addMessage(
            "J.A.R.V.I.S ERROR: " +
            (
                lastError?.message ||
                "Unable to connect to Gemini."
            ),
            "ai"
        );

    }


    // ==============================
    // EXECUTE
    // ==============================

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            async () => {

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


                // MEMORY COMMAND FIRST
                const memoryReply =
                    processMemoryCommand(
                        text
                    );


                if (memoryReply) {

                    addMessage(
                        "YOU: " + text,
                        "user"
                    );

                    addMessage(
                        "J.A.R.V.I.S: " +
                        memoryReply,
                        "ai"
                    );

                    speak(memoryReply);

                    return;
                }


                // NORMAL AI
                await askGemini(
                    text
                );

            }
        );

    }


    // ==============================
    // ENTER
    // ==============================

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendBtn?.click();

                }

            }
        );

    }


    // ==============================
    // VOICE INPUT
    // ==============================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    let recognition = null;


    if (SpeechRecognition) {

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


        recognition.onend =
            () => {

                if (micBtn) {

                    micBtn.textContent =
                        "🎙️";

                }

            };


        recognition.onresult =
            event => {

                const text =
                    event
                        .results[0][0]
                        .transcript;


                if (input) {

                    input.value =
                        text;

                }

            };


        recognition.onerror =
            event => {

                console.log(
                    "Voice error:",
                    event.error
                );

                if (micBtn) {

                    micBtn.textContent =
                        "🎙️";

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
                        "Mic error:",
                        error
                    );

                }

            }
        );

    }


    // ==============================
    // CAMERA 📷
    // ==============================

    if (
        camBtn &&
        imgInput
    ) {

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


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Please select an image."
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        const result =
                            reader.result;


                        const base64 =
                            result
                                .split(",")[1];


                        askGemini(

                            "Analyze this image carefully and tell me what you see.",

                            {

                                base64:
                                    base64,

                                mimeType:
                                    file.type

                            }

                        );

                    };


                reader.readAsDataURL(
                    file
                );


                imgInput.value = "";

            }
        );

    }


    // ==============================
    // CLEAR ALL MEMORY
    // ==============================

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            () => {

                PERMANENT_MEMORY = {};

                CHAT_MEMORY = [];


                localStorage.removeItem(
                    MEMORY_KEY
                );

                localStorage.removeItem(
                    CHAT_MEMORY_KEY
                );


                if (chat) {

                    chat.innerHTML =
                        "";

                }


                addMessage(
                    "J.A.R.V.I.S: All memory cleared successfully.",
                    "ai"
                );

            }
        );

    }


    // ==============================
    // TEXT TO SPEECH
    // ==============================

    function speak(text) {

        if (
            !("speechSynthesis" in window)
        ) {

            return;
        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(
                text
            );


        speech.lang =
            "en-IN";

        speech.rate =
            0.95;

        speech.pitch =
            0.8;

        speech.volume =
            1;


        window.speechSynthesis.speak(
            speech
        );

    }


    // ==============================
    // READY
    // ==============================

    console.log(
        "J.A.R.V.I.S READY"
    );

    console.log(
        "Execute:",
        !!sendBtn
    );

    console.log(
        "Mic:",
        !!micBtn
    );

    console.log(
        "Camera:",
        !!camBtn,
        !!imgInput
    );

    console.log(
        "Memory:",
        true
    );

});
