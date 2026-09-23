
// ==========================================
// 🤖 J.A.R.V.I.S AI AGENT
// AGENT ROUTER + TOOLS
// ==========================================

console.log("🤖 J.A.R.V.I.S AGENT LOADING...");


// ==========================================
// MAIN AGENT
// ==========================================

async function runAgent(command) {

  const text = command.toLowerCase().trim();

  console.log("🤖 AGENT RECEIVED:", command);


  // ========================================
  // TIME
  // ========================================

  if (
    text.includes("time") ||
    text.includes("సమయం") ||
    text.includes("టైమ్")
  ) {

    return agentTools.getTime();
  }


  // ========================================
  // WEATHER
  // ========================================

  if (
    text.includes("weather") ||
    text.includes("వాతావరణం")
  ) {

    return await agentTools.getWeather();
  }


  // ========================================
  // TIMER
  // ========================================

  const timerMatch = text.match(
    /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
  );


  if (
    timerMatch &&
    (
      text.includes("timer") ||
      text.includes("టైమర్")
    )
  ) {

    const amount =
      parseInt(timerMatch[1]);

    const unit =
      timerMatch[2];

    return agentTools.setTimer(
      amount,
      unit
    );
  }


  // ========================================
  // YOUTUBE
  // ========================================

  if (
    text.includes("youtube") ||
    text.startsWith("play ")
  ) {

    const query =
      command
        .replace(/youtube/ig, "")
        .replace(/search/ig, "")
        .replace(/play/ig, "")
        .trim();


    return agentTools.youtubeSearch(query);
  }


  // ========================================
  // TRANSLATE
  // ========================================

  if (text.startsWith("translate")) {

    const query =
      command
        .replace(/translate/i, "")
        .trim();


    return agentTools.translate(query);
  }


  // ========================================
  // REMEMBER
  // ========================================

  if (text.startsWith("remember ")) {

    const value =
      command
        .replace(/remember/i, "")
        .trim();


    return agentTools.remember(value);
  }


  // ========================================
  // MEMORY
  // ========================================

  if (
    text.includes("what do you remember") ||
    text.includes("my memory")
  ) {

    return agentTools.getMemory();
  }


  // ========================================
  // UNKNOWN
  // ========================================

  return null;
}


// ==========================================
// 🛠️ TOOLS
// ==========================================

const agentTools = {


  // ========================================
  // TIME
  // ========================================

  getTime() {

    return (
      "The time is " +
      new Date().toLocaleTimeString() +
      ", Boss."
    );
  },


  // ========================================
  // WEATHER
  // ========================================

  async getWeather() {

    return new Promise(resolve => {

      if (!navigator.geolocation) {

        resolve(
          "Location is not supported on this device, Boss."
        );

        return;
      }


      navigator.geolocation.getCurrentPosition(

        async position => {

          try {

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;


            const url =
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;


            const response =
              await fetch(url);


            if (!response.ok) {
              throw new Error(
                "Weather request failed"
              );
            }


            const data =
              await response.json();


            const temperature =
              data.current.temperature_2m;


            resolve(
              `The current temperature is ${temperature} degrees Celsius, Boss.`
            );


          } catch (error) {

            console.error(
              "Weather error:",
              error
            );


            resolve(
              "Weather service error, Boss."
            );
          }

        },


        () => {

          resolve(
            "Please allow location permission for weather, Boss."
          );

        }

      );

    });
  },


  // ========================================
  // TIMER
  // ========================================

  setTimer(amount, unit) {

    let multiplier = 60000;


    if (
      /second|seconds|sec|secs/i.test(unit)
    ) {
      multiplier = 1000;
    }


    if (
      /hour|hours|hr|hrs/i.test(unit)
    ) {
      multiplier = 3600000;
    }


    const duration =
      amount * multiplier;


    setTimeout(() => {

      const message =
        `Timer finished. ${amount} ${unit} completed, Boss.`;


      if (typeof speak === "function") {
        speak(message);
      }


      if (typeof addMessage === "function") {
        addMessage(
          "J.A.R.V.I.S",
          message
        );
      }

    }, duration);


    return (
      `Timer set for ${amount} ${unit}, Boss.`
    );
  },


  // ========================================
  // YOUTUBE
  // ========================================

  youtubeSearch(query) {

    if (!query) {

      return (
        "What should I search on YouTube, Boss?"
      );
    }


    const url =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(query);


    window.open(
      url,
      "_blank"
    );


    return (
      `Searching YouTube for ${query}, Boss.`
    );
  },


  // ========================================
  // TRANSLATE
  // ========================================

  async translate(query) {

    if (!query) {

      return (
        "What should I translate, Boss?"
      );
    }


    try {

      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(query) +
        "&langpair=en|te";


      const response =
        await fetch(url);


      const data =
        await response.json();


      return (
        "In Telugu: " +
        data.responseData.translatedText
      );


    } catch (error) {

      console.error(
        "Translation error:",
        error
      );


      return (
        "Translation service error, Boss."
      );
    }
  },


  // ========================================
  // REMEMBER
  // ========================================

  remember(value) {

    localStorage.setItem(
      "jarvis_memory",
      value
    );


    return (
      "I will remember that, Boss."
    );
  },


  // ========================================
  // GET MEMORY
  // ========================================

  getMemory() {

    const memory =
      localStorage.getItem(
        "jarvis_memory"
      );


    if (!memory) {

      return (
        "I don't have any saved memory yet, Boss."
      );
    }


    return (
      "I remember: " +
      memory
    );
  }

};


console.log("🤖 J.A.R.V.I.S AGENT ONLINE");
