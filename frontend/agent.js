// ==========================================
// J.A.R.V.I.S AI AGENT
// ==========================================

console.log("JARVIS AGENT LOADING...");

window.runAgent = async function(command) {

  const text = String(command || "")
    .toLowerCase()
    .trim();

  // TIME
  if (
    text.includes("time") ||
    text.includes("సమయం") ||
    text.includes("టైమ్")
  ) {
    return (
      "The time is " +
      new Date().toLocaleTimeString() +
      ", Boss."
    );
  }


  // WEATHER
  if (
    text.includes("weather") ||
    text.includes("వాతావరణం")
  ) {
    return await getWeather();
  }


  // TIMER
  const timerMatch = text.match(
    /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
  );

  if (
    timerMatch &&
    (
      text.includes("timer") ||
      text.includes("టైమర్") ||
      text.includes("set timer")
    )
  ) {

    const amount = parseInt(timerMatch[1]);
    const unit = timerMatch[2];

    let multiplier = 60000;

    if (/second|sec/i.test(unit)) {
      multiplier = 1000;
    }

    if (/hour|hr/i.test(unit)) {
      multiplier = 3600000;
    }

    setTimeout(() => {

      const msg =
        `Timer finished. ${amount} ${unit} completed, Boss.`;

      if (typeof window.speak === "function") {
        window.speak(msg);
      }

      if (typeof window.addMessage === "function") {
        window.addMessage("J.A.R.V.I.S", msg);
      }

    }, amount * multiplier);

    return `Timer set for ${amount} ${unit}, Boss.`;
  }


  // YOUTUBE
  if (
    text.includes("youtube") ||
    text.startsWith("play ")
  ) {

    const query = command
      .replace(/youtube/ig, "")
      .replace(/search/ig, "")
      .replace(/play/ig, "")
      .trim();

    if (!query) {
      return "What should I search on YouTube, Boss?";
    }

    window.open(
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(query),
      "_blank"
    );

    return `Searching YouTube for ${query}, Boss.`;
  }


  // TRANSLATE
  if (text.startsWith("translate")) {

    const query =
      command.replace(/translate/i, "").trim();

    if (!query) {
      return "What should I translate, Boss?";
    }

    try {

      const response = await fetch(
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(query) +
        "&langpair=en|te"
      );

      const data = await response.json();

      return (
        "In Telugu: " +
        data.responseData.translatedText
      );

    } catch (error) {

      return "Translation service error, Boss.";
    }
  }


  // REMEMBER
  if (text.startsWith("remember ")) {

    const memory =
      command.replace(/remember/i, "").trim();

    localStorage.setItem(
      "jarvis_memory",
      memory
    );

    return "I will remember that, Boss.";
  }


  // MEMORY
  if (
    text.includes("what do you remember") ||
    text.includes("my memory")
  ) {

    const memory =
      localStorage.getItem("jarvis_memory");

    if (!memory) {
      return "I don't have any saved memory yet, Boss.";
    }

    return "I remember: " + memory;
  }


  // NO TOOL
  return null;
};


// ==========================================
// WEATHER FUNCTION
// ==========================================

async function getWeather() {

  return new Promise(resolve => {

    if (!navigator.geolocation) {

      resolve(
        "Location is not supported, Boss."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(

      async position => {

        try {

          const lat =
            position.coords.latitude;

          const lon =
            position.coords.longitude;

          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;

          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error("Weather failed");
          }

          const data =
            await response.json();

          const temperature =
            data.current.temperature_2m;

          resolve(
            `The current temperature is ${temperature} degrees Celsius, Boss.`
          );

        } catch (error) {

          console.error(error);

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
};


console.log("JARVIS AGENT ONLINE");
