document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // J.A.R.V.I.S CONFIGURATION
    // ==============================

    const API_KEY_STORAGE = "jarvis_key";

    const MODELS = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];

    // ==============================
    // DOM ELEMENTS
    // ==============================

    const chat = document.getElementById("chat");
    const input = document.getElementById("msg");
    const sendBtn = document.getElementById("send");
    const micBtn = document.getElementById("mic-btn");
    const camBtn = document.getElementById("cam-btn");
    const clearBtn = document.getElementById("clear-btn");
    const imgInput = document.getElementById("img-input");

    // ==============================
    // API KEY
    // ==============================

    let API_KEY = localStorage.getItem(API_KEY_STORAGE);

    if (!API_KEY) {
        API_KEY = prompt("Enter your Gemini API Key:");

        if (API_KEY) {
            localStorage.setItem(API_KEY_STORAGE, API_KEY.trim());
            API_KEY = API_KEY.trim();
        }
    }

    // ==============================
    // PERMANENT MEMORY
    // ==============================

    let PERMANENT_MEMORY =
        JSON.parse(localStorage.getItem("jarvis_permanent_memory")) || {};

    let CHAT_MEMORY =
        JSON.parse(localStorage.getItem("jarvis_chat_memory")) || [];

    function savePermanentMemory() {
        localStorage.setItem(
            "jarvis_permanent_memory",
            JSON.stringify(PERMANENT_MEMORY)
        );
    }

    function saveChatMemory() {
        localStorage.setItem(
            "jarvis_chat_memory",
            JSON.stringify(CHAT_MEMORY)
        );
    }

    // ==============================
    // CHAT DISPLAY
    // ==============================

    function addMessage(sender, text) {

        const message = document.createElement("div");

        message.className =
            sender === "You"
                ? "user-message"
                : "jarvis-message";

        message.innerText =
            sender + ": " + text;

        chat.appendChild(message);

        chat.scrollTop = chat.scrollHeight;
    }

    // ==============================
    // AUTOMATIC PERSONAL MEMORY
    // ==============================

    function detectPersonalMemory(text) {

        let match;

        // ------------------------------
        // MY NAME IS ...
        // ------------------------------

        match = text.match(
            /^my\s+name\s+is\s+(.+)$/i
        );

        if (match) {

            const name = match[1].trim();

            if (name) {

                PERMANENT_MEMORY.name = name;

                savePermanentMemory();

                return `Okay. I'll remember that your name is ${name}.`;
            }
        }

        // ------------------------------
        // CALL ME ...
        // ------------------------------

        match = text.match(
            /^call\s+me\s+(.+)$/i
        );

        if (match) {

            const name = match[1].trim();

            if (name) {

                PERMANENT_MEMORY.name = name;

                savePermanentMemory();

                return `Got it. I'll call you ${name}.`;
            }
        }

        // ------------------------------
        // I LIVE IN ...
        // ------------------------------

        match = text.match(
            /^i\s+live\s+in\s+(.+)$/i
        );

        if (match) {

            const location = match[1].trim();

            PERMANENT_MEMORY.location = location;

            savePermanentMemory();

            return `Okay. I'll remember that you live in ${location}.`;
        }

        // ------------------------------
        // MY FAVORITE COLOR IS ...
        // ------------------------------

        match = text.match(
            /^my\s+favorite\s+color\s+is\s+(.+)$/i
        );

        if (match) {

            const value = match[1].trim();

            PERMANENT_MEMORY["favorite color"] = value;

            savePermanentMemory();

            return `Okay. I'll remember that your favorite color is ${value}.`;
        }

        // ------------------------------
        // MY FAVORITE FOOD IS ...
        // ------------------------------

        match = text.match(
            /^my\s+favorite\s+food\s+is\s+(.+)$/i
        );

        if (match) {

            const value = match[1].trim();

            PERMANENT_MEMORY["favorite food"] = value;

            savePermanentMemory();

            return `Okay. I'll remember that your favorite food is ${value}.`;
        }

        // ------------------------------
        // MY BIRTHDAY IS ...
        // ------------------------------

        match = text.match(
            /^my\s+birthday\s+is\s+(.+)$/i
        );

        if (match) {

            const value = match[1].trim();

            PERMANENT_MEMORY.birthday = value;

            savePermanentMemory();

            return `Okay. I'll remember your birthday is ${value}.`;
        }

        // ------------------------------
        // MY SCHOOL IS ...
        // ------------------------------

        match = text.match(
            /^my\s+school\s+is\s+(.+)$/i
        );

        if (match) {

            const value = match[1].trim();

            PERMANENT_MEMORY.school = value;

            savePermanentMemory();

            return `Okay. I'll remember that your school is ${value}.`;
        }

        // ------------------------------
        // GENERIC: MY X IS Y
        // ------------------------------

        match = text.match(
            /^my\s+(.+?)\s+is\s+(.+)$/i
        );

        if (match) {

            const key = match[1].trim().toLowerCase();
            const value = match[2].trim();

            if (
                key &&
                value &&
                key !== "name"
            ) {

                PERMANENT_MEMORY[key] = value;

                savePermanentMemory();

                return `Okay. I'll remember that your ${key} is ${value}.`;
            }
        }

        return null;
    }

    // ==============================
    // MEMORY COMMANDS
    // ==============================

    function processMemoryCommand(text) {

        const lower = text.toLowerCase().trim();

        // ------------------------------
        // AUTOMATIC PERSONAL MEMORY
        // ------------------------------

        const personalMemory =
            detectPersonalMemory(text);

        if (personalMemory) {
            return personalMemory;
        }

        // ------------------------------
        // REMEMBER THAT ...
        // ------------------------------

        let rememberMatch =
            text.match(
                /^(?:remember|remember that|please remember)\s+(.+)$/i
            );

        if (rememberMatch) {

            const information =
                rememberMatch[1].trim();

            const nameMatch =
                information.match(
                    /^name\s+is\s+(.+)$/i
                );

            if (nameMatch) {

                const name =
                    nameMatch[1].trim();

                PERMANENT_MEMORY.name = name;

                savePermanentMemory();

                return `Okay. I'll remember that your name is ${name}.`;
            }

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
                    keyValueMatch[2].trim();

                PERMANENT_MEMORY[key] = value;

                savePermanentMemory();

                return `Okay. I'll remember that your ${key} is ${value}.`;
            }

            const memoryId =
                "memory_" + Date.now();

            PERMANENT_MEMORY[memoryId] =
                information;

            savePermanentMemory();

            return `Okay. I'll remember that: ${information}`;
        }

        // ------------------------------
        // WHAT IS MY NAME?
        // ------------------------------

        if (
            lower === "what is my name" ||
            lower === "what is my name?" ||
            lower === "what's my name" ||
            lower === "what's my name?" ||
            lower.includes("do you know my name")
        ) {

            if (PERMANENT_MEMORY.name) {

                return `Your name is ${PERMANENT_MEMORY.name}.`;
            }

            return "I don't know your name yet. Tell me: My name is ...";
        }

        // ------------------------------
        // WHAT DO YOU REMEMBER?
        // ------------------------------

        if (
            lower === "what do you remember" ||
            lower === "what do you remember?" ||
            lower.includes("what did you remember")
        ) {

            const keys =
                Object.keys(PERMANENT_MEMORY);

            if (keys.length === 0) {

                return "I don't have any saved permanent memories yet.";
            }

            return keys
                .map(
                    key =>
                        "• " +
                        key +
                        ": " +
                        PERMANENT_MEMORY[key]
                )
                .join("\n");
        }

        // ------------------------------
        // FORGET EVERYTHING
        // ------------------------------

        if (
            lower === "forget everything" ||
            lower === "forget all memory" ||
            lower === "forget all memories"
        ) {

            PERMANENT_MEMORY = {};
            CHAT_MEMORY = [];

            savePermanentMemory();
            saveChatMemory();

            return "All saved memories have been forgotten.";
        }

        // ------------------------------
        // FORGET MY NAME
        // ------------------------------

        if (
            lower === "forget my name" ||
            lower === "forget my name."
        ) {

            if (PERMANENT_MEMORY.name) {

                delete PERMANENT_MEMORY.name;

                savePermanentMemory();

                return "Okay. I forgot your name.";
            }

            return "I don't have your name saved.";
        }

        // ------------------------------
        // FORGET X
        // ------------------------------

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

                return `Okay. I forgot your ${key}.`;
            }

            return `I couldn't find a saved memory for ${key}.`;
        }

        return null;
    }

    // ==============================
    // MEMORY CONTEXT FOR GEMINI
    // ==============================

    function getMemoryContext() {

        const keys =
            Object.keys(PERMANENT_MEMORY);

        if (keys.length === 0) {

            return "No permanent personal information is currently saved.";
        }

        return keys
            .map(
                key =>
                    `${key}: ${PERMANENT_MEMORY[key]}`
            )
            .join("\n");
    }

    // ==============================
    // GEMINI API
    // ==============================

    async function callGemini(userText) {

        if (!API_KEY) {

            return "Gemini API key is missing.";
        }

        const memoryContext =
            getMemoryContext();

        const recentChat =
            CHAT_MEMORY
                .slice(-10)
                .map(
                    item =>
                        `${item.role}: ${item.text}`
                )
                .join("\n");

        const systemPrompt = `
You are J.A.R.V.I.S, a helpful personal AI assistant.

Address the user naturally and respectfully.

IMPORTANT:
Use the saved personal memory below whenever relevant.

SAVED PERSONAL MEMORY:
${memoryContext}

RECENT CONVERSATION:
${recentChat}

Do not claim that you remember something unless it is present in the saved memory or conversation.

Keep responses clear and useful.
`;

        for (const model of MODELS) {

            try {

                const url =
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

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
                                    role: "user",

                                    parts: [

                                        {
                                            text:
                                                systemPrompt +
                                                "\n\nUSER:\n" +
                                                userText
                                        }

                                    ]
                                }

                            ],

                            generationConfig: {

                                temperature: 0.7,

                                maxOutputTokens: 1000
                            }

                        })
                    });

                const data =
                    await response.json();

                if (
                    response.ok &&
                    data.candidates &&
                    data.candidates.length
                ) {

                    const reply =
                        data.candidates[0]
                            .content
                            .parts
                            .map(part => part.text || "")
                            .join("");

                    return reply.trim();
                }

            } catch (error) {

                console.error(
                    "Gemini error:",
                    error
                );
            }
        }

        return "I'm having trouble connecting to the Gemini AI service right now.";
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

        speechSynthesis.cancel();

        const cleanText =
            text
                .replace(/[*#•]/g, "")
                .replace(/\n+/g, " ");

        const utterance =
            new SpeechSynthesisUtterance(
                cleanText
            );

        utterance.lang = "en-IN";
        utterance.rate = 0.95;
        utterance.pitch = 0.75;
        utterance.volume = 1;

        const voices =
            speechSynthesis.getVoices();

        const preferredVoice =
            voices.find(
                voice =>
                    /male/i.test(voice.name) &&
                    /en-IN|en-US|en-GB/i.test(
                        voice.lang
                    )
            );

        if (preferredVoice) {

            utterance.voice =
                preferredVoice;
        }

        speechSynthesis.speak(
            utterance
        );
    }

    // ==============================
    // EXECUTE COMMAND
    // ==============================

    async function executeCommand() {

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        addMessage(
            "You",
            text
        );

        input.value = "";

        // ------------------------------
        // MEMORY COMMAND
        // ------------------------------

        const memoryReply =
            processMemoryCommand(text);

        if (memoryReply) {

            addMessage(
                "J.A.R.V.I.S",
                memoryReply
            );

            speak(memoryReply);

            CHAT_MEMORY.push({
                role: "user",
                text: text
            });

            CHAT_MEMORY.push({
                role: "assistant",
                text: memoryReply
            });

            saveChatMemory();

            return;
        }

        // ------------------------------
        // SAVE CHAT
        // ------------------------------

        CHAT_MEMORY.push({
            role: "user",
            text: text
        });

        saveChatMemory();

        // ------------------------------
        // GEMINI
        // ------------------------------

        addMessage(
            "J.A.R.V.I.S",
            "Processing..."
        );

        const lastMessage =
            chat.lastElementChild;

        try {

            const reply =
                await callGemini(text);

            if (lastMessage) {

                lastMessage.innerText =
                    "J.A.R.V.I.S: " +
                    reply;
            }

            CHAT_MEMORY.push({
                role: "assistant",
                text: reply
            });

            saveChatMemory();

            speak(reply);

        } catch (error) {

            console.error(error);

            if (lastMessage) {

                lastMessage.innerText =
                    "J.A.R.V.I.S: Unable to process the command.";
            }
        }
    }

    // ==============================
    // EXECUTE BUTTON
    // ==============================

    sendBtn.addEventListener(
        "click",
        executeCommand
    );

    // ==============================
    // ENTER KEY
    // ==============================

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                executeCommand();
            }
        }
    );

    // ==============================
    // MICROPHONE
    // ==============================

    let recognition = null;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();

        recognition.lang = "en-IN";

        recognition.continuous = false;

        recognition.interimResults = false;

        recognition.onstart = () => {

            micBtn.innerText = "🔴";
        };

        recognition.onend = () => {

            micBtn.innerText = "🎙️";
        };

        recognition.onresult =
            event => {

                const transcript =
                    event.results[0][0].transcript;

                input.value =
                    transcript;

                executeCommand();
            };

        recognition.onerror =
            event => {

                console.error(
                    "Speech recognition error:",
                    event.error
                );

                micBtn.innerText = "🎙️";
            };

        micBtn.addEventListener(
            "click",
            () => {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(error);
                }
            }
        );

    } else {

        micBtn.addEventListener(
            "click",
            () => {

                alert(
                    "Voice input is not supported in this browser."
                );
            }
        );
    }

    // ==============================
    // CAMERA
    // ==============================

    if (camBtn && imgInput) {

        camBtn.addEventListener(
            "click",
            () => {

                imgInput.click();
            }
        );

        imgInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files[0];

                if (!file) {
                    return;
                }

                addMessage(
                    "You",
                    "📷 Image selected for analysis."
                );

                try {

                    const base64 =
                        await fileToBase64(file);

                    const imageReply =
                        await analyzeImage(
                            base64,
                            file.type
                        );

                    addMessage(
                        "J.A.R.V.I.S",
                        imageReply
                    );

                    speak(imageReply);

                } catch (error) {

                    console.error(error);

                    addMessage(
                        "J.A.R.V.I.S",
                        "I couldn't analyze that image."
                    );
                }

                imgInput.value = "";
            }
        );
    }

    // ==============================
    // FILE TO BASE64
    // ==============================

    function fileToBase64(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload = () => {

                    const result =
                        reader.result;

                    resolve(
                        result.split(",")[1]
                    );
                };

                reader.onerror =
                    reject;

                reader.readAsDataURL(file);
            }
        );
    }

    // ==============================
    // IMAGE ANALYSIS
    // ==============================

    async function analyzeImage(
        base64,
        mimeType
    ) {

        if (!API_KEY) {

            return "Gemini API key is missing.";
        }

        for (const model of MODELS) {

            try {

                const url =
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

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
                                    role: "user",

                                    parts: [

                                        {
                                            text:
                                                "Analyze this image and describe what you see clearly."
                                        },

                                        {
                                            inline_data: {

                                                mime_type:
                                                    mimeType,

                                                data:
                                                    base64
                                            }
                                        }

                                    ]
                                }

                            ]

                        })
                    });

                const data =
                    await response.json();

                if (
                    response.ok &&
                    data.candidates &&
                    data.candidates.length
                ) {

                    return data.candidates[0]
                        .content
                        .parts
                        .map(
                            part =>
                                part.text || ""
                        )
                        .join("")
                        .trim();
                }

            } catch (error) {

                console.error(
                    "Image analysis error:",
                    error
                );
            }
        }

        return "I couldn't analyze the image.";
    }

    // ==============================
    // CLEAR MEMORY
    // ==============================

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Delete all J.A.R.V.I.S memories?"
                    );

                if (!confirmed) {
                    return;
                }

                PERMANENT_MEMORY = {};
                CHAT_MEMORY = [];

                savePermanentMemory();
                saveChatMemory();

                chat.innerHTML = "";

                const message =
                    "All saved memories have been cleared.";

                addMessage(
                    "J.A.R.V.I.S",
                    message
                );

                speak(message);
            }
        );
    }

    // ==============================
    // STARTUP
    // ==============================

    console.log(
        "J.A.R.V.I.S SYSTEM ONLINE"
    );

    console.log(
        "Permanent Memory:",
        PERMANENT_MEMORY
    );

    console.log(
        "Chat Memory:",
        CHAT_MEMORY
    );

});
