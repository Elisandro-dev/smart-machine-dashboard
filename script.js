// =====================================================
// SMART MACHINE MONITOR - DASHBOARD
// =====================================================

// Broker HiveMQ usando WebSocket seguro
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";

// Mesmo tópico utilizado pelo ESP32
const topic = "smartmachine/elisandro/machine01/data";

// ID único para o navegador
const clientId =
  "Dashboard-" +
  Math.random()
    .toString(16)
    .substring(2, 10);

// =====================================================
// ELEMENTOS HTML
// =====================================================

const machineStatus =
  document.getElementById("machineStatus");

const production =
  document.getElementById("production");

const speed =
  document.getElementById("speed");

const temperature =
  document.getElementById("temperature");

const emergency =
  document.getElementById("emergency");

const alarm =
  document.getElementById("alarm");

const mqttStatus =
  document.getElementById("mqttStatus");

const mqttDot =
  document.getElementById("mqttDot");

const emergencyBanner =
  document.getElementById("emergencyBanner");

const eventLog =
  document.getElementById("eventLog");

const lastUpdate =
  document.getElementById("lastUpdate");


// =====================================================
// GRÁFICO VELOCIDADE
// =====================================================

const speedCtx =
  document
    .getElementById("speedChart")
    .getContext("2d");

const speedChart =
  new Chart(speedCtx, {

    type: "line",

    data: {

      labels: [],

      datasets: [
        {
          label: "Speed (pcs/min)",
          data: [],
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },

    options: {

      responsive: true,

      animation: false,

      scales: {

        y: {
          beginAtZero: true
        }

      }

    }

  });


// =====================================================
// GRÁFICO TEMPERATURA
// =====================================================

const temperatureCtx =
  document
    .getElementById("temperatureChart")
    .getContext("2d");

const temperatureChart =
  new Chart(temperatureCtx, {

    type: "line",

    data: {

      labels: [],

      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },

    options: {

      responsive: true,

      animation: false,

      scales: {

        y: {
          suggestedMin: 30,
          suggestedMax: 70
        }

      }

    }

  });


// =====================================================
// CONEXÃO MQTT
// =====================================================

console.log("Connecting to MQTT...");

const client =
  mqtt.connect(
    brokerUrl,
    {
      clientId: clientId,

      clean: true,

      reconnectPeriod: 2000,

      connectTimeout: 10000
    }
  );


// =====================================================
// MQTT CONECTADO
// =====================================================

client.on("connect", () => {

  console.log("MQTT connected");

  mqttStatus.textContent =
    "MQTT Online";

  mqttDot.classList.remove(
    "offline"
  );

  mqttDot.classList.add(
    "online"
  );

  addEvent(
    "Dashboard connected to MQTT broker"
  );

  client.subscribe(
    topic,
    (error) => {

      if (error) {

        console.error(
          "Subscribe error:",
          error
        );

        addEvent(
          "Error subscribing to MQTT topic"
        );

      } else {

        console.log(
          "Subscribed:",
          topic
        );

        addEvent(
          "Subscribed to machine topic"
        );
      }

    }
  );

});


// =====================================================
// MQTT OFFLINE
// =====================================================

client.on("offline", () => {

  mqttStatus.textContent =
    "MQTT Offline";

  mqttDot.classList.remove(
    "online"
  );

  mqttDot.classList.add(
    "offline"
  );

});


// =====================================================
// MQTT ERROR
// =====================================================

client.on("error", (error) => {

  console.error(
    "MQTT Error:",
    error
  );

});


// =====================================================
// RECEBE DADOS DA MÁQUINA
// =====================================================

client.on(
  "message",
  (receivedTopic, message) => {

    if (receivedTopic !== topic) {
      return;
    }

    try {

      const data =
        JSON.parse(
          message.toString()
        );

      console.log(
        "Machine data:",
        data
      );

      updateDashboard(
        data
      );

    } catch (error) {

      console.error(
        "Invalid JSON:",
        error
      );

    }

  }
);


// =====================================================
// ATUALIZA DASHBOARD
// =====================================================

function updateDashboard(data) {

  const previousStatus =
    machineStatus.textContent.trim();

  // ---------------- STATUS ----------------

  machineStatus.textContent =
    data.status || "---";

  machineStatus.classList.remove(
    "status-running",
    "status-alarm",
    "status-emergency"
  );

  if (
    data.status ===
    "RUNNING"
  ) {

    machineStatus.classList.add(
      "status-running"
    );

  }

  if (
    data.status ===
    "ALARM"
  ) {

    machineStatus.classList.add(
      "status-alarm"
    );

  }

  if (
    data.status ===
    "EMERGENCY"
  ) {

    machineStatus.classList.add(
      "status-emergency"
    );

  }


  // ---------------- PRODUÇÃO ----------------

  production.textContent =
    data.production ?? 0;


  // ---------------- VELOCIDADE ----------------

  speed.textContent =
    Number(
      data.speed ?? 0
    ).toFixed(1);


  // ---------------- TEMPERATURA ----------------

  temperature.textContent =
    Number(
      data.temperature ?? 0
    ).toFixed(1);


  // ---------------- EMERGÊNCIA ----------------

  emergency.textContent =
    data.emergency
      ? "ON"
      : "OFF";


  // ---------------- ALARME ----------------

  alarm.textContent =
    data.alarm === 0
      ? "NONE"
      : data.alarm;


  // =====================================================
  // BANNER DE EMERGÊNCIA
  // =====================================================

  if (data.emergency) {

    emergencyBanner.classList.remove(
      "hidden"
    );

  } else {

    emergencyBanner.classList.add(
      "hidden"
    );

  }


  // =====================================================
  // DATA / HORA
  // =====================================================

  const now =
    new Date();

  const time =
    now.toLocaleTimeString();

  lastUpdate.textContent =
    "Last update: " +
    time;


  // =====================================================
  // GRÁFICOS
  // =====================================================

  addChartPoint(
    speedChart,
    time,
    Number(
      data.speed ?? 0
    )
  );

  addChartPoint(
    temperatureChart,
    time,
    Number(
      data.temperature ?? 0
    )
  );


  // =====================================================
  // EVENTOS
  // =====================================================

  if (
    previousStatus !== data.status
  ) {

    addEvent(
      "Machine status changed: " +
      data.status
    );

  }

}


// =====================================================
// ADICIONA PONTO NO GRÁFICO
// =====================================================

function addChartPoint(
  chart,
  label,
  value
) {

  chart.data.labels.push(
    label
  );

  chart.data.datasets[0]
    .data
    .push(
      value
    );


  // Mantém últimos 30 pontos

  if (
    chart.data.labels.length >
    30
  ) {

    chart.data.labels.shift();

    chart
      .data
      .datasets[0]
      .data
      .shift();
  }

  chart.update();

}


// =====================================================
// LOG DE EVENTOS
// =====================================================

function addEvent(message) {

  const now =
    new Date();

  const time =
    now.toLocaleTimeString();

  const item =
    document.createElement(
      "div"
    );

  item.className =
    "event-item";

  item.innerHTML =
    `<span class="event-time">${time}</span>${message}`;

  eventLog.prepend(
    item
  );


  // Limita histórico
  // visual a 50 eventos

  if (
    eventLog.children.length >
    50
  ) {

    eventLog.removeChild(
      eventLog.lastChild
    );

  }

}