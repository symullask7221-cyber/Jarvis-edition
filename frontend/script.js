document.addEventListener("DOMContentLoaded", function () {

    console.log("JARVIS SCRIPT LOADED");

    const sendBtn = document.getElementById("send");
    const micBtn = document.getElementById("mic-btn");
    const camBtn = document.getElementById("cam-btn");
    const clearBtn = document.getElementById("clear-btn");
    const input = document.getElementById("msg");
    const chat = document.getElementById("chat");

    console.log("Buttons:", {
        sendBtn,
        micBtn,
        camBtn,
        clearBtn,
        input,
        chat
    });


    sendBtn.addEventListener("click", function () {

        chat.innerHTML +=
            '<div class="msg">EXECUTE BUTTON WORKING ✅</div>';

    });


    micBtn.addEventListener("click", function () {

        chat.innerHTML +=
            '<div class="msg">MIC BUTTON WORKING 🎙️</div>';

    });


    camBtn.addEventListener("click", function () {

        chat.innerHTML +=
            '<div class="msg">CAMERA BUTTON WORKING 📷</div>';

    });


    clearBtn.addEventListener("click", function () {

        chat.innerHTML = "";

    });


    input.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            sendBtn.click();

        }

    });

});
