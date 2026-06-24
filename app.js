// ═══════════════════════════════════════════════════════════════════════
// Infinite OS — Desktop Environment + Cloud AI Engine (Google Gemini)
// ═══════════════════════════════════════════════════════════════════════

// ─── Backend Configuration ─────────────────────────────────────────
const AI_BACKEND_URL = "https://gemini-proxy.niccata24.workers.dev/gemini";

const AI_MODEL = "gemini-2.0-flash";
const AI_TEMPERATURE = 0.9;
const AI_MAX_TOKENS = 65536;

const appCache = {};

// ─── OS App Spec (fed to the AI so it knows how to build apps) ─────
const APP_SPEC = `You are an expert HTML/CSS/JS developer. Build a polished, feature-rich, visually impressive HTML app that looks like a real desktop application.

First, think through the requirements inside <thinking> tags. Then output the complete HTML code.

---
CRITICAL RULES — read these first
---
- Build ONLY what the user asks for. Do NOT add extra features, dashboards, or information panels they did not request.
- FORBIDDEN: Do NOT build a system monitor, system information, hardware status, diagnostic tool, device info panel, battery status, performance monitor, or about-this-device app unless the user EXPLICITLY asks for one.
- FORBIDDEN: Do NOT display OS version, platform, memory, CPU cores, battery, or any system metrics unless the app is specifically about system information.
- Use only the OS APIs that are directly relevant to the requested app. Ignore the rest.
- If the user asks for something simple (calculator, todo list, notes, paint, clock), build exactly that. Do not inflate it with unrelated features.

---
REQUIREMENTS
---
- Start your app with <div class="app-{name}"> as the root container element.
- Everything must be self-contained inline: <style> for CSS, <script> for JS.
- Design a rich, polished dark UI. Use gradients, shadows, border-radius, smooth transitions, proper spacing, and visual hierarchy. Make it look like a high-quality native app, not a prototype.
- Full working JavaScript with all features, event handlers, keyboard shortcuts, error handling, and DOM updates.
- Scoped CSS: prefix all selectors with .app-{name} to avoid conflicts.
- You MAY use <iframe> to embed external content (maps, charts, videos, web widgets, music services like https://radio.garden/, etc.) — set allow="*" and sandbox as needed. This is great for rich data visualizations or embedded services.
- For games: render a proper UI with score, controls, restart button, and visual polish.
- CRITICAL for games: use DELTA TIME for all movement, physics, and animation logic. Multiply speeds/velocities by dt (the time elapsed since the last frame) so the game runs at the same speed regardless of frame rate. Use requestAnimationFrame's timestamp parameter to compute dt. Do NOT rely on fixed timesteps or assume a constant frame rate.
- Do NOT use external resources, CDN links, or external images. Everything must be inline.

---
CRITICAL: WINDOW RESIZE / RESPONSIVE LAYOUT
---
Your app lives inside an iframe that users can resize at any time by dragging the window edge or maximizing it. The iframe's width and height change dynamically.

You MUST make your app fill and adapt to the available space:
- Set the root <div class="app-{name}"> to width:100%; height:100% so it fills the iframe.
- Design all layouts with flexbox, grid, or percentage-based sizing — never use fixed pixel widths on the overall layout.
- For scrollable content, use overflow:auto on the appropriate container so content doesn't get clipped when the window shrinks.
- Optionally use a ResizeObserver on the root element to re-render or reflow canvas/grid/tile layouts when the window dimensions change.
- What NOT to do: do NOT set a fixed width/height on the outer container; do NOT assume the window is always the same size; do NOT center a small box in the middle of a huge space without filling the rest.

---
AVAILABLE OS APIs — use these! Your app calls them via window.os.*
---

=== Display & System ===
os.version                    → "1.2.0" — OS version string
os.screen.size                → {w,h} — full screen dimensions
os.screen.availSize           → {w,h} — usable screen area (excludes taskbar)
os.system.online              → boolean — browser online status
os.system.platform            → "web"
os.system.language            → browser language e.g. "en-US"
os.system.memory              → device RAM in GB (or null)
os.system.cores               → CPU logical cores (or null)
os.system.battery()           → Promise<{level,charging}> — battery info

=== Current App Window ===
os.window.title               → get/set the window title bar
os.window.icon                → get/set the window icon emoji
os.window.size                → {w,h} — current dimensions
os.window.resize(w,h)         → resize window (min 300×200)

=== All Windows ===
os.windows.list()             → [{id,title,icon}] — all open windows
os.windows.focus(id)          → bring window to front
os.windows.close(id)          → close a window
os.windows.minimize(id)       → toggle minimize
os.windows.maximize(id)       → toggle maximize

=== Clipboard ===
os.clipboard.write(text)      → Promise — copy to system clipboard
os.clipboard.read()           → Promise<string> — paste from clipboard

=== Dialogs (native OS popups) ===
os.dialog.alert(msg)          → show message alert
t = os.dialog.confirm(msg)    → true/false prompt
t = os.dialog.prompt(msg,def) → string or null

=== Audio / Sound ===
os.audio.beep()               → short beep sound
os.audio.notify()             → notification chime

=== Location / GPS ===
loc = await os.location.current() → {lat,lng,accuracy} or null

=== Crypto / Random ===
uid = os.crypto.uuid()        → random UUID v4 string
arr = os.crypto.bytes(n)      → Uint8Array of n random bytes

=== Sharing ===
ok = await os.share(title,text,url) → Web Share API

=== Date / Time ===
os.date.now()                 → ISO 8601 timestamp
os.date.format(locale,opts)   → formatted date string
os.date.timezone              → IANA timezone string

=== Shell / OS Actions ===
os.shell.openUrl(url)          → open URL in new tab
file = await os.shell.openFile(accept?) → Promise<{name,type,size,dataUrl}> or null
os.shell.saveFile(name,url)    → trigger file download

=== OS Settings (persistent theming) ===
val = os.settings.get(key)     → get a setting (accent, wallpaper, wallpaperBlur, wallpaperDim)
os.settings.set(key,val)      → change a setting (saves + applies instantly)
os.settings.getAll()           → {accent, wallpaper, wallpaperBlur, wallpaperDim} all current values
os.settings.reset()            → restore all defaults
os.settings.onChange(fn)       → subscribe to setting changes: fn(key, value) called on every set()
os.settings.offChange(fn)      → unsubscribe

Available settings:
  accent         → hex color for the OS accent (e.g. "#ff6b6b") — changes instantly
  wallpaper      → URL string for desktop wallpaper image, or "" for none
  wallpaperBlur  → blur amount in pixels for the wallpaper (0 = no blur)
  wallpaperDim   → darkness overlay opacity 0-1 for wallpaper readability
  theme          → "dark" or "light" — OS color scheme

---
THEMING — use OS CSS variables for automatic dark/light mode
---
Your app receives these CSS custom properties from the OS on the :root element.
Use them throughout your CSS so your app adapts to the user's theme choice:

  var(--os-bg)          → main background
  var(--os-bg2)         → card / surface background
  var(--os-bg3)         → elevated surface background
  var(--os-surface)     → subtle hover / overlay
  var(--os-surface-hover) → stronger overlay
  var(--os-border)      → border / divider color
  var(--os-text)        → primary text color
  var(--os-text2)       → secondary / muted text
  var(--os-accent)      → OS accent color (user-customizable)
  var(--os-accent-hover) → accent hover variant

Always use these variables for colors. Do NOT hardcode color values.

  Example:
    background: var(--os-bg);
    color: var(--os-text);
    border: 1px solid var(--os-border);
    background: var(--os-accent);
    color: #fff;

os.theme returns "dark" or "light" so your JS can also adapt.

=== Persistent Storage ===
os.fs.read(key)               → string or null
os.fs.write(key,val)          → boolean (true = saved)
os.fs.list()                  → [{key,size}]
os.fs.delete(key)             → boolean
os.fs.exists(key)             → boolean — key exists?
os.fs.size(key)               → number of chars (or -1)
os.fs.quota()                 → Promise<{usage,quota}> or null

=== Notifications ===
os.notify(title,message)      → show toast notification

=== Launch Apps ===
os.openApp(description)       → launch (or focus) an app by name

Remember: build ONLY what the user requested. Do not add system info, hardware stats, or unrelated features. Keep it focused and polished.`;

function templateReference(desc) {
  if (typeof genTemplate !== "function") return "";
  const html = genTemplate(desc);
  const isGeneric =
    html.includes("📱") && html.includes("generated by the built-in template");
  if (isGeneric) return "";

  const visualReference = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on[a-z]+="[^"]*"/gi, "")
    .trim();

  return `

Built-in template reference for this kind of app, for visual/layout inspiration only.
Do not copy this exactly. Do not call TemplateApps. Write your own self-contained JavaScript.
Reference HTML/CSS:
${visualReference}`;
}

function buildPrompt(desc) {
  return `${APP_SPEC}${templateReference(desc)}

User request: "${desc}"

Generate the complete HTML for this app. Only output the HTML code, no other text.`;
}

function htmlEscape(value) {
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

function generationErrorHTML(desc) {
  return `<div class="app-generation-error">
<style>
.app-generation-error{padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#e8e8f0}
.app-generation-error .ic{font-size:48px;margin-bottom:12px}
.app-generation-error h2{font-size:18px;margin:0 0 8px}
.app-generation-error p{margin:0;color:#9898b0;font-size:13px;line-height:1.5}
</style>
<div class="ic">⚠️</div>
<h2>Could not generate ${htmlEscape(desc)}</h2>
<p>The AI service did not return a usable app. Try again in a moment.</p>
</div>`;
}

// ─── State ─────────────────────────────────────────────────────────
const S = { windows: {}, order: [], z: 100, launcher: false };

// ═══════════════════════════════════════════════════════════════════════
// HTML EXTRACTION (balanced div counting for AI output)
// ═══════════════════════════════════════════════════════════════════════

function extractHTML(text) {
  const m = text.match(/<div\s+class="app-[^"]*"/);
  if (!m) return null;
  let i = m.index,
    depth = 0,
    sc = false,
    st = false;
  while (i < text.length) {
    if (text.slice(i, i + 8) === "<script>") sc = true;
    if (text.slice(i, i + 9) === "</script>") {
      sc = false;
      i += 9;
      continue;
    }
    if (text.slice(i, i + 7) === "<style>") st = true;
    if (text.slice(i, i + 8) === "</style>") {
      st = false;
      i += 8;
      continue;
    }
    if (!sc && !st) {
      if (text.slice(i, i + 4) === "<div" && text[i + 1] !== "/") {
        const close = text.indexOf(">", i);
        if (close > i && text[close - 1] !== "/") depth++;
      }
      if (text.slice(i, i + 6) === "</div>") {
        depth--;
        if (depth === 0) return text.slice(m.index, i + 6);
      }
    }
    i++;
  }
  if (m) return text.slice(m.index);
  return null;
}

function bootMsg(msg, pct) {
  const el = document.getElementById("boot-status");
  if (el) el.textContent = msg;
  if (pct !== undefined) {
    const bar = document.getElementById("boot-bar");
    if (bar) bar.style.width = Math.min(pct, 100) + "%";
  }
}

function createStars() {
  const container = document.getElementById("boot-stars");
  if (!container) return;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement("div");
    const size = Math.random() * 2 + 1;
    star.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      background:rgba(255,255,255,${Math.random() * 0.4 + 0.2});
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation:twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate;
      animation-delay:${Math.random() * 3}s;
    `;
    container.appendChild(star);
  }
}

function playStartupSound() {
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;

      // Rising arpeggio: C5 → E5 → G5 → C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });

      // Soft sub-bass pad underneath
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(130.81, now);
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      sub.connect(subGain).connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 1);
    } catch (_) {}
  };

  // Defer AudioContext creation to first user gesture (avoids autoplay warnings)
  document.addEventListener("pointerdown", play, { once: true });
  document.addEventListener("keydown", play, { once: true });
}

// ═══════════════════════════════════════════════════════════════════════
// GOOGLE GEMINI API
// ═══════════════════════════════════════════════════════════════════════

async function callAI(prompt, onStream) {
  const url = `${AI_BACKEND_URL}${onStream ? "?stream=1" : ""}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: AI_TEMPERATURE,
      maxOutputTokens: AI_MAX_TOKENS,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[Gemini]", res.status, errText);
      return null;
    }

    if (onStream) {
      return await streamGeminiSSE(res, onStream);
    } else {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
  } catch (e) {
    console.error("[Gemini]", e);
    return null;
  }
}

async function streamGeminiSSE(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "",
    fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6).trim();
        if (json === "[DONE]" || !json) continue;
        try {
          const data = JSON.parse(json);
          const arr = Array.isArray(data) ? data : [data];
          for (const item of arr) {
            const text = item.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              fullText += text;
              onChunk(fullText);
            }
          }
        } catch (_) {}
      }
    }
  }
  return fullText;
}

// ─── Streaming generation ───────────────────────────────────────────
async function streamApp(id, desc, onProgress) {
  const prompt = buildPrompt(desc);

  try {
    let fullText = "";

    const onChunk = (text) => {
      fullText = text;
      if (onProgress) onProgress(text);
    };

    const result = await callAI(prompt, onChunk);
    if (!result) return null;

    let finalCode = result.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, "");
    finalCode = finalCode.replace(/^\s*```[\w]*\n?|```\s*$/g, "").trim();

    return finalCode;
  } catch (e) {
    console.log("[AI] Streaming:", e.message);
    return null;
  }
}

async function genWithAI(desc) {
  try {
    return await callAI(buildPrompt(desc), null);
  } catch (e) {
    console.log("[AI] Generation:", e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// OS API (exposed to generated apps)
// ═══════════════════════════════════════════════════════════════════════

window.os = {
  // ─── OS Version ────────────────────────────────────────────────
  version: "1.2.0",

  // ─── Current App Window ───────────────────────────────────────
  window: {
    _id: null,
    get title() {
      const w = getWin(this._id);
      return w ? w.title : "";
    },
    set title(v) {
      const w = getWin(this._id);
      if (w) {
        w.title = v;
        updTitle(this._id);
      }
    },
    get icon() {
      const w = getWin(this._id);
      return w ? w.icon : "";
    },
    set icon(v) {
      const w = getWin(this._id);
      if (w) {
        w.icon = v;
        updTitle(this._id);
      }
    },
    get size() {
      const w = getWin(this._id);
      return w ? { w: w.w, h: w.h } : { w: 400, h: 300 };
    },
    resize(w, h) {
      resizeWin(this._id, w, h);
    },
  },

  // ─── Screen Info ──────────────────────────────────────────────
  screen: {
    get size() {
      return { w: screen.width, h: screen.height };
    },
    get availSize() {
      return { w: screen.availWidth, h: screen.availHeight };
    },
  },

  // ─── System Info ──────────────────────────────────────────────
  system: {
    get online() {
      return navigator.onLine;
    },
    get platform() {
      return "web";
    },
    get language() {
      return navigator.language || "en-US";
    },
    get memory() {
      return navigator.deviceMemory || null;
    },
    get cores() {
      return navigator.hardwareConcurrency || null;
    },
    async battery() {
      if (!navigator.getBattery) return null;
      try {
        const b = await navigator.getBattery();
        return { level: b.level, charging: b.charging };
      } catch {
        return null;
      }
    },
  },

  // ─── All Windows Management ───────────────────────────────────
  windows: {
    list() {
      return Object.values(S.windows).map((w) => ({
        id: w.id,
        title: w.title,
        icon: w.icon,
      }));
    },
    focus(id) {
      focusWin(id);
    },
    close(id) {
      cW(id);
    },
    minimize(id) {
      mW(id);
    },
    maximize(id) {
      MW(id);
    },
  },

  // ─── Clipboard ────────────────────────────────────────────────
  clipboard: {
    async write(text) {
      try {
        await navigator.clipboard.writeText(String(text));
        return true;
      } catch {
        return false;
      }
    },
    async read() {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    },
  },

  // ─── Native Dialogs ───────────────────────────────────────────
  dialog: {
    alert(msg) {
      alert(msg);
    },
    confirm(msg) {
      return confirm(msg);
    },
    prompt(msg, def) {
      return prompt(msg, def ?? "");
    },
  },

  // ─── Audio / Sound ────────────────────────────────────────────
  audio: {
    beep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 800;
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(g).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    },
    notify() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        [880, 1100].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
          osc.connect(g).connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.2);
        });
      } catch {}
    },
  },

  // ─── Geolocation ──────────────────────────────────────────────
  location: {
    current() {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          () => resolve(null),
          { timeout: 5000, enableHighAccuracy: false },
        );
      });
    },
  },

  // ─── Crypto / Random ──────────────────────────────────────────
  crypto: {
    uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 3) | 8).toString(16);
      });
    },
    bytes(n) {
      const a = new Uint8Array(n);
      crypto.getRandomValues(a);
      return a;
    },
  },

  // ─── Web Share ────────────────────────────────────────────────
  async share(title, text, url) {
    if (!navigator.share) return false;
    try {
      await navigator.share({
        title: title || "",
        text: text || "",
        url: url || "",
      });
      return true;
    } catch {
      return false;
    }
  },

  // ─── Date / Time ──────────────────────────────────────────────
  date: {
    now() {
      return new Date().toISOString();
    },
    format(locale, opts) {
      return new Date().toLocaleString(locale || undefined, opts || {});
    },
    get timezone() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return "UTC";
      }
    },
  },

  // ─── Shell / OS Actions ───────────────────────────────────────
  shell: {
    openUrl(url) {
      window.open(url, "_blank", "noopener");
    },
    openFile(accept) {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        if (accept) input.accept = accept;
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result,
            });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        };
        input.click();
      });
    },
    saveFile(filename, dataUrl) {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  },

  // ─── OS Settings (persistent theming) ────────────────────────
  settings: {
    _data: null,
    _lsKey: "io_settings",
    _load() {
      if (this._data) return;
      try {
        const r = localStorage.getItem(this._lsKey);
        this._data = r ? JSON.parse(r) : {};
      } catch {
        this._data = {};
      }
    },
    _save() {
      try {
        localStorage.setItem(this._lsKey, JSON.stringify(this._data));
      } catch {}
    },
    _notify(k, v) {
      if (this._listeners) this._listeners.forEach((fn) => fn(k, v));
    },
    get(key, def) {
      this._load();
      const D = {
        accent: "#7c3aed",
        wallpaper: "",
        wallpaperBlur: 0,
        wallpaperDim: 0.5,
        theme: "dark",
      };
      return this._data[key] !== undefined
        ? this._data[key]
        : def !== undefined
          ? def
          : D[key];
    },
    set(key, val) {
      this._load();
      this._data[key] = val;
      this._save();
      applySettings();
      this._notify(key, val);
    },
    getAll() {
      this._load();
      const D = {
        accent: "#7c3aed",
        wallpaper: "",
        wallpaperBlur: 0,
        wallpaperDim: 0.5,
        theme: "dark",
      };
      return { ...D, ...this._data };
    },
    reset() {
      this._data = {};
      this._save();
      applySettings();
      this._notify("__reset__", null);
    },
    onChange(fn) {
      this._load();
      if (!this._listeners) this._listeners = [];
      this._listeners.push(fn);
    },
    offChange(fn) {
      if (!this._listeners) return;
      this._listeners = this._listeners.filter((f) => f !== fn);
    },
  },

  // ─── Persistent Storage (fs) ──────────────────────────────────
  fs: {
    read(k) {
      try {
        return localStorage.getItem("io_" + k);
      } catch {
        return null;
      }
    },
    write(k, v) {
      try {
        localStorage.setItem("io_" + k, String(v));
        return true;
      } catch {
        return false;
      }
    },
    list() {
      const a = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("io_"))
          a.push({ key: k.slice(3), size: localStorage.getItem(k).length });
      }
      return a;
    },
    delete(k) {
      try {
        localStorage.removeItem("io_" + k);
        return true;
      } catch {
        return false;
      }
    },
    exists(k) {
      return localStorage.getItem("io_" + k) !== null;
    },
    size(k) {
      try {
        const v = localStorage.getItem("io_" + k);
        return v ? v.length : -1;
      } catch {
        return -1;
      }
    },
    async quota() {
      if (!navigator.storage?.estimate) return null;
      try {
        const e = await navigator.storage.estimate();
        return { usage: e.usage, quota: e.quota };
      } catch {
        return null;
      }
    },
  },

  // ─── Notifications ────────────────────────────────────────────
  notify(t, m) {
    showNotif(t, m);
  },

  // ─── Theme ────────────────────────────────────────────────────
  get theme() {
    return window.os.settings.get("theme", "dark");
  },

  // ─── Random Color ─────────────────────────────────────────────
  randomColor() {
    const c = [
      "#7c3aed",
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#ec4899",
      "#8b5cf6",
      "#14b8a6",
      "#f97316",
      "#06b6d4",
    ];
    return c[Math.floor(Math.random() * c.length)];
  },

  // ─── Launch Apps ──────────────────────────────────────────────
  openApp(d) {
    openApp(d);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// WINDOW MANAGER
// ═══════════════════════════════════════════════════════════════════════

function createWin(id, title, icon, w, h, x, y) {
  if (S.windows[id]) {
    focusWin(id);
    return S.windows[id];
  }
  const win = {
    id,
    title: title || "App",
    icon: icon || "📱",
    w: w || 520,
    h: h || 380,
    x: x || 80 + Math.random() * 120,
    y: y || 60 + Math.random() * 80,
    z: S.z++,
    max: false,
    min: false,
    prev: null,
  };
  S.windows[id] = win;
  S.order.push(id);
  renderWin(id);
  updTB();
  focusWin(id);
  return win;
}

function renderWin(id) {
  const w = S.windows[id];
  if (!w) return;
  const old = document.getElementById("w-" + id);
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "window" + (w.max ? " max" : "");
  el.id = "w-" + id;
  Object.assign(el.style, {
    left: w.x + "px",
    top: w.y + "px",
    width: w.w + "px",
    height: w.h + "px",
    zIndex: w.z,
  });
  el.dataset.id = id;
  el.innerHTML = `<div class="window-titlebar" onmousedown="dr(event,'${id}')"><div class="wc"><button class="wcc" onclick="cW('${id}')"></button><button class="wcm" onclick="mW('${id}')"></button><button class="wcx" onclick="MW('${id}')"></button></div><div class="t" id="wt-${id}"><span class="ie">${w.icon}</span>${w.title}</div><div class="wc" style="visibility:hidden"><button></button><button></button><button></button></div></div><div class="window-body" id="wb-${id}"></div><div class="wrz" onmousedown="rz(event,'${id}')"></div>`;
  document.getElementById("windows-container").appendChild(el);
  if (w.min) el.style.display = "none";
}

function getWin(id) {
  return S.windows[id] || null;
}
function updTitle(id) {
  const w = S.windows[id];
  if (!w) return;
  const e = document.getElementById("wt-" + id);
  if (e) e.innerHTML = `<span class="ie">${w.icon}</span>${w.title}`;
  updTB();
}

function focusWin(id) {
  const w = S.windows[id];
  if (!w) return;
  w.z = S.z++;
  const e = document.getElementById("w-" + id);
  if (e) e.style.zIndex = w.z;
  const i = S.order.indexOf(id);
  if (i > -1) S.order.splice(i, 1);
  S.order.push(id);
  updTB();
}

function cW(id) {
  const w = S.windows[id];
  if (!w) return;
  const e = document.getElementById("w-" + id);
  if (e) e.remove();
  delete S.windows[id];
  const i = S.order.indexOf(id);
  if (i > -1) S.order.splice(i, 1);
  updTB();
  if (S.order.length) focusWin(S.order[S.order.length - 1]);
}

function mW(id) {
  const w = S.windows[id];
  if (!w) return;
  w.min = !w.min;
  const e = document.getElementById("w-" + id);
  if (e) {
    e.style.display = w.min ? "none" : "";
    if (!w.min) focusWin(id);
  }
  updTB();
}

function MW(id) {
  const w = S.windows[id];
  if (!w) return;
  if (w.max) {
    w.max = false;
    if (w.prev) {
      w.x = w.prev.x;
      w.y = w.prev.y;
      w.w = w.prev.w;
      w.h = w.prev.h;
    }
  } else {
    w.prev = { x: w.x, y: w.y, w: w.w, h: w.h };
    w.max = true;
  }
  const el = document.getElementById("w-" + id);
  if (el) {
    el.classList.toggle("max", w.max);
    if (!w.max) {
      el.style.left = w.x + "px";
      el.style.top = w.y + "px";
      el.style.width = w.w + "px";
      el.style.height = w.h + "px";
    }
  }
  updTB();
}

function resizeWin(id, w, h) {
  const win = S.windows[id];
  if (!win || win.max) return;
  win.w = Math.max(300, w);
  win.h = Math.max(200, h);
  const e = document.getElementById("w-" + id);
  if (e) {
    e.style.width = win.w + "px";
    e.style.height = win.h + "px";
  }
}

function dr(e, id) {
  if (e.target.closest(".wc")) return;
  const w = S.windows[id];
  if (!w || w.max) return;
  focusWin(id);
  const sx = e.clientX,
    sy = e.clientY,
    sl = w.x,
    st = w.y;
  const mv = (ev) => {
    w.x = sl + (ev.clientX - sx);
    w.y = st + (ev.clientY - sy);
    const el = document.getElementById("w-" + id);
    if (el) {
      el.style.left = w.x + "px";
      el.style.top = w.y + "px";
    }
  };
  const up = () => {
    document.removeEventListener("mousemove", mv);
    document.removeEventListener("mouseup", up);
    window.removeEventListener("blur", up);
  };
  document.addEventListener("mousemove", mv);
  document.addEventListener("mouseup", up);
  window.addEventListener("blur", up);
}

function rz(e, id) {
  e.stopPropagation();
  const w = S.windows[id];
  if (!w || w.max) return;
  focusWin(id);
  const sx = e.clientX,
    sy = e.clientY,
    sw = w.w,
    sh = w.h;
  const mv = (ev) => {
    w.w = Math.max(300, sw + (ev.clientX - sx));
    w.h = Math.max(200, sh + (ev.clientY - sy));
    const el = document.getElementById("w-" + id);
    if (el) {
      el.style.width = w.w + "px";
      el.style.height = w.h + "px";
    }
  };
  const up = () => {
    document.removeEventListener("mousemove", mv);
    document.removeEventListener("mouseup", up);
    window.removeEventListener("blur", up);
  };
  document.addEventListener("mousemove", mv);
  document.addEventListener("mouseup", up);
  window.addEventListener("blur", up);
}

// ═══════════════════════════════════════════════════════════════════════
// APP LAUNCHER
// ═══════════════════════════════════════════════════════════════════════

function appDocument(id, html) {
  const appId = JSON.stringify(id);
  const themeCSS = getThemeCSS();
  const colorScheme =
    window.os.settings.get("theme", "dark") === "light" ? "light" : "dark";
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
:root{${themeCSS}}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;background:transparent;color:var(--os-text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;color-scheme:${colorScheme}}
body{overflow:auto}button,input,textarea,select{font:inherit}
</style>
<script>
(() => {
  const appId = ${appId};
  const parentOs = parent.os;
  const withWindow = (fn) => { const previous = parentOs.window._id; parentOs.window._id = appId; try { return fn(); } finally { parentOs.window._id = previous; } };
  window.os = {
    version: parentOs.version,
    screen: parentOs.screen,
    system: parentOs.system,
    windows: parentOs.windows,
    clipboard: parentOs.clipboard,
    dialog: parentOs.dialog,
    audio: parentOs.audio,
    location: parentOs.location,
    crypto: parentOs.crypto,
    date: parentOs.date,
    shell: parentOs.shell,
    settings: parentOs.settings,
    fs: parentOs.fs,
    notify: (...args) => parentOs.notify(...args),
    get theme() { return parentOs.theme; },
    randomColor: () => parentOs.randomColor(),
    async share(...args) { return parentOs.share(...args); },
    openApp: (desc) => parentOs.openApp(desc),
    window: { _id: appId,
      get title() { return withWindow(() => parentOs.window.title); },
      set title(v) { withWindow(() => { parentOs.window.title = v; }); },
      get icon() { return withWindow(() => parentOs.window.icon); },
      set icon(v) { withWindow(() => { parentOs.window.icon = v; }); },
      get size() { return withWindow(() => parentOs.window.size); },
      resize: (w, h) => withWindow(() => parentOs.window.resize(w, h))
    },
  };
})();
</script>
</head>
<body>${html}</body>
</html>`;
}

function iconFor(n) {
  const l = n.toLowerCase();
  if (l.includes("calc") || l.includes("math")) return "🧮";
  if (l.includes("todo") || l.includes("task") || l.includes("list"))
    return "✅";
  if (l.includes("note") || l.includes("memo")) return "📝";
  if (l.includes("paint") || l.includes("draw") || l.includes("sketch"))
    return "🎨";
  if (l.includes("clock") || l.includes("time") || l.includes("watch"))
    return "🕐";
  if (l.includes("timer") || l.includes("stopwatch")) return "⏱️";
  if (l.includes("weather")) return "🌤️";
  if (l.includes("chat") || l.includes("ai") || l.includes("assistant"))
    return "💬";
  if (l.includes("radio") || l.includes("garden")) return "📻";
  if (l.includes("music") || l.includes("player") || l.includes("sound"))
    return "🎵";
  if (l.includes("convert") || l.includes("unit")) return "📏";
  if (l.includes("tic") || l.includes("tac") || l.includes("toe")) return "❌";
  if (l.includes("color") || l.includes("picker")) return "🎨";
  return "📱";
}

function renderApp(id, desc, html) {
  const win = S.windows[id];
  if (!win) createWin(id, desc, iconFor(desc), 540, 400);
  const w = S.windows[id];
  if (!w) return;
  w.title = desc
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  w.icon = iconFor(desc);
  updTitle(id);

  const b = document.getElementById("wb-" + id);
  if (!b) return;
  b.removeAttribute("style");
  b.innerHTML = "";
  if (html) {
    const frame = document.createElement("iframe");
    frame.className = "app-frame";
    frame.title = desc;
    frame.srcdoc = appDocument(id, html);
    b.appendChild(frame);
  }
  addDI(id, w.title, w.icon);
  updTB();
}

async function openApp(desc) {
  closeLauncher();
  const d = desc.trim();
  if (!d) return;
  const id =
    d
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "app";
  if (S.windows[id]) {
    focusWin(id);
    return;
  }
  if (appCache[id]) {
    renderApp(id, d, appCache[id]);
    return;
  }

  createWin(id, "Generating...", "⏳", 540, 400);
  const body = document.getElementById("wb-" + id);
  if (body) {
    body.style.overflow = "auto";
    body.style.background = "#0f0f1a";
    body.style.display = "flex";
    body.style.alignItems = "center";
    body.style.justifyContent = "center";
    body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;gap:14px">
  <div style="width:44px;height:44px;border:3px solid rgba(124,58,237,0.15);border-top-color:#7c3aed;border-right-color:#a78bfa;border-radius:50%;animation:buildSpin 0.8s cubic-bezier(0.4,0,0.2,1) infinite"></div>
  <div style="font-size:16px;font-weight:500;color:#e8e8f0">${htmlEscape(d)}</div>
  <div id="build-st-${id}" style="font-size:12px;color:#9898b0;min-height:18px">Generating...</div>
  <div id="build-pv-${id}" style="width:100%;max-width:480px;max-height:180px;overflow:auto;background:rgba(0,0,0,0.3);border-radius:8px;padding:12px;font-family:monospace;font-size:11px;line-height:1.5;text-align:left;white-space:pre-wrap;word-break:break-all;color:#707090;display:none"></div>
</div>`;
  }

  const raw =
    (await streamApp(id, d, (txt) => {
      const el = document.getElementById("build-pv-" + id);
      const st = document.getElementById("build-st-" + id);
      if (!el || !st) return;
      el.style.display = "block";
      let clean = txt
        .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
        .replace(/```[\w]*\n?/g, "");
      el.textContent = clean.length > 1200 ? "…\n" + clean.slice(-1200) : clean;
      el.scrollTop = el.scrollHeight;
      st.textContent = "Generating...";
    })) || (await genWithAI(d));
  const cleaned = raw
    ? raw
        .replace(/^\s*```[\w]*\n?|```\s*$/g, "")
        .replace(/<thinking>[\s\S]*?<\/thinking>\n*/g, "")
    : null;
  const html = cleaned ? extractHTML(cleaned) : null;

  if (html) {
    appCache[id] = html;
    saveApp(id, d, html);
    renderApp(id, d, html);
  } else {
    renderApp(id, d, generationErrorHTML(d));
  }
  updTB();
}

function addDI(id, name, emoji) {
  if (document.getElementById("di-" + id)) return;
  const el = document.createElement("div");
  el.className = "desktop-icon";
  el.id = "di-" + id;
  el.ondblclick = () => openApp(name);
  el.oncontextmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll(".di-ctx").forEach((m) => m.remove());
    const menu = document.createElement("div");
    menu.className = "di-ctx";
    Object.assign(menu.style, {
      position: "fixed",
      left: e.clientX + "px",
      top: e.clientY + "px",
      zIndex: "500",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow)",
      padding: "4px",
      minWidth: "140px",
      backdropFilter: "blur(20px)",
    });
    menu.style.minWidth = "160px";
    menu.innerHTML =
      `<div class="di-ctx-i" data-action="props" style="padding:8px 12px;font-size:13px;border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;gap:8px;transition:background var(--transition);margin-bottom:2px">⚙️ Properties</div>` +
      `<div style="height:1px;background:var(--border);margin:4px 8px"></div>` +
      `<div class="di-ctx-i" data-action="del" style="padding:8px 12px;font-size:13px;border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;gap:8px;transition:background var(--transition)">🗑️ Uninstall</div>`;
    menu.querySelector("[data-action=props]").onclick = () => {
      showAppProperties(id);
      menu.remove();
    };
    menu.querySelector("[data-action=del]").onclick = () => {
      uninstallApp(id);
      menu.remove();
    };
    document.body.appendChild(menu);
    setTimeout(() => {
      const close = (ev) => {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener("click", close);
        }
      };
      document.addEventListener("click", close);
    }, 0);
  };
  el.innerHTML = `<div class="icon-emoji">${emoji || "📱"}</div><div class="icon-label">${name}</div>`;
  document.getElementById("desktop-icons").appendChild(el);
}

// ─── Persistent App Cache (survives refresh) ──────────────────────────

function saveApp(id, name, html) {
  try {
    localStorage.setItem("io_app_" + id, html);
    const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
    if (!index.find((e) => e.id === id)) {
      index.push({ id, name, icon: iconFor(name) });
      localStorage.setItem("io_app_index", JSON.stringify(index));
    }
  } catch (e) {}
}

function loadSavedApps() {
  try {
    const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
    for (const entry of index) {
      const html = localStorage.getItem("io_app_" + entry.id);
      if (html) {
        appCache[entry.id] = html;
        addDI(entry.id, entry.name, entry.icon);
      }
    }
  } catch (e) {}
}

function uninstallApp(id) {
  try {
    const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
    const entry = index.find((e) => e.id === id);
    const name = entry ? entry.name : id;
    const filtered = index.filter((e) => e.id !== id);
    localStorage.setItem("io_app_index", JSON.stringify(filtered));
    localStorage.removeItem("io_app_" + id);
    delete appCache[id];
    const di = document.getElementById("di-" + id);
    if (di) di.remove();
    if (S.windows[id]) cW(id);
    showNotif("🗑️ Uninstalled", '"' + name + '" has been removed');
  } catch (e) {}
}

// ─── Desktop Icon Helpers ─────────────────────────────────────────────

function updateDI(id, name, emoji) {
  const el = document.getElementById("di-" + id);
  if (!el) return;
  el.innerHTML = `<div class="icon-emoji">${emoji || "📱"}</div><div class="icon-label">${name}</div>`;
  el.ondblclick = () => openApp(name);
}

// ─── App Properties Window ────────────────────────────────────────────

function showAppProperties(id) {
  const winId = "_props_" + id;
  if (S.windows[winId]) {
    focusWin(winId);
    return;
  }

  const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
  const entry = index.find((e) => e.id === id);
  const currentName = entry
    ? entry.name
    : S.windows[id]
      ? S.windows[id].title
      : id;
  const currentIcon = entry ? entry.icon : iconFor(currentName);

  let htmlSize = 0;
  try {
    const h = localStorage.getItem("io_app_" + id);
    if (h) htmlSize = h.length;
  } catch {}

  createWin(winId, "⚙️ " + currentName + " Properties", "⚙️", 380, 370);
  const body = document.getElementById("wb-" + winId);
  if (!body) return;
  body.style.overflow = "auto";

  const emojiStrip = [
    "📱",
    "🧮",
    "✅",
    "📝",
    "🎨",
    "🕐",
    "🌤️",
    "💬",
    "📻",
    "🎵",
    "❌",
    "📏",
    "🎮",
    "📊",
    "🔧",
    "🗂️",
    "🖼️",
    "🔒",
    "⚡",
    "🎯",
    "📦",
    "🌐",
    "🧩",
    "💾",
  ];

  body.innerHTML =
    `<div style="padding:20px;font-family:system-ui,sans-serif;height:100%;display:flex;flex-direction:column">
  <div style="text-align:center;margin-bottom:12px">
    <div id="pv-em-${winId}" style="font-size:48px;margin-bottom:4px">${currentIcon}</div>
  </div>
  <div style="margin-bottom:10px">
    <label style="display:block;font-size:11px;color:var(--text2);margin-bottom:3px">Icon (emoji)</label>
    <input id="pi-${winId}" value="${currentIcon}" maxlength="4" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:16px;text-align:center;outline:none" oninput="document.getElementById('pv-em-${winId}').textContent=this.value||'📱'">
    <div style="display:flex;gap:3px;margin-top:5px;flex-wrap:wrap;justify-content:center">` +
    emojiStrip
      .map(
        (e) =>
          `<span data-em="${e}" onclick="document.getElementById('pi-${winId}').value='${e}';document.getElementById('pv-em-${winId}').textContent='${e}'" style="cursor:pointer;font-size:18px;padding:2px 5px;border-radius:4px" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">${e}</span>`,
      )
      .join("") +
    `</div>
  </div>
  <div style="margin-bottom:10px">
    <label style="display:block;font-size:11px;color:var(--text2);margin-bottom:3px">App name</label>
    <input id="pn-${winId}" value="${htmlEscape(currentName)}" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:14px;outline:none">
  </div>
  <div style="margin-bottom:12px;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:11px;color:var(--text2);line-height:1.5">
    <b>App ID:</b> ${htmlEscape(id)}<br>
    <b>Storage:</b> ${htmlSize > 0 ? (htmlSize / 1024).toFixed(1) + " KB" : "Not saved"}
  </div>
  <div style="margin-top:auto;display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--border)">
    <button onclick="cW('${winId}')" style="padding:8px 20px;border:none;border-radius:6px;background:var(--surface);color:var(--text);font-size:13px;cursor:pointer">Cancel</button>
    <button onclick="saveAppProperties('${id}','${winId}')" style="padding:8px 20px;border:none;border-radius:6px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer">Save</button>
  </div>
</div>`;
}

function saveAppProperties(id, winId) {
  const nameInp = document.getElementById("pn-" + winId);
  const iconInp = document.getElementById("pi-" + winId);
  if (!nameInp || !iconInp) return;
  const newName = nameInp.value.trim() || id;
  const newIcon = iconInp.value.trim() || "📱";

  try {
    const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
    const entry = index.find((e) => e.id === id);
    if (entry) {
      entry.name = newName;
      entry.icon = newIcon;
    }
    localStorage.setItem("io_app_index", JSON.stringify(index));
  } catch {}

  updateDI(id, newName, newIcon);

  const win = S.windows[id];
  if (win) {
    win.title = newName;
    win.icon = newIcon;
    updTitle(id);
  }

  cW(winId);
  showNotif("⚙️ Properties", 'Updated "' + newName + '"');
}

// ─── Theme / Settings Application ────────────────────────────────────

function darkenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.max(0, Math.floor(r * (1 - amount)));
  const ng = Math.max(0, Math.floor(g * (1 - amount)));
  const nb = Math.max(0, Math.floor(b * (1 - amount)));
  return (
    "#" + [nr, ng, nb].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

function getThemeCSS() {
  const s = window.os.settings.getAll();
  const accent = s.accent || "#7c3aed";
  const accentHover = darkenColor(accent, 0.15);
  if (s.theme === "light") {
    return `--os-bg:#f5f5f7;--os-bg2:#ffffff;--os-bg3:#e8e8ed;--os-surface:rgba(0,0,0,0.03);--os-surface-hover:rgba(0,0,0,0.08);--os-border:rgba(0,0,0,0.1);--os-text:#1d1d1f;--os-text2:#6e6e73;--os-accent:${accent};--os-accent-hover:${accentHover}`;
  }
  return `--os-bg:#0f0f1a;--os-bg2:#1a1a2e;--os-bg3:#252540;--os-surface:rgba(255,255,255,0.03);--os-surface-hover:rgba(255,255,255,0.08);--os-border:rgba(255,255,255,0.08);--os-text:#e8e8f0;--os-text2:#9898b0;--os-accent:${accent};--os-accent-hover:${accentHover}`;
}

function syncAppThemes() {
  const css = getThemeCSS();
  const colorScheme =
    window.os.settings.get("theme", "dark") === "light" ? "light" : "dark";
  for (const id of Object.keys(S.windows)) {
    const body = document.getElementById("wb-" + id);
    if (!body) continue;
    const frame = body.querySelector("iframe.app-frame");
    if (!frame) continue;
    try {
      const doc = frame.contentDocument;
      if (!doc) continue;
      let style = doc.getElementById("os-theme-vars");
      if (!style) {
        style = doc.createElement("style");
        style.id = "os-theme-vars";
        doc.head.appendChild(style);
      }
      style.textContent = ":root{" + css + "}";
      doc.documentElement.style.colorScheme = colorScheme;
    } catch (e) {}
  }
}

function applySettings() {
  const s = window.os.settings.getAll();
  const root = document.documentElement;

  root.style.setProperty("--accent", s.accent);
  root.style.setProperty("--accent-hover", darkenColor(s.accent, 0.15));

  // Apply theme CSS variables on :root for the main OS UI
  if (s.theme === "light") {
    root.style.setProperty("--bg", "#f5f5f7");
    root.style.setProperty("--bg2", "#ffffff");
    root.style.setProperty("--bg3", "#e8e8ed");
    root.style.setProperty("--surface", "rgba(0,0,0,0.03)");
    root.style.setProperty("--surface-hover", "rgba(0,0,0,0.08)");
    root.style.setProperty("--border", "rgba(0,0,0,0.1)");
    root.style.setProperty("--text", "#1d1d1f");
    root.style.setProperty("--text2", "#6e6e73");
    root.style.colorScheme = "light";
  } else {
    root.style.setProperty("--bg", "#0f0f1a");
    root.style.setProperty("--bg2", "#1a1a2e");
    root.style.setProperty("--bg3", "#252540");
    root.style.setProperty("--surface", "rgba(255,255,255,0.03)");
    root.style.setProperty("--surface-hover", "rgba(255,255,255,0.08)");
    root.style.setProperty("--border", "rgba(255,255,255,0.08)");
    root.style.setProperty("--text", "#e8e8f0");
    root.style.setProperty("--text2", "#9898b0");
    root.style.colorScheme = "dark";
  }

  syncAppThemes();

  const desktop = document.getElementById("desktop");
  if (!desktop) return;

  const existingWp = document.getElementById("os-wallpaper");
  const existingDim = document.getElementById("os-wallpaper-dim");

  if (s.wallpaper) {
    // Clean up any old wallpaper elements that may have been inside #desktop
    const oldWp = desktop.querySelector("#os-wallpaper");
    const oldDim = desktop.querySelector("#os-wallpaper-dim");
    if (oldWp) oldWp.remove();
    if (oldDim) oldDim.remove();

    // Insert wallpaper elements as siblings BEFORE #desktop
    // so they stack BEHIND the desktop and don't cover the icons
    let wp = existingWp;
    let dim = existingDim;
    if (!wp) {
      wp = document.createElement("div");
      wp.id = "os-wallpaper";
      desktop.parentNode.insertBefore(wp, desktop);
    }
    if (!dim) {
      dim = document.createElement("div");
      dim.id = "os-wallpaper-dim";
      desktop.parentNode.insertBefore(dim, desktop);
    }
    // Position to same area as the desktop (above taskbar)
    Object.assign(wp.style, {
      position: "fixed",
      left: "0",
      right: "0",
      top: "0",
      bottom: "var(--taskbar-height)",
      backgroundImage: "url(" + JSON.stringify(s.wallpaper) + ")",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      filter: "blur(" + (s.wallpaperBlur || 0) + "px)",
      transition: "opacity 0.5s ease",
      opacity: "1",
      zIndex: "",
      pointerEvents: "none",
    });
    Object.assign(dim.style, {
      position: "fixed",
      left: "0",
      right: "0",
      top: "0",
      bottom: "var(--taskbar-height)",
      background: "rgba(0,0,0," + (s.wallpaperDim || 0.5) + ")",
      transition: "opacity 0.5s ease",
      opacity: "1",
      zIndex: "",
      pointerEvents: "none",
    });
    desktop.style.background = "transparent";
  } else {
    if (existingWp) {
      existingWp.style.opacity = "0";
      setTimeout(() => existingWp.remove(), 500);
    }
    if (existingDim) {
      existingDim.style.opacity = "0";
      setTimeout(() => existingDim.remove(), 500);
    }
    desktop.style.background =
      s.theme === "light"
        ? "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.06) 0%, transparent 60%),radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.05) 0%, transparent 60%),radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.05) 0%, transparent 60%),linear-gradient(135deg, #f5f5f7 0%, #ffffff 50%, #f5f5f7 100%)"
        : "radial-gradient(ellipse at 20% 50%, #1a1a2e88 0%, transparent 60%),radial-gradient(ellipse at 80% 20%, #2d1b6988 0%, transparent 60%),radial-gradient(ellipse at 50% 80%, #0f346088 0%, transparent 60%),linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)";
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LAUNCHER
// ═══════════════════════════════════════════════════════════════════════

function toggleLauncher() {
  S.launcher ? closeLauncher() : openLauncher();
}

function openLauncher() {
  S.launcher = true;
  document.getElementById("launcher").classList.remove("hide");
  setTimeout(() => document.getElementById("launcher-inp").focus(), 50);
  document.getElementById("launcher-st").textContent = "";
}

function closeLauncher() {
  S.launcher = false;
  document.getElementById("launcher").classList.add("hide");
}
function onLauncherKey(e) {
  if (e.key === "Enter") searchApp();
  else if (e.key === "Escape") closeLauncher();
}

async function searchApp() {
  const inp = document.getElementById("launcher-inp");
  const q = inp.value.trim();
  if (!q) return;
  document.getElementById("launcher-go").disabled = true;
  inp.disabled = true;
  document.getElementById("launcher-st").textContent = "✦ Generating...";
  await openApp(q);
  setTimeout(() => {
    inp.value = "";
    inp.disabled = false;
    document.getElementById("launcher-go").disabled = false;
    document.getElementById("launcher-st").textContent = "";
  }, 500);
}

// ═══════════════════════════════════════════════════════════════════════
// TASKBAR
// ═══════════════════════════════════════════════════════════════════════

function updTB() {
  const c = document.getElementById("tb-apps");
  c.innerHTML = "";
  S.order.forEach((id) => {
    const w = S.windows[id];
    if (!w) return;
    const btn = document.createElement("button");
    btn.className =
      "tb-app" + (id === S.order[S.order.length - 1] ? " on" : "");
    btn.innerHTML = `${w.icon} ${w.title}`;
    btn.onclick = () => {
      if (w.min) {
        w.min = false;
        const el = document.getElementById("w-" + id);
        if (el) el.style.display = "";
        focusWin(id);
      } else if (id === S.order[S.order.length - 1]) mW(id);
      else focusWin(id);
    };
    c.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

function showNotif(t, m) {
  const c = document.getElementById("notif-box");
  const el = document.createElement("div");
  el.className = "notif";
  el.onclick = () => el.remove();
  el.innerHTML = `<div class="nf-t">${t}</div><div class="nf-m">${m}</div>`;
  c.appendChild(el);
  setTimeout(() => {
    if (el.parentElement) el.remove();
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════════════
// CLOCK / EVENTS / WELCOME / BOOT
// ═══════════════════════════════════════════════════════════════════════

function clock() {
  document.getElementById("tb-clock").textContent =
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const m = document.getElementById("ctx");
  m.style.left = Math.min(e.clientX, window.innerWidth - 200) + "px";
  m.style.top = Math.min(e.clientY, window.innerHeight - 250) + "px";
  m.classList.remove("hide");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#ctx"))
    document.getElementById("ctx").classList.add("hide");
});
document
  .getElementById("desktop")
  .addEventListener("click", () =>
    document.getElementById("ctx").classList.add("hide"),
  );

let _welcomed = false;

function showWelcome() {
  const id = "_welcome";
  if (S.windows[id]) {
    focusWin(id);
    return;
  }
  createWin(id, "Welcome", "✦", 480, 420);
  const body = document.getElementById("wb-" + id);
  if (body) {
    body.style.overflow = "auto";
    body.innerHTML = `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;height:100%">
  <div style="font-size:56px;margin-bottom:8px;color:var(--accent)">✦</div>
  <h1 style="font-size:26px;font-weight:600;margin-bottom:4px">Welcome to Infinite OS</h1>
  <p style="font-size:13px;color:var(--text2);margin-bottom:20px;line-height:1.6">
    A web-based operating system where every app is generated
    <br>by AI on demand — powered by Google Gemini.
  </p>
  <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:360px">
    <div style="display:flex;gap:12px;align-items:flex-start;background:var(--surface);padding:12px 16px;border-radius:var(--radius-sm);text-align:left">
      <span style="font-size:20px;flex-shrink:0">🔍</span>
      <div><strong style="font-size:13px">Launch anything</strong><br><span style="font-size:12px;color:var(--text2)">Click the ✦ button or press <kbd style="background:var(--bg3);padding:2px 6px;border-radius:4px;font-size:11px">Ctrl+K</kbd> to open the launcher. Describe any app and AI builds it instantly.</span></div>
    </div>
    <div style="display:flex;gap:12px;align-items:flex-start;background:var(--surface);padding:12px 16px;border-radius:var(--radius-sm);text-align:left">
      <span style="font-size:20px;flex-shrink:0">📦</span>
      <div><strong style="font-size:13px">Built-in apps</strong><br><span style="font-size:12px;color:var(--text2)">Right-click the desktop for quick access to Calculator, To-Do List, Notes, and Paint.</span></div>
    </div>
    <div style="display:flex;gap:12px;align-items:flex-start;background:var(--surface);padding:12px 16px;border-radius:var(--radius-sm);text-align:left">
      <span style="font-size:20px;flex-shrink:0">☁️</span>
      <div><strong style="font-size:13px">Cloud-powered AI</strong><br><span style="font-size:12px;color:var(--text2)">Apps are generated by Google Gemini via the cloud API backend.</span></div>
    </div>
  </div>
  <button onclick="cW('${id}')" style="margin-top:20px;padding:10px 32px;border:none;border-radius:var(--radius-sm);background:var(--accent);color:#fff;font-size:14px;cursor:pointer">Get Started</button>
</div>`;
  }
}

function showAbout() {
  document.getElementById("ctx").classList.add("hide");
  const o = document.createElement("div");
  o.className = "ab-o";
  o.onclick = (e) => {
    if (e.target === o) o.remove();
  };
  o.innerHTML = `<div class="ab-b"><h1>✦</h1><h2>Infinite OS</h2><p>A web operating system where every app is generated by AI on demand.</p><p style="font-size:12px;opacity:.4">AI: Google Gemini (cloud)<br>v1.2.0</p><button onclick="this.closest('.ab-o').remove()">Close</button></div>`;
  document.body.appendChild(o);
}

// ─── Settings App ────────────────────────────────────────────────────

function openSettings() {
  const id = "_settings";
  if (S.windows[id]) {
    focusWin(id);
    return;
  }
  createWin(id, "Settings", "⚙️", 500, 570);
  const body = document.getElementById("wb-" + id);
  if (!body) return;
  renderSettingsBody(id, body);
}

function renderSettingsBody(id, body) {
  const s = window.os.settings.getAll();
  const accent = s.accent || "#7c3aed";
  const wallpaper = s.wallpaper || "";
  const blur = s.wallpaperBlur || 0;
  const dim = s.wallpaperDim || 0.5;

  const swatches = [
    "#7c3aed",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
    "#a855f7",
    "#22c55e",
    "#eab308",
    "#64748b",
  ];

  body.style.overflow = "auto";
  body.innerHTML = `
<div class="settings-wrap">
  <h2>⚙️ Settings</h2>

  <div class="sec">
    <h3>Accent Color</h3>
    <label>Choose a color</label>
    <div class="swatch-grid">
      ${swatches
        .map(
          (c) =>
            `<span class="swatch${c === accent ? " on" : ""}" style="background:${c}" onclick="os.settings.set('accent','${c}');document.querySelector('#wb-${id} .swatch.on')?.classList.remove('on');this.classList.add('on');document.getElementById('set-hex-${id}').value='${c}'" title="${c}"></span>`,
        )
        .join("")}
    </div>
    <label>Custom hex color</label>
    <div style="display:flex;gap:8px">
      <input id="set-hex-${id}" type="text" value="${accent}" placeholder="#7c3aed" style="flex:1;font-family:monospace" onchange="os.settings.set('accent',this.value)">
      <button class="btn-secondary" onclick="document.getElementById('set-hex-${id}').value=os.randomColor();os.settings.set('accent',os.randomColor())" style="padding:8px 14px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;background:var(--surface);color:var(--text)">🎲 Random</button>
    </div>
  </div>

  <div class="sec">
    <h3>Wallpaper</h3>
    <label>Image URL</label>
    <input id="set-wp-${id}" type="url" value="${wallpaper}" placeholder="https://example.com/wallpaper.jpg" onchange="os.settings.set('wallpaper',this.value)">
    <div class="wp-preview" id="wp-pv-${id}" style="${wallpaper ? "background-image:url('" + wallpaper.replace(/'/g, "\\'") + "')" : ""}"></div>
    <button class="btn-secondary" onclick="document.getElementById('set-wp-${id}').value='';os.settings.set('wallpaper','')" style="margin-top:6px;padding:6px 14px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:12px;background:var(--surface);color:var(--text)">Remove wallpaper</button>

    <div style="margin-top:12px">
      <label>Blur: <span id="set-blr-v-${id}">${blur}</span>px</label>
      <div class="range-row">
        <input type="range" min="0" max="20" value="${blur}" oninput="document.getElementById('set-blr-v-${id}').textContent=this.value;os.settings.set('wallpaperBlur',parseInt(this.value))">
        <span>${blur}px</span>
      </div>
    </div>

    <div style="margin-top:12px">
      <label>Dim: <span id="set-dim-v-${id}">${dim}</span></label>
      <div class="range-row">
        <input type="range" min="0" max="1" step="0.05" value="${dim}" oninput="document.getElementById('set-dim-v-${id}').textContent=parseFloat(this.value).toFixed(2);os.settings.set('wallpaperDim',parseFloat(this.value))">
        <span>${dim}</span>
      </div>
    </div>
  </div>

  <div class="sec">
    <h3>Theme</h3>
    <label>Appearance</label>
    <div style="display:flex;align-items:center;gap:12px;margin-top:4px">
      <button onclick="os.settings.set('theme','${s.theme === "light" ? "dark" : "light"}')" style="flex:1;padding:10px 16px;border:2px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);cursor:pointer;font-size:14px;transition:all var(--transition);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:500">
        ${s.theme === "dark" ? "🌙" : "☀️"} ${s.theme === "dark" ? "Dark Mode" : "Light Mode"}
      </button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <span onclick="os.settings.set('theme','dark')" style="flex:1;padding:8px;border-radius:var(--radius-sm);background:#0f0f1a;color:#e8e8f0;text-align:center;cursor:pointer;font-size:12px;border:2px solid ${s.theme === "dark" ? "var(--accent)" : "transparent"}">🌙 Dark</span>
      <span onclick="os.settings.set('theme','light')" style="flex:1;padding:8px;border-radius:var(--radius-sm);background:#f5f5f7;color:#1d1d1f;text-align:center;cursor:pointer;font-size:12px;border:2px solid ${s.theme === "light" ? "var(--accent)" : "transparent"}">☀️ Light</span>
    </div>
    <p style="font-size:11px;color:var(--text2);margin-top:8px">Switch between dark and light appearance. Open apps will update with the new theme.</p>
  </div>

  <div class="sec">
    <h3>System</h3>
    <div class="btn-row">
      <button class="btn-danger" onclick="if(confirm('Reset all settings to defaults?')){os.settings.reset();cW('${id}');openSettings();}">Reset to Defaults</button>
    </div>
  </div>
</div>`;

  // Live wallpaper preview when URL changes
  const wpInput = document.getElementById("set-wp-" + id);
  const wpPreview = document.getElementById("wp-pv-" + id);
  if (wpInput && wpPreview) {
    wpInput.addEventListener("input", () => {
      const val = wpInput.value.trim();
      wpPreview.style.backgroundImage = val
        ? "url('" + val.replace(/'/g, "\\'") + "')"
        : "none";
    });
  }

  // Live range display update
  const blrInput = body.querySelector("input[type=range][min=0][max=20]");
  const dimInput = body.querySelector("input[type=range][min=0][max=1]");
  if (blrInput) {
    blrInput.addEventListener("input", () => {
      const span = document.getElementById("set-blr-v-" + id);
      if (span) span.textContent = blrInput.value;
      blrInput.parentElement.querySelector("span:last-child").textContent =
        blrInput.value;
    });
  }
  if (dimInput) {
    dimInput.addEventListener("input", () => {
      const span = document.getElementById("set-dim-v-" + id);
      const v = parseFloat(dimInput.value).toFixed(2);
      if (span) span.textContent = v;
      dimInput.parentElement.querySelector("span:last-child").textContent = v;
    });
  }
}

// ─── Restart OS ──────────────────────────────────────────────────────

function restartOS() {
  closeLauncher();
  const o = document.createElement("div");
  o.className = "ab-o";
  o.style.zIndex = "9999";
  o.onclick = null;
  o.innerHTML = `<div class="ab-b"><h1>🔄</h1><h2>Restarting...</h2><p style="font-size:13px;color:var(--text2);margin-bottom:16px">Infinite OS will reload in a moment.</p><div style="width:100%;height:3px;background:#ffffff0d;border-radius:4px;overflow:hidden;margin:0 auto;max-width:200px"><div style="height:100%;width:100%;background:linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed);background-size:200% 100%;border-radius:4px;animation:barShimmer 0.8s linear infinite"></div></div></div>`;
  document.body.appendChild(o);
  setTimeout(() => location.reload(), 800);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && S.launcher) closeLauncher();
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    toggleLauncher();
  }
});

// ═══════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════════

function dismissBoot() {
  const b = document.getElementById("boot");
  b.classList.add("hide");
  setTimeout(() => {
    if (b) b.style.display = "none";
  }, 700);
}

createStars();
playStartupSound();
clock();
setInterval(clock, 1000);
console.log("✦ Infinite OS loaded");

// Boot sequence — phased loading with progress
const bootPhases = [
  { msg: "Loading kernel modules...", pct: 15, delay: 600 },
  { msg: "Starting AI engine...", pct: 35, delay: 1200 },
  { msg: "Connecting to Gemini...", pct: 60, delay: 1800 },
  { msg: "Restoring saved apps...", pct: 75, delay: 2100 },
  { msg: "Preparing desktop...", pct: 85, delay: 2400 },
  { msg: "Backend AI ready", pct: 100, delay: 3000 },
];

bootPhases.forEach(({ msg, pct, delay }) => {
  setTimeout(() => bootMsg(msg, pct), delay);
});

setTimeout(loadSavedApps, 2200);
setTimeout(applySettings, 2400);

setTimeout(() => {
  dismissBoot();
  if (!_welcomed) {
    _welcomed = true;
    setTimeout(showWelcome, 300);
  }
  updTB();
}, 3500);
