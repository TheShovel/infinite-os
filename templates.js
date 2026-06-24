// ═══════════════════════════════════════════════════════════════════════
// Infinite OS — Template App Generators
// Fallback when the AI model isn't ready yet.
// ═══════════════════════════════════════════════════════════════════════

const TemplateApps = (window.TemplateApps = window.TemplateApps || {
  state: {},
});
TemplateApps.state ||= {};
TemplateApps.state.todos ||= {};
TemplateApps.state.paint ||= {};
TemplateApps.state.clock ||= {};
TemplateApps.state.tictac ||= {};

function templateId(desc) {
  return (
    String(desc || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "app"
  );
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch];
  });
}

function appRoot(id) {
  return document.querySelector(`.app-${id}`);
}

function genTemplate(desc) {
  const d = String(desc || "").toLowerCase();
  const id = templateId(d);
  if (d.includes("calc") || d.includes("math")) return tCalc(id);
  if (d.includes("todo") || d.includes("task") || d.includes("list"))
    return tTodo(id);
  if (d.includes("note") || d.includes("memo")) return tNote(id);
  if (d.includes("paint") || d.includes("draw") || d.includes("sketch"))
    return tPaint(id);
  if (
    d.includes("clock") ||
    d.includes("time") ||
    d.includes("timer") ||
    d.includes("stopwatch")
  )
    return tClock(id);
  if (d.includes("weather")) return tWeather(id);
  if (d.includes("chat") || d.includes("ai")) return tChat(id);
  if (d.includes("tic") || d.includes("tac") || d.includes("toe"))
    return tTac(id);
  if (d.includes("radio") || d.includes("music") || d.includes("garden"))
    return tRadio(id);
  return tGeneric(id, desc);
}

// ─── Shared template runtime ──────────────────────────────────────────

TemplateApps.calcPress = function calcPress(id, value) {
  const el = document.getElementById("cd-" + id);
  if (!el) return;
  const current = el.textContent;
  if (current === "0" && value === ".") el.textContent = "0.";
  else
    el.textContent =
      current === "0" || current === "Error" ? value : current + value;
};

TemplateApps.calcClear = function calcClear(id) {
  const el = document.getElementById("cd-" + id);
  if (el) el.textContent = "0";
};

TemplateApps.calcEval = function calcEval(id) {
  const el = document.getElementById("cd-" + id);
  if (!el) return;
  const expr = el.textContent;
  if (!/^[\d+\-*/().\s]+$/.test(expr)) {
    el.textContent = "Error";
    return;
  }
  try {
    const result = Function('"use strict";return (' + expr + ")")();
    el.textContent = Number.isFinite(result) ? String(result) : "Error";
  } catch (_) {
    el.textContent = "Error";
  }
};

TemplateApps.todoLoad = function todoLoad(id) {
  if (!TemplateApps.state.todos[id]) {
    try {
      TemplateApps.state.todos[id] = JSON.parse(
        localStorage.getItem("td-" + id) || "[]",
      );
    } catch (_) {
      TemplateApps.state.todos[id] = [];
    }
  }
  return TemplateApps.state.todos[id];
};

TemplateApps.todoSave = function todoSave(id) {
  try {
    localStorage.setItem("td-" + id, JSON.stringify(TemplateApps.todoLoad(id)));
  } catch (_) {}
};

TemplateApps.todoRender = function todoRender(id) {
  const list = document.getElementById("tl-" + id);
  if (!list) return;
  const items = TemplateApps.todoLoad(id);
  list.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    if (item.d) li.className = "d";

    const toggle = document.createElement("span");
    toggle.style.cursor = "pointer";
    toggle.textContent = item.d ? "✅" : "⬜";
    toggle.onclick = () => TemplateApps.todoToggle(id, index);

    const text = document.createElement("span");
    text.textContent = item.t;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "✕";
    remove.onclick = () => TemplateApps.todoRemove(id, index);

    li.append(toggle, text, remove);
    list.appendChild(li);
  });
  TemplateApps.todoSave(id);
};

TemplateApps.todoInit = function todoInit(id) {
  TemplateApps.todoLoad(id);
  TemplateApps.todoRender(id);
};

TemplateApps.todoAdd = function todoAdd(id) {
  const input = document.getElementById("ti-" + id);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  TemplateApps.todoLoad(id).push({ t: text, d: false });
  input.value = "";
  TemplateApps.todoRender(id);
};

TemplateApps.todoToggle = function todoToggle(id, index) {
  const item = TemplateApps.todoLoad(id)[index];
  if (!item) return;
  item.d = !item.d;
  TemplateApps.todoRender(id);
};

TemplateApps.todoRemove = function todoRemove(id, index) {
  TemplateApps.todoLoad(id).splice(index, 1);
  TemplateApps.todoRender(id);
};

TemplateApps.noteInit = function noteInit(id) {
  const textarea = document.getElementById("ne-" + id);
  if (!textarea) return;
  try {
    textarea.value = localStorage.getItem("note-" + id) || "";
  } catch (_) {}
};

TemplateApps.noteSave = function noteSave(id) {
  const textarea = document.getElementById("ne-" + id);
  const status = document.getElementById("ns-" + id);
  if (!textarea) return;
  try {
    localStorage.setItem("note-" + id, textarea.value);
  } catch (_) {}
  if (status) {
    status.textContent = "Saved!";
    setTimeout(() => {
      if (status.isConnected) status.textContent = "";
    }, 1500);
  }
};

TemplateApps.noteClear = function noteClear(id) {
  const textarea = document.getElementById("ne-" + id);
  if (textarea) textarea.value = "";
  try {
    localStorage.removeItem("note-" + id);
  } catch (_) {}
};

TemplateApps.paintResize = function paintResize(id) {
  const state = TemplateApps.state.paint[id];
  if (!state || !state.canvas.isConnected) return;
  const rect = state.canvas.parentElement.getBoundingClientRect();
  state.canvas.width = Math.max(240, rect.width - 32);
  state.canvas.height = Math.min(400, Math.max(180, window.innerHeight * 0.4));
  state.ctx.lineCap = "round";
  state.ctx.lineJoin = "round";
};

TemplateApps.paintInit = function paintInit(id) {
  const canvas = document.getElementById("cv-" + id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  TemplateApps.state.paint[id] = {
    canvas,
    ctx,
    drawing: false,
    tool: "pen",
    color: "#7c3aed",
    size: 3,
    lastX: 0,
    lastY: 0,
  };

  TemplateApps.paintResize(id);
  canvas.onmousedown = (event) => {
    const state = TemplateApps.state.paint[id];
    state.drawing = true;
    state.lastX = event.offsetX;
    state.lastY = event.offsetY;
  };
  canvas.onmousemove = (event) => {
    const state = TemplateApps.state.paint[id];
    if (!state || !state.drawing) return;
    state.ctx.beginPath();
    state.ctx.moveTo(state.lastX, state.lastY);
    state.ctx.lineTo(event.offsetX, event.offsetY);
    state.ctx.strokeStyle = state.tool === "eraser" ? "#1a1a2e" : state.color;
    state.ctx.lineWidth = state.size;
    state.ctx.stroke();
    state.lastX = event.offsetX;
    state.lastY = event.offsetY;
  };
  canvas.onmouseup = canvas.onmouseleave = () => {
    const state = TemplateApps.state.paint[id];
    if (state) state.drawing = false;
  };
};

TemplateApps.paintSetTool = function paintSetTool(id, tool) {
  const state = TemplateApps.state.paint[id];
  if (!state) return;
  state.tool = tool;
  const pen = document.getElementById("pn-" + id);
  const eraser = document.getElementById("er-" + id);
  if (pen) pen.className = tool === "pen" ? "on" : "";
  if (eraser) eraser.className = tool === "eraser" ? "on" : "";
};

TemplateApps.paintSetColor = function paintSetColor(id) {
  const state = TemplateApps.state.paint[id];
  const input = document.getElementById("cl-" + id);
  if (state && input) state.color = input.value;
};

TemplateApps.paintSetSize = function paintSetSize(id) {
  const state = TemplateApps.state.paint[id];
  const input = document.getElementById("sz-" + id);
  const label = document.getElementById("sl-" + id);
  if (!state || !input) return;
  state.size = Number(input.value) || 1;
  if (label) label.textContent = state.size + "px";
};

TemplateApps.paintClear = function paintClear(id) {
  const state = TemplateApps.state.paint[id];
  if (state) state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
};

TemplateApps.clockInit = function clockInit(id) {
  const existing = TemplateApps.state.clock[id];
  if (existing) {
    clearInterval(existing.clockInterval);
    clearInterval(existing.timerInterval);
  }
  TemplateApps.state.clock[id] = {
    clockInterval: setInterval(() => TemplateApps.clockUpdate(id), 1000),
    timerInterval: null,
    remaining: 0,
    running: false,
  };
  TemplateApps.clockUpdate(id);
};

TemplateApps.clockUpdate = function clockUpdate(id) {
  const time = document.getElementById("ct-" + id);
  const date = document.getElementById("cd-" + id);
  const state = TemplateApps.state.clock[id];
  if (!time || !date) {
    if (state) clearInterval(state.clockInterval);
    return;
  }
  const now = new Date();
  time.textContent = now.toLocaleTimeString();
  date.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

TemplateApps.clockMode = function clockMode(id, mode) {
  const clockButton = document.getElementById("mcc-" + id);
  const timerButton = document.getElementById("mt-" + id);
  const timerPanel = document.getElementById("ts-" + id);
  if (clockButton) clockButton.className = mode === "clock" ? "on" : "";
  if (timerButton) timerButton.className = mode === "timer" ? "on" : "";
  if (timerPanel)
    timerPanel.style.display = mode === "timer" ? "block" : "none";
};

TemplateApps.timerStart = function timerStart(id) {
  const state = TemplateApps.state.clock[id];
  if (!state || state.running) return;
  const minutes =
    parseInt(document.getElementById("tmn-" + id)?.value, 10) || 0;
  const seconds =
    parseInt(document.getElementById("tsc-" + id)?.value, 10) || 0;
  state.remaining = minutes * 60 + seconds;
  if (state.remaining <= 0) return;
  state.running = true;
  clearInterval(state.timerInterval);
  TemplateApps.timerTick(id);
  state.timerInterval = setInterval(() => TemplateApps.timerTick(id), 1000);
};

TemplateApps.timerTick = function timerTick(id) {
  const state = TemplateApps.state.clock[id];
  const display = document.getElementById("td-" + id);
  if (!state || !display) return;
  const minutes = Math.floor(state.remaining / 60);
  const seconds = state.remaining % 60;
  display.textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  if (state.remaining <= 0) {
    clearInterval(state.timerInterval);
    state.running = false;
    if (typeof os !== "undefined" && os.notify)
      os.notify("⏱️ Timer", "Time is up!");
    return;
  }
  state.remaining--;
};

TemplateApps.timerStop = function timerStop(id) {
  const state = TemplateApps.state.clock[id];
  if (!state) return;
  clearInterval(state.timerInterval);
  state.running = false;
};

TemplateApps.weatherInit = function weatherInit(id) {
  const fallback = { latitude: 40.7128, longitude: -74.006 };
  const load = (coords) =>
    TemplateApps.weatherFetch(id, coords.latitude, coords.longitude);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords),
      () => load(fallback),
    );
  } else {
    load(fallback);
  }
};

TemplateApps.weatherEmoji = function weatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
};

TemplateApps.weatherFetch = function weatherFetch(id, latitude, longitude) {
  const root = appRoot(id);
  const detail = document.getElementById("wd-" + id);
  if (!root) return;
  fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(latitude) +
      "&longitude=" +
      encodeURIComponent(longitude) +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
  )
    .then((response) => response.json())
    .then((data) => {
      const current = data.current;
      if (!current) throw new Error("No current weather data");
      const badge = root.querySelector(".bg");
      if (badge)
        badge.textContent = TemplateApps.weatherEmoji(
          current.weather_code || 0,
        );
      document.getElementById("wt-" + id).textContent =
        Math.round(current.temperature_2m) + "°C";
      document.getElementById("wd-" + id).textContent =
        "Feels like " + Math.round(current.apparent_temperature) + "°C";
      document.getElementById("wh-" + id).textContent =
        current.relative_humidity_2m + "%";
      document.getElementById("ww-" + id).textContent =
        Math.round(current.wind_speed_10m) + " km/h";
    })
    .catch(() => {
      if (detail) detail.textContent = "Could not load weather";
    });
};

TemplateApps.chatSend = function chatSend(id) {
  const input = document.getElementById("ci-" + id);
  const messages = document.getElementById("cms-" + id);
  if (!input || !messages) return;
  const text = input.value.trim();
  if (!text) return;

  const user = document.createElement("div");
  user.className = "msg u";
  user.textContent = text;
  messages.appendChild(user);
  input.value = "";

  const bot = document.createElement("div");
  bot.className = "msg b";
  bot.textContent =
    "Chat AI not available in template mode. Wait for the AI model to load!";
  messages.appendChild(bot);
  messages.scrollTop = messages.scrollHeight;
};

TemplateApps.tictacInit = function tictacInit(id) {
  TemplateApps.state.tictac[id] = {
    board: ["", "", "", "", "", "", "", "", ""],
    turn: "X",
    over: false,
    win: null,
  };
  TemplateApps.tictacRender(id);
};

TemplateApps.tictacRender = function tictacRender(id) {
  const state = TemplateApps.state.tictac[id];
  const status = document.getElementById("st-" + id);
  const grid = document.getElementById("g-" + id);
  if (!state || !status || !grid) return;

  status.textContent = state.win
    ? state.turn + " wins!"
    : state.over
      ? "Draw!"
      : state.turn + "'s turn";

  grid.innerHTML = "";
  state.board.forEach((value, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    if (value === "X") button.style.color = "#7c3aed";
    if (value === "O") button.style.color = "#10b981";
    if (state.win?.includes(index)) button.className = "w";
    button.onclick = () => TemplateApps.tictacMove(id, index);
    grid.appendChild(button);
  });
};

TemplateApps.tictacMove = function tictacMove(id, index) {
  const state = TemplateApps.state.tictac[id];
  if (!state || state.over || state.board[index]) return;
  state.board[index] = state.turn;

  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  state.win =
    wins.find(
      ([a, b, c]) =>
        state.board[a] &&
        state.board[a] === state.board[b] &&
        state.board[b] === state.board[c],
    ) || null;
  if (state.win) state.over = true;
  else if (state.board.every(Boolean)) state.over = true;
  else state.turn = state.turn === "X" ? "O" : "X";
  TemplateApps.tictacRender(id);
};

TemplateApps.tictacReset = function tictacReset(id) {
  TemplateApps.tictacInit(id);
};

function tCalc(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif}
.app-${id} h2{margin:0 0 16px;font-size:20px}
.app-${id} .d{background:#0003;padding:12px;border-radius:8px;font-size:24px;text-align:right;margin-bottom:12px;font-variant-numeric:tabular-nums}
.app-${id} .g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.app-${id} .g button{padding:12px;border:none;border-radius:6px;font-size:16px;cursor:pointer;background:#ffffff1a;color:inherit}
.app-${id} .g button:hover{background:#ffffff33}
.app-${id} .g .o{background:#7c3aed55}
.app-${id} .g .e{background:#7c3aed;color:#fff}
</style>
<h2>🧮 Calculator</h2>
<div class="d" id="cd-${id}">0</div>
<div class="g">
  <button onclick="window.TemplateApps.calcPress('${id}','7')">7</button>
  <button onclick="window.TemplateApps.calcPress('${id}','8')">8</button>
  <button onclick="window.TemplateApps.calcPress('${id}','9')">9</button>
  <button class="o" onclick="window.TemplateApps.calcPress('${id}','/')">÷</button>
  <button onclick="window.TemplateApps.calcPress('${id}','4')">4</button>
  <button onclick="window.TemplateApps.calcPress('${id}','5')">5</button>
  <button onclick="window.TemplateApps.calcPress('${id}','6')">6</button>
  <button class="o" onclick="window.TemplateApps.calcPress('${id}','*')">×</button>
  <button onclick="window.TemplateApps.calcPress('${id}','1')">1</button>
  <button onclick="window.TemplateApps.calcPress('${id}','2')">2</button>
  <button onclick="window.TemplateApps.calcPress('${id}','3')">3</button>
  <button class="o" onclick="window.TemplateApps.calcPress('${id}','-')">−</button>
  <button onclick="window.TemplateApps.calcPress('${id}','0')">0</button>
  <button onclick="window.TemplateApps.calcPress('${id}','.')">.</button>
  <button onclick="window.TemplateApps.calcClear('${id}')">C</button>
  <button class="o" onclick="window.TemplateApps.calcPress('${id}','+')">+</button>
  <button class="e" style="grid-column:span 4" onclick="window.TemplateApps.calcEval('${id}')">=</button>
</div></div>`;
}

function tTodo(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif}
.app-${id} h2{margin:0 0 16px;font-size:20px}
.app-${id} .r{display:flex;gap:8px;margin-bottom:12px}
.app-${id} input{flex:1;padding:8px 12px;border:1px solid #ffffff33;border-radius:6px;background:#ffffff0d;color:inherit;font-size:14px}
.app-${id} .ab{padding:8px 16px;border:none;border-radius:6px;background:#7c3aed;color:#fff;cursor:pointer}
.app-${id} ul{list-style:none;padding:0;margin:0}
.app-${id} li{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;margin-bottom:4px;background:#ffffff0d}
.app-${id} li.d{text-decoration:line-through;opacity:.5}
.app-${id} li button{margin-left:auto;background:none;border:none;color:#ff4444;cursor:pointer;font-size:16px}
</style>
<h2>✅ To-Do List</h2>
<div class="r">
  <input id="ti-${id}" placeholder="Add a task..." onkeydown="if(event.key==='Enter')window.TemplateApps.todoAdd('${id}')">
  <button class="ab" onclick="window.TemplateApps.todoAdd('${id}')">Add</button>
</div>
<ul id="tl-${id}"></ul>
<script>window.TemplateApps.todoInit('${id}')</script></div>`;
}

function tNote(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif;display:flex;flex-direction:column;height:100%}
.app-${id} h2{margin:0 0 16px;font-size:20px}
.app-${id} textarea{flex:1;padding:12px;border:1px solid #ffffff33;border-radius:8px;background:#ffffff0d;color:inherit;font-size:14px;resize:none;font-family:inherit}
.app-${id} textarea:focus{outline:none;border-color:#7c3aed}
.app-${id} .b{display:flex;gap:8px;margin-top:8px}
.app-${id} .b button{padding:6px 14px;border:none;border-radius:6px;cursor:pointer}
.app-${id} .s{background:#7c3aed;color:#fff}
.app-${id} .c{background:#ffffff1a;color:inherit}
</style>
<h2>📝 Notes</h2>
<textarea id="ne-${id}" placeholder="Write something..."></textarea>
<div class="b">
  <button class="s" onclick="window.TemplateApps.noteSave('${id}')">💾 Save</button>
  <button class="c" onclick="window.TemplateApps.noteClear('${id}')">🗑️ Clear</button>
  <span id="ns-${id}" style="margin-left:auto;font-size:12px;opacity:.6;align-self:center"></span>
</div>
<script>window.TemplateApps.noteInit('${id}')</script></div>`;
}

function tPaint(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:16px;font-family:system-ui,sans-serif}
.app-${id} h2{margin:0 0 12px;font-size:20px}
.app-${id} .tools{display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap}
.app-${id} .tools button{padding:6px 12px;border:none;border-radius:6px;cursor:pointer;background:#ffffff1a;color:inherit;font-size:13px}
.app-${id} .tools .on{background:#7c3aed;color:#fff}
.app-${id} canvas{border-radius:8px;cursor:crosshair;width:100%;background:#1a1a2e}
.app-${id} input[type=color]{width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;padding:0;background:none}
.app-${id} input[type=range]{width:80px}
</style>
<h2>🎨 Paint</h2>
<div class="tools">
  <button class="on" id="pn-${id}" onclick="window.TemplateApps.paintSetTool('${id}','pen')">✏️ Pen</button>
  <button id="er-${id}" onclick="window.TemplateApps.paintSetTool('${id}','eraser')">🧹 Eraser</button>
  <input type="color" id="cl-${id}" value="#7c3aed" onchange="window.TemplateApps.paintSetColor('${id}')">
  <input type="range" id="sz-${id}" min="1" max="20" value="3" oninput="window.TemplateApps.paintSetSize('${id}')">
  <span style="font-size:12px;opacity:.6" id="sl-${id}">3px</span>
  <button onclick="window.TemplateApps.paintClear('${id}')">🗑️ Clear</button>
</div>
<canvas id="cv-${id}"></canvas>
<script>window.TemplateApps.paintInit('${id}')</script></div>`;
}

function tClock(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif;text-align:center}
.app-${id} .tm{font-size:48px;font-weight:200;font-variant-numeric:tabular-nums;margin:20px 0}
.app-${id} .dt{font-size:16px;opacity:.6;margin-bottom:20px}
.app-${id} .br{display:flex;gap:8px;justify-content:center}
.app-${id} .br button{padding:8px 20px;border:none;border-radius:6px;cursor:pointer;background:#ffffff1a;color:inherit;font-size:14px}
.app-${id} .br .on{background:#7c3aed;color:#fff}
</style>
<h2>🕐 Clock</h2>
<div class="tm" id="ct-${id}">--:--:--</div>
<div class="dt" id="cd-${id}">---</div>
<div class="br">
  <button class="on" id="mcc-${id}" onclick="window.TemplateApps.clockMode('${id}','clock')">🕐 Clock</button>
  <button id="mt-${id}" onclick="window.TemplateApps.clockMode('${id}','timer')">⏱️ Timer</button>
</div>
<div id="ts-${id}" style="display:none;margin-top:16px">
  <div style="font-size:36px;font-weight:200;font-variant-numeric:tabular-nums" id="td-${id}">00:00</div>
  <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
    <input type="number" id="tmn-${id}" value="1" min="0" max="99" style="width:50px;padding:4px;border-radius:4px;border:1px solid #ffffff33;background:#ffffff0d;color:inherit;text-align:center"> min
    <input type="number" id="tsc-${id}" value="0" min="0" max="59" style="width:50px;padding:4px;border-radius:4px;border:1px solid #ffffff33;background:#ffffff0d;color:inherit;text-align:center"> sec
  </div>
  <div style="margin-top:8px;display:flex;gap:8px;justify-content:center">
    <button onclick="window.TemplateApps.timerStart('${id}')">▶️ Start</button>
    <button onclick="window.TemplateApps.timerStop('${id}')">⏹️ Stop</button>
  </div>
</div>
<script>window.TemplateApps.clockInit('${id}')</script></div>`;
}

function tWeather(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif;text-align:center}
.app-${id} h2{margin:0 0 16px;font-size:20px}
.app-${id} .bg{font-size:48px;margin:10px 0}
.app-${id} .tp{font-size:36px;font-weight:200}
.app-${id} .dl{opacity:.6;font-size:14px;margin-top:8px}
.app-${id} .rw{display:flex;gap:16px;justify-content:center;margin-top:16px}
.app-${id} .rw div{padding:12px;border-radius:8px;background:#ffffff0d;min-width:60px}
.app-${id} .rw div span{display:block;font-size:12px;opacity:.6}
</style>
<h2>🌤️ Weather</h2>
<div class="bg">🌤️</div>
<div class="tp" id="wt-${id}">--°C</div>
<div class="dl" id="wd-${id}">Loading...</div>
<div class="rw">
  <div><span>💧 Humidity</span><div id="wh-${id}">--%</div></div>
  <div><span>💨 Wind</span><div id="ww-${id}">--</div></div>
</div>
<script>window.TemplateApps.weatherInit('${id}')</script></div>`;
}

function tChat(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:16px;font-family:system-ui,sans-serif;display:flex;flex-direction:column;height:100%}
.app-${id} h2{margin:0 0 12px;font-size:20px}
.app-${id} .ms{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;min-height:100px}
.app-${id} .msg{padding:8px 12px;border-radius:12px;max-width:80%;font-size:14px;line-height:1.4}
.app-${id} .u{align-self:flex-end;background:#7c3aed;color:#fff;border-bottom-right-radius:4px}
.app-${id} .b{align-self:flex-start;background:#ffffff0d;border-bottom-left-radius:4px}
.app-${id} .rw{display:flex;gap:8px}
.app-${id} input{flex:1;padding:10px 14px;border:1px solid #ffffff33;border-radius:20px;background:#ffffff0d;color:inherit;font-size:14px;outline:none}
.app-${id} input:focus{border-color:#7c3aed}
.app-${id} .sd{padding:10px 18px;border:none;border-radius:20px;background:#7c3aed;color:#fff;cursor:pointer}
</style>
<h2>💬 Chat</h2>
<div class="ms" id="cms-${id}"><div class="msg b">Hello! I'm running in your browser. No data leaves your machine.</div></div>
<div class="rw">
  <input id="ci-${id}" placeholder="Type a message..." onkeydown="if(event.key==='Enter')window.TemplateApps.chatSend('${id}')">
  <button class="sd" onclick="window.TemplateApps.chatSend('${id}')">➤</button>
</div></div>`;
}

function tGeneric(id, desc) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:24px;font-family:system-ui,sans-serif;text-align:center}
.app-${id} .ic{font-size:64px;margin-bottom:16px}
.app-${id} h2{margin:0 0 8px;font-size:20px}
.app-${id} p{opacity:.6;font-size:14px;line-height:1.5}
</style>
<div class="ic">📱</div>
<h2>${escapeHTML(desc)}</h2>
<p>This app was generated by the built-in template.<br>Click the ✦ button and search for "calculator", "todo list", "notes", "paint", "clock", "weather", or "chat" for a full experience.</p>
</div>`;
}

function tRadio(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{display:flex;flex-direction:column;height:100%;font-family:system-ui,sans-serif}
.app-${id} .hd{padding:12px 16px;border-bottom:1px solid #ffffff14;display:flex;align-items:center;gap:10px;flex-shrink:0}
.app-${id} .hd .logo{font-size:22px}
.app-${id} .hd h2{margin:0;font-size:16px;font-weight:500}
.app-${id} .hd .sub{font-size:11px;opacity:.5;margin-left:auto}
.app-${id} iframe{flex:1;border:0;width:100%;background:#000;border-radius:0}
.app-${id} .help{padding:10px 16px;border-top:1px solid #ffffff14;font-size:11px;opacity:.4;text-align:center;flex-shrink:0}
</style>
<div class="hd">
  <span class="logo">🌍</span>
  <h2>Radio Garden</h2>
  <span class="sub">Explore live radio worldwide</span>
</div>
<iframe src="https://radio.garden/" allow="*" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
<div class="help">Spin the globe and tune in to live radio from anywhere</div>
</div>`;
}

function tTac(id) {
  return `<div class="app-${id}">
<style>
.app-${id}{padding:20px;font-family:system-ui,sans-serif;text-align:center}
.app-${id} h2{margin:0 0 12px;font-size:20px}
.app-${id} .g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:280px;margin:12px auto}
.app-${id} .g button{aspect-ratio:1;border:2px solid #ffffff22;border-radius:10px;background:#ffffff0a;color:#fff;font-size:40px;font-weight:bold;cursor:pointer}
.app-${id} .g button:hover{background:#ffffff18}
.app-${id} .g button.w{background:#10b98122;border-color:#10b98166}
.app-${id} .s{font-size:14px;color:#9898b0;margin-bottom:4px}
.app-${id} .r{margin-top:12px}
.app-${id} .r button{padding:8px 20px;border:none;border-radius:8px;background:#7c3aed;color:#fff;font-size:14px;cursor:pointer}
.app-${id} .r button:hover{background:#6d28d9}
</style>
<h2>❌ Tic Tac Toe</h2>
<div class="s" id="st-${id}">X's turn</div>
<div class="g" id="g-${id}"></div>
<div class="r"><button onclick="window.TemplateApps.tictacReset('${id}')">↻ Restart</button></div>
<script>window.TemplateApps.tictacInit('${id}')</script></div>`;
}
