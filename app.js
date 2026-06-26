// ═══════════════════════════════════════════════════════════════════════
// Infinite OS — Desktop Environment + Cloud AI Engine (Google Gemini)
// ═══════════════════════════════════════════════════════════════════════

// ─── Backend Configuration ─────────────────────────────────────────
const AI_BACKEND_URL = "https://gemini-proxy.niccata24.workers.dev/gemini";

const AI_MODEL = "gemini-2.0-flash";
const AI_TEMPERATURE = 0.55;
const AI_MAX_TOKENS = 65536;
const AI_REPAIR_TEMPERATURE = 0.25;

const DEFAULT_DESKTOP_MENU_ITEMS = [
  "launcher",
  "addWidget",
  "showDesktop",
  "refreshDesktop",
  "closeWindows",
  "settings",
  "welcome",
  "manual",
  "about",
];

const appCache = {};
const WIDGETS_LS_KEY = "io_widgets";

// ─── OS App Spec (fed to the AI so it knows how to build apps) ─────
const APP_SPEC = `You are an expert HTML/CSS/JS developer. Build a polished, complete, fully functional HTML app that looks like a real desktop application.

Think through the requirements privately, then output only the complete HTML code. Do not include markdown, explanations, plans, or <thinking> tags.

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
- Start your app with <div class="app-{name}"> as the root container element, replacing {name} with a short lowercase slug like app-todo, app-calculator, or app-paint.
- Everything must be self-contained inline: <style> for CSS, <script> for JS.
- Design a rich, polished dark UI. Use gradients, shadows, border-radius, smooth transitions, proper spacing, and visual hierarchy. Make it look like a high-quality native app, not a prototype.
- Full working JavaScript with all requested features, event handlers, keyboard shortcuts where useful, error handling, state updates, and DOM updates.
- Functionality is more important than decoration. A pretty UI with dead buttons, fake data, placeholder panels, or missing behavior is a failed app.
- Every visible interactive control must work: buttons, inputs, sliders, selects, tabs, menus, canvases, keyboard controls, file controls, save/export actions, and reset/delete actions.
- If the app accepts user-created data, persist it with os.fs or localStorage and load it when the app opens again.
- If live external data is unavailable or unnecessary, provide local working behavior instead of fake static data. Clearly handle errors in the UI.
- The app must be usable immediately after rendering; initialize all state and bind all events inside the returned code.
- Scoped CSS: prefix all selectors with the actual app root class, such as .app-todo, to avoid conflicts.
- You MAY use <iframe> to embed external content (maps, charts, videos, web widgets, music services like https://radio.garden/, etc.) — set allow="*" and sandbox as needed. This is great for rich data visualizations or embedded services.
- For games: render a proper UI with score, controls, restart button, and visual polish.
- CRITICAL for games: use DELTA TIME for all movement, physics, and animation logic. Multiply speeds/velocities by dt (the time elapsed since the last frame) so the game runs at the same speed regardless of frame rate. Use requestAnimationFrame's timestamp parameter to compute dt. Do NOT rely on fixed timesteps or assume a constant frame rate.
- Do NOT use external resources, CDN links, or external images. Everything must be inline.

---
CRITICAL: WINDOW RESIZE / RESPONSIVE LAYOUT
---
Your app lives inside an iframe that users can resize at any time by dragging the window edge or maximizing it. The iframe's width and height change dynamically.

You MUST make your app fill and adapt to the available space:
- Set the root <div class="app-{name}"> to width:100%; height:100% so it fills the iframe, again replacing {name} with the same slug.
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
os.window.icon                → get/set the window icon (emoji or SVG data URL)
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
os.settings.get(key)     → get a setting (accent, wallpaper, wallpaperBlur, wallpaperDim, desktopMenuItems)
os.settings.set(key,val)      → change a setting (saves + applies instantly)
os.settings.getAll()           → all current settings
os.settings.reset()            → restore all defaults
os.settings.onChange(fn)       → subscribe to setting changes: fn(key, value) called on every set()
os.settings.offChange(fn)      → unsubscribe

Available settings:
  accent         → hex color for the OS accent (e.g. "#ff6b6b") — changes instantly
  wallpaper      → URL string for desktop wallpaper image, or "" for none
  wallpaperBlur  → blur amount in pixels for the wallpaper (0 = no blur)
  wallpaperDim   → darkness overlay opacity 0-1 for wallpaper readability
  theme          → "dark" or "light" — OS color scheme
  desktopMenuItems → array of enabled desktop right-click menu item IDs
  hideWelcome      → boolean — skip the welcome screen on startup

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

---
FUNCTIONAL COMPLETENESS CHECKLIST — satisfy this before outputting
---
1. Identify the user's core workflow and implement it end-to-end, not just the layout.
2. Add JS behavior for every control and visible feature.
3. Ensure changing inputs updates the UI immediately.
4. Ensure save/load/export/import/delete/reset actions actually do something.
5. Ensure games, timers, clocks, drawing tools, editors, calculators, converters, trackers, and media tools have real logic.
6. Include non-empty <script> code unless the requested app is truly static or is entirely an iframe embed.
7. Do not output TODO comments, placeholder text like "coming soon", fake buttons, inert tabs, or mock-only data.

Remember: build ONLY what the user requested. Do not add system info, hardware stats, or unrelated features. Keep it focused, complete, and polished.`;

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

Generate the complete, functional HTML for this app. Output exactly one root <div class="app-{name}">, replacing {name} with a short lowercase slug, with inline <style> and <script>. Only output the HTML code, no other text.`;
}

function buildWidgetPrompt(desc) {
  return `You are building a tiny desktop widget for Infinite OS.

User request: "${desc}"

Requirements:
- Output ONLY HTML code. No markdown, no explanations.
- Output exactly one root <div class="widget-{short-slug}"> with inline <style> and optional inline <script> inside it.
- The widget will run in a 240px wide transparent iframe. Make it compact, polished, and readable at that size.
- Use CSS variables when possible: var(--os-bg), var(--os-bg2), var(--os-bg3), var(--os-surface), var(--os-border), var(--os-text), var(--os-text2), var(--os-accent).
- Do not use browser alert(), prompt(), or confirm(). If interaction is needed, build controls in the widget UI.
- Do not load external resources, fonts, scripts, images, or network data.
- Keep scripts self-contained. Avoid localStorage unless the user specifically asks for persistence.
- Build exactly what the user requested; do not add unrelated panels, system stats, or dashboards.`;
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

function generationErrorHTML(desc, reasons) {
  const detail =
    Array.isArray(reasons) && reasons.length
      ? `<p>${htmlEscape(reasons.slice(0, 3).join(" "))}</p>`
      : `<p>The AI service did not return a usable app. Try again in a moment.</p>`;
  return `<div class="app-generation-error">
<style>
.app-generation-error{padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#e8e8f0}
.app-generation-error .ic{font-size:48px;margin-bottom:12px}
.app-generation-error h2{font-size:18px;margin:0 0 8px}
.app-generation-error p{margin:0;color:#9898b0;font-size:13px;line-height:1.5}
</style>
<div class="ic">⚠️</div>
<h2>Could not generate ${htmlEscape(desc)}</h2>
${detail}
</div>`;
}

// ─── State ─────────────────────────────────────────────────────────
const S = {
  windows: {},
  order: [],
  z: 100,
  launcher: false,
  widgets: [],
  widgetZ: 1,
  contextMenu: { x: 0, y: 0 },
};

// ═══════════════════════════════════════════════════════════════════════
// HTML EXTRACTION (balanced div counting for AI output)
// ═══════════════════════════════════════════════════════════════════════

function extractHTML(text) {
  const m = text.match(/<div\s+class\s*=\s*["'][^"']*\bapp-[^"']*["']/i);
  if (!m) return null;
  const lower = text.toLowerCase();
  let i = m.index,
    depth = 0,
    inScript = false,
    inStyle = false;

  while (i < text.length) {
    if (inScript) {
      if (lower.startsWith("</script>", i)) {
        inScript = false;
        i += 9;
        continue;
      }
      i++;
      continue;
    }
    if (inStyle) {
      if (lower.startsWith("</style>", i)) {
        inStyle = false;
        i += 8;
        continue;
      }
      i++;
      continue;
    }

    if (lower.startsWith("<script", i)) {
      inScript = true;
      const close = text.indexOf(">", i);
      if (close === -1) return null;
      i = close + 1;
      continue;
    }
    if (lower.startsWith("<style", i)) {
      inStyle = true;
      const close = text.indexOf(">", i);
      if (close === -1) return null;
      i = close + 1;
      continue;
    }

    if (lower.startsWith("<div", i) && !lower.startsWith("</div", i)) {
      const close = text.indexOf(">", i);
      if (close === -1) return null;
      if (!/\/\s*>$/.test(text.slice(i, close + 1))) depth++;
      i = close + 1;
      continue;
    }
    if (lower.startsWith("</div>", i)) {
      depth--;
      if (depth === 0) return text.slice(m.index, i + 6);
      i += 6;
      continue;
    }
    i++;
  }
  return null;
}

function stripAIFormatting(raw) {
  if (!raw) return null;
  return String(raw)
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, "")
    .replace(/^\s*```[\w-]*\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function visibleTextFromHTML(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateGeneratedApp(html, desc) {
  const reasons = [];
  if (!html || html.length < 300) {
    reasons.push("The generated HTML was too small to be a complete app.");
    return { ok: false, reasons };
  }

  const rootMatch = html.match(
    /<div\s+class\s*=\s*["'][^"']*\bapp-[^"']*["']/i,
  );
  if (!rootMatch) reasons.push("Missing the required app-* root container.");
  if (!/<style\b[\s\S]*?>[\s\S]{20,}<\/style>/i.test(html)) {
    reasons.push("Missing substantial scoped CSS.");
  }

  const scripts = [
    ...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1].trim());
  const scriptText = scripts.join("\n");
  const scriptWithoutComments = scriptText
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, "")
    .trim();

  const interactiveMatches = html.match(
    /<(button|input|textarea|select|canvas|form)\b|contenteditable\s*=\s*["']?true|role\s*=\s*["']?(button|slider|tab|switch|menuitem)/gi,
  );
  const controlCount = interactiveMatches ? interactiveMatches.length : 0;
  const hasIframe = /<iframe\b/i.test(html);
  const hasInlineHandlers = /\son[a-z]+\s*=/i.test(html);
  const hasBehaviorSignals =
    /(addEventListener|onclick|oninput|onchange|onkeydown|onsubmit|requestAnimationFrame|setInterval|setTimeout|localStorage|os\.fs|os\.clipboard|os\.shell|os\.notify|fetch\s*\(|FileReader|getContext\s*\(|new\s+Audio|AudioContext|classList|appendChild|remove\s*\(|textContent|innerHTML|\.value\s*=)/i.test(
      scriptText,
    );
  const hasSubstantialScript = scriptWithoutComments.length >= 80;

  if (
    controlCount > 0 &&
    !hasIframe &&
    !hasInlineHandlers &&
    !hasSubstantialScript
  ) {
    reasons.push(
      "Interactive controls were generated without enough JavaScript behavior.",
    );
  } else if (
    controlCount >= 3 &&
    !hasIframe &&
    !hasInlineHandlers &&
    !hasBehaviorSignals
  ) {
    reasons.push(
      "The JavaScript does not appear to wire the visible controls to behavior.",
    );
  }

  const visibleText = visibleTextFromHTML(html);
  if (
    /(coming soon|not implemented|todo:|does nothing|non[- ]functional|static preview|ui only|mock only|demo only)/i.test(
      visibleText,
    )
  ) {
    reasons.push("The app contains placeholder or non-functional text.");
  }
  if (
    /href\s*=\s*["']#['"]/i.test(html) &&
    !hasInlineHandlers &&
    !hasSubstantialScript
  ) {
    reasons.push("The app contains dead links without JavaScript handlers.");
  }

  const managesUserData =
    /\b(todo|to-do|task|note|memo|journal|diary|list|tracker|habit|budget|expense|inventory|recipe|bookmark|contact|calendar|planner|kanban)\b/i.test(
      desc,
    );
  if (
    managesUserData &&
    controlCount > 0 &&
    !/(localStorage|os\.fs)/i.test(scriptText)
  ) {
    reasons.push(
      "Apps that manage user data should save and reload it with os.fs or localStorage.",
    );
  }

  return { ok: reasons.length === 0, reasons };
}

function prepareGeneratedApp(raw, desc) {
  const cleaned = stripAIFormatting(raw);
  if (!cleaned) {
    return {
      ok: false,
      html: null,
      source: "",
      reasons: ["The AI returned no text."],
    };
  }
  const html = extractHTML(cleaned);
  if (!html) {
    return {
      ok: false,
      html: null,
      source: cleaned,
      reasons: ["The AI did not return one complete app-* root div."],
    };
  }
  const validation = validateGeneratedApp(html, desc);
  return { ok: validation.ok, html, source: html, reasons: validation.reasons };
}

function buildRepairPrompt(desc, previousHTML, reasons) {
  const reasonList =
    reasons.map((r) => `- ${r}`).join("\n") || "- Failed validation.";
  const clippedHTML = String(previousHTML || "").slice(0, 32000);
  return `${APP_SPEC}${templateReference(desc)}

User request: "${desc}"

The previous generated app was rejected because:
${reasonList}

Repair it now. Return a complete replacement app, not a patch. Preserve the requested app idea and visual quality, but make all controls and workflows actually functional.

Previous generated HTML:
${clippedHTML}

Only output the corrected HTML code, no markdown or explanation.`;
}

async function repairGeneratedApp(desc, previousHTML, reasons) {
  try {
    return await callAI(buildRepairPrompt(desc, previousHTML, reasons), null, {
      temperature: AI_REPAIR_TEMPERATURE,
    });
  } catch (e) {
    console.log("[AI] Repair:", e.message);
    return null;
  }
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

async function callAI(prompt, onStream, options = {}) {
  const url = `${AI_BACKEND_URL}${onStream ? "?stream=1" : ""}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? AI_TEMPERATURE,
      maxOutputTokens: options.maxOutputTokens ?? AI_MAX_TOKENS,
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

    return stripAIFormatting(result);
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
        desktopMenuItems: [...DEFAULT_DESKTOP_MENU_ITEMS],
        hideWelcome: false,
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
        desktopMenuItems: [...DEFAULT_DESKTOP_MENU_ITEMS],
        hideWelcome: false,
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

function clampWinPos(win) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  win.x = Math.max(0, Math.min(vw - win.w, win.x));
  win.y = Math.max(0, Math.min(vh - win.h, win.y));
}

function clampWinSize(win) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  win.w = Math.min(win.w, vw - win.x);
  win.h = Math.min(win.h, vh - win.y);
}

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
  clampWinPos(win);
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
  clampWinPos(w);
  Object.assign(el.style, {
    left: w.x + "px",
    top: w.y + "px",
    width: w.w + "px",
    height: w.h + "px",
    zIndex: w.z,
  });
  el.dataset.id = id;
  el.innerHTML = `<div class="window-titlebar" onmousedown="dr(event,'${id}')"><div class="wc"><button class="wcc" onclick="cW('${id}')"></button><button class="wcm" onclick="mW('${id}')"></button><button class="wcx" onclick="MW('${id}')"></button></div><div class="t" id="wt-${id}"><span class="ie">${iconHTML(w.icon)}</span>${htmlEscape(w.title)}</div><div class="wc" style="visibility:hidden"><button></button><button></button><button></button></div></div><div class="window-body" id="wb-${id}"></div><div class="wrz" onmousedown="rz(event,'${id}')"></div>`;
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
  if (e)
    e.innerHTML = `<span class="ie">${iconHTML(w.icon)}</span>${htmlEscape(w.title)}`;
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
      clampWinPos(w);
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
  clampWinSize(win);
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
    clampWinPos(w);
    const el = document.getElementById("w-" + id);
    if (el) {
      el.style.left = w.x + "px";
      el.style.top = w.y + "px";
    }
  };
  const up = () => {
    document.body.classList.remove("is-dragging");
    document.removeEventListener("mousemove", mv);
    document.removeEventListener("mouseup", up);
    window.removeEventListener("blur", up);
  };
  document.body.classList.add("is-dragging");
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
    clampWinSize(w);
    const el = document.getElementById("w-" + id);
    if (el) {
      el.style.width = w.w + "px";
      el.style.height = w.h + "px";
    }
  };
  const up = () => {
    document.body.classList.remove("is-resizing");
    document.removeEventListener("mousemove", mv);
    document.removeEventListener("mouseup", up);
    window.removeEventListener("blur", up);
  };
  document.body.classList.add("is-resizing");
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

function widgetDocument(id, html) {
  const widgetId = JSON.stringify(String(id).replace(/^widget-/, ""));
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
html{margin:0;width:100%;min-height:0;background:transparent;color-scheme:${colorScheme};overflow:hidden;scrollbar-width:none}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}
body{margin:0;width:max-content;min-width:100%;min-height:0;background:transparent;color:var(--os-text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;overflow:hidden;scrollbar-width:none}
button,input,textarea,select{font:inherit}
</style>
<script>
(() => {
  const widgetId = ${widgetId};
  const measure = () => {
    const nodes = [document.body, document.documentElement, ...document.body.querySelectorAll('*')];
    let right = 0, bottom = 0;
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      right = Math.max(right, rect.right, node.scrollWidth || 0, node.offsetWidth || 0);
      bottom = Math.max(bottom, rect.bottom, node.scrollHeight || 0, node.offsetHeight || 0);
    }
    parent.postMessage({ type: 'io-widget-size', id: widgetId, w: Math.ceil(right), h: Math.ceil(bottom) }, '*');
  };
  const schedule = () => requestAnimationFrame(measure);
  addEventListener('load', () => { measure(); setTimeout(measure, 50); setTimeout(measure, 250); });
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(document.documentElement);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
})();
</script>
</head>
<body>${html}</body>
</html>`;
}

const ICON_PALETTES = [
  ["#7c3aed", "#a78bfa", "#22d3ee"],
  ["#0ea5e9", "#38bdf8", "#facc15"],
  ["#10b981", "#34d399", "#a7f3d0"],
  ["#f97316", "#fb923c", "#fde68a"],
  ["#ec4899", "#f472b6", "#c4b5fd"],
  ["#ef4444", "#f87171", "#fbbf24"],
  ["#14b8a6", "#2dd4bf", "#99f6e4"],
  ["#6366f1", "#818cf8", "#f0abfc"],
  ["#64748b", "#94a3b8", "#e2e8f0"],
  ["#0891b2", "#67e8f9", "#cffafe"],
  ["#be123c", "#fb7185", "#ffe4e6"],
  ["#4338ca", "#60a5fa", "#bfdbfe"],
  ["#15803d", "#86efac", "#dcfce7"],
  ["#a16207", "#facc15", "#fef3c7"],
  ["#7e22ce", "#d946ef", "#fae8ff"],
  ["#334155", "#94a3b8", "#f8fafc"],
];

const ICON_KIND_KEYWORDS = [
  {
    kind: "calculator",
    keys: [
      "calc",
      "calculator",
      "math",
      "budget",
      "finance",
      "money",
      "expense",
    ],
  },
  {
    kind: "todo",
    keys: ["todo", "task", "tasks", "list", "check", "checklist", "kanban"],
  },
  {
    kind: "note",
    keys: [
      "note",
      "notes",
      "memo",
      "write",
      "journal",
      "doc",
      "docs",
      "document",
    ],
  },
  {
    kind: "paint",
    keys: [
      "paint",
      "draw",
      "drawing",
      "sketch",
      "color",
      "palette",
      "picker",
      "design",
    ],
  },
  {
    kind: "clock",
    keys: [
      "clock",
      "time",
      "watch",
      "timer",
      "stopwatch",
      "alarm",
      "pomodoro",
      "calendar",
    ],
  },
  {
    kind: "weather",
    keys: [
      "weather",
      "forecast",
      "sun",
      "rain",
      "storm",
      "cloud",
      "temperature",
    ],
  },
  {
    kind: "chat",
    keys: [
      "chat",
      "message",
      "messages",
      "ai",
      "assistant",
      "bot",
      "talk",
      "support",
    ],
  },
  {
    kind: "music",
    keys: ["music", "player", "sound", "audio", "radio", "podcast", "song"],
  },
  {
    kind: "game",
    keys: ["game", "games", "tic", "tac", "toe", "puzzle", "arcade", "play"],
  },
  {
    kind: "chart",
    keys: [
      "chart",
      "graph",
      "stats",
      "analytics",
      "data",
      "dashboard",
      "report",
    ],
  },
  {
    kind: "lock",
    keys: ["lock", "password", "secure", "security", "vault", "key", "encrypt"],
  },
  {
    kind: "web",
    keys: ["web", "browser", "link", "site", "url", "internet", "network"],
  },
  {
    kind: "folder",
    keys: ["file", "files", "folder", "manager", "storage", "drive", "archive"],
  },
  { kind: "mail", keys: ["mail", "email", "inbox", "letter", "newsletter"] },
  {
    kind: "code",
    keys: [
      "code",
      "coding",
      "developer",
      "dev",
      "script",
      "html",
      "css",
      "javascript",
      "json",
    ],
  },
  {
    kind: "terminal",
    keys: ["terminal", "console", "shell", "command", "cli", "bash"],
  },
  { kind: "camera", keys: ["camera", "photo", "photos", "capture", "lens"] },
  {
    kind: "image",
    keys: ["image", "images", "gallery", "picture", "pictures", "album"],
  },
  { kind: "video", keys: ["video", "movie", "film", "stream", "player"] },
  {
    kind: "settings",
    keys: ["settings", "setting", "config", "preferences", "tools", "control"],
  },
  { kind: "search", keys: ["search", "find", "lookup", "discover"] },
  { kind: "map", keys: ["map", "maps", "location", "gps", "route", "travel"] },
  {
    kind: "shop",
    keys: ["shop", "store", "cart", "market", "commerce", "buy"],
  },
  {
    kind: "book",
    keys: ["book", "books", "read", "reader", "library", "learn"],
  },
  {
    kind: "health",
    keys: ["health", "fitness", "heart", "medical", "workout"],
  },
  { kind: "database", keys: ["database", "db", "sql", "table", "records"] },
  { kind: "rocket", keys: ["rocket", "launch", "startup", "deploy", "ship"] },
  { kind: "widget", keys: ["widget", "widgets", "desktop", "panel", "card"] },
];

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function appInitials(name) {
  const words =
    String(name || "App")
      .toUpperCase()
      .match(/[A-Z0-9]+/g) || [];
  return (words[0]?.[0] || "A") + (words[1]?.[0] || words[0]?.[1] || "");
}

function iconKindFor(name) {
  const text = String(name || "").toLowerCase();
  const tokens = text.match(/[a-z0-9]+/g) || [];
  let bestKind = "default";
  let bestScore = 0;

  for (const entry of ICON_KIND_KEYWORDS) {
    let score = 0;
    for (const key of entry.keys) {
      if (tokens.includes(key)) score += 6;
      else if (
        key.length > 2 &&
        tokens.some((token) => token.startsWith(key))
      ) {
        score += 4;
      } else if (key.length > 2 && text.includes(key)) {
        score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKind = entry.kind;
    }
  }

  return bestKind;
}

function encodeSVG(svg) {
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
  );
}

function iconShape(kind, initials, fg, accent) {
  const line = `fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case "calculator":
      return `<rect x="18" y="13" width="28" height="38" rx="8" fill="${fg}" opacity=".94"/><rect x="23" y="19" width="18" height="7" rx="2" fill="${accent}" opacity=".9"/><g fill="${accent}"><rect x="23" y="31" width="5" height="5" rx="1.6"/><rect x="30" y="31" width="5" height="5" rx="1.6"/><rect x="37" y="31" width="5" height="5" rx="1.6"/><rect x="23" y="39" width="5" height="5" rx="1.6"/><rect x="30" y="39" width="5" height="5" rx="1.6"/><rect x="37" y="39" width="5" height="5" rx="1.6"/></g>`;
    case "todo":
      return `<rect x="17" y="15" width="30" height="34" rx="8" fill="${fg}" opacity=".94"/><path d="M23 26l3 3 6-7M23 37l3 3 6-7" ${line}/><path d="M35 27h7M35 38h7" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".72"/>`;
    case "note":
      return `<path d="M20 13h18l8 8v30H20z" fill="${fg}" opacity=".94"/><path d="M38 13v9h8" ${line} opacity=".8"/><path d="M26 30h13M26 37h12M26 44h8" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".76"/>`;
    case "paint":
      return `<path d="M33 14c-10 0-18 7-18 16 0 10 8 18 18 18h5c3 0 4-4 2-6-2-3 0-6 4-6h1c4 0 5-3 5-7 0-8-8-15-17-15z" fill="${fg}" opacity=".94"/><circle cx="25" cy="27" r="3" fill="${accent}"/><circle cx="33" cy="23" r="3" fill="#0f172a" opacity=".35"/><circle cx="41" cy="29" r="3" fill="${accent}" opacity=".65"/><circle cx="31" cy="37" r="3" fill="#0f172a" opacity=".25"/>`;
    case "clock":
      return `<circle cx="32" cy="32" r="18" fill="${fg}" opacity=".94"/><circle cx="32" cy="32" r="14" fill="none" stroke="${accent}" stroke-width="3" opacity=".65"/><path d="M32 23v10l7 5" ${line}/>`;
    case "weather":
      return `<circle cx="26" cy="24" r="9" fill="${accent}"/><path d="M18 43h27c4 0 7-3 7-7s-3-7-7-7c-2-7-12-8-16-2-5-2-11 2-11 8-4 1-6 3-6 7 0 1 2 1 6 1z" fill="${fg}" opacity=".95"/>`;
    case "chat":
      return `<path d="M16 18h32v23H31l-9 8v-8h-6z" fill="${fg}" opacity=".94"/><path d="M24 28h16M24 35h10" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".78"/>`;
    case "music":
      return `<path d="M39 15v24a6 6 0 1 1-4-6V20l-14 3v19a6 6 0 1 1-4-6V20z" fill="${fg}" opacity=".94"/><path d="M21 20l18-4v7l-18 4z" fill="${accent}" opacity=".82"/>`;
    case "game":
      return `<path d="M18 29c2-6 7-9 14-6 7-3 12 0 14 6l3 10c1 4-3 8-7 5l-5-4H27l-5 4c-4 3-8-1-7-5z" fill="${fg}" opacity=".94"/><path d="M24 33h8M28 29v8" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><circle cx="39" cy="32" r="2.6" fill="${accent}"/><circle cx="44" cy="37" r="2.6" fill="${accent}" opacity=".72"/>`;
    case "chart":
      return `<rect x="17" y="17" width="30" height="31" rx="8" fill="${fg}" opacity=".94"/><rect x="23" y="34" width="5" height="8" rx="2" fill="${accent}"/><rect x="30" y="27" width="5" height="15" rx="2" fill="${accent}" opacity=".78"/><rect x="37" y="22" width="5" height="20" rx="2" fill="${accent}" opacity=".58"/>`;
    case "lock":
      return `<rect x="19" y="28" width="26" height="20" rx="7" fill="${fg}" opacity=".94"/><path d="M24 28v-5a8 8 0 0 1 16 0v5" fill="none" stroke="${fg}" stroke-width="5" stroke-linecap="round" opacity=".94"/><circle cx="32" cy="38" r="3" fill="${accent}"/>`;
    case "web":
      return `<circle cx="32" cy="32" r="18" fill="${fg}" opacity=".94"/><path d="M15 32h34M32 15c5 5 8 11 8 17s-3 12-8 17M32 15c-5 5-8 11-8 17s3 12 8 17" ${line} opacity=".72"/>`;
    case "folder":
      return `<path d="M14 22h15l4 5h17v20H14z" fill="${fg}" opacity=".94"/><path d="M14 27h36v6H14z" fill="${accent}" opacity=".55"/>`;
    case "mail":
      return `<rect x="15" y="20" width="34" height="25" rx="7" fill="${fg}" opacity=".94"/><path d="M18 24l14 11 14-11" ${line} opacity=".75"/>`;
    case "code":
      return `<rect x="15" y="17" width="34" height="30" rx="8" fill="${fg}" opacity=".94"/><path d="M27 27l-5 5 5 5M37 27l5 5-5 5" ${line}/><path d="M34 24l-4 16" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
    case "terminal":
      return `<rect x="14" y="18" width="36" height="29" rx="7" fill="${fg}" opacity=".94"/><path d="M22 28l5 4-5 4M31 38h11" ${line}/>`;
    case "camera":
      return `<path d="M18 24h7l3-5h8l3 5h7v22H18z" fill="${fg}" opacity=".94"/><circle cx="32" cy="35" r="8" fill="none" stroke="${accent}" stroke-width="4"/><circle cx="43" cy="29" r="2" fill="${accent}"/>`;
    case "image":
      return `<rect x="16" y="17" width="32" height="30" rx="7" fill="${fg}" opacity=".94"/><circle cx="38" cy="27" r="4" fill="${accent}"/><path d="M20 42l9-10 6 6 4-4 7 8" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".78"/>`;
    case "video":
      return `<rect x="15" y="20" width="30" height="24" rx="7" fill="${fg}" opacity=".94"/><path d="M45 28l7-5v18l-7-5z" fill="${fg}" opacity=".84"/><path d="M28 27l9 5-9 5z" fill="${accent}"/>`;
    case "settings":
      return `<path d="M32 14l4 5 6-1 2 6 5 3-3 5 3 5-5 3-2 6-6-1-4 5-4-5-6 1-2-6-5-3 3-5-3-5 5-3 2-6 6 1z" fill="${fg}" opacity=".94" fill-rule="evenodd"/><circle cx="32" cy="32" r="7" fill="${accent}"/>`;
    case "search":
      return `<circle cx="29" cy="29" r="13" fill="${fg}" opacity=".94"/><circle cx="29" cy="29" r="8" fill="none" stroke="${accent}" stroke-width="3" opacity=".75"/><path d="M39 39l9 9" ${line}/>`;
    case "map":
      return `<path d="M18 18l10-4 10 4 10-4v32l-10 4-10-4-10 4z" fill="${fg}" opacity=".94"/><path d="M28 14v32M38 18v32" stroke="${accent}" stroke-width="2.5" opacity=".65"/><circle cx="33" cy="29" r="4" fill="${accent}"/>`;
    case "shop":
      return `<path d="M18 28h28l-3 21H21z" fill="${fg}" opacity=".94"/><path d="M23 28a9 9 0 0 1 18 0" ${line}/><path d="M22 35h22" stroke="${accent}" stroke-width="3" opacity=".65"/>`;
    case "book":
      return `<path d="M18 16h22a6 6 0 0 1 6 6v27H24a6 6 0 0 0-6 4z" fill="${fg}" opacity=".94"/><path d="M24 24h14M24 31h12M24 38h15" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
    case "health":
      return `<path d="M32 48S17 39 17 27c0-7 8-11 15-4 7-7 15-3 15 4 0 12-15 21-15 21z" fill="${fg}" opacity=".94"/><path d="M25 32h5l2-6 3 12 2-6h5" ${line} opacity=".8"/>`;
    case "database":
      return `<ellipse cx="32" cy="20" rx="15" ry="7" fill="${fg}" opacity=".94"/><path d="M17 20v22c0 4 7 7 15 7s15-3 15-7V20" fill="${fg}" opacity=".94"/><path d="M17 31c0 4 7 7 15 7s15-3 15-7" fill="none" stroke="${accent}" stroke-width="3" opacity=".65"/>`;
    case "rocket":
      return `<path d="M36 13c8 3 12 11 12 19L36 44l-8-8 12-12-12 12-8-8z" fill="${fg}" opacity=".94"/><circle cx="38" cy="25" r="4" fill="${accent}"/><path d="M25 39l-7 7 10-3" fill="${accent}" opacity=".85"/>`;
    case "widget":
      return `<rect x="16" y="16" width="14" height="14" rx="4" fill="${fg}" opacity=".94"/><rect x="34" y="16" width="14" height="14" rx="4" fill="${fg}" opacity=".72"/><rect x="16" y="34" width="14" height="14" rx="4" fill="${fg}" opacity=".72"/><rect x="34" y="34" width="14" height="14" rx="4" fill="${fg}" opacity=".94"/><circle cx="41" cy="41" r="4" fill="${accent}"/>`;
    default:
      return `<circle cx="32" cy="32" r="18" fill="${fg}" opacity=".16"/><text x="32" y="39" text-anchor="middle" font-family="Inter,system-ui,-apple-system,sans-serif" font-size="20" font-weight="850" fill="${fg}">${htmlEscape(initials)}</text><path d="M47 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${fg}" opacity=".72"/>`;
  }
}

function iconFor(n) {
  const name = String(n || "App").trim() || "App";
  const hash = hashString(name);
  const palette = ICON_PALETTES[hash % ICON_PALETTES.length];
  const [from, to, accent] = palette;
  const kind = iconKindFor(name);
  const initials = appInitials(name);
  const fg = "#ffffff";
  const id = hash.toString(36);
  const blobX = 12 + (hash % 22);
  const blobY = 8 + ((hash >>> 5) % 18);
  const ringX = 34 + ((hash >>> 9) % 14);
  const ringY = 36 + ((hash >>> 13) % 12);
  const shineX = 8 + ((hash >>> 17) % 10);
  const aria = htmlEscape(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${aria} icon">
  <defs>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset=".58" stop-color="${to}"/><stop offset="1" stop-color="${accent}"/></linearGradient>
    <radialGradient id="r-${id}" cx=".25" cy=".18" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="s-${id}" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity=".3"/></filter>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#g-${id})"/>
  <rect x="2" y="2" width="60" height="60" rx="17" fill="url(#r-${id})"/>
  <path d="M${shineX} 8c12-5 30-4 43 8" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".1"/>
  <circle cx="${blobX}" cy="${blobY}" r="21" fill="${fg}" opacity=".12"/>
  <circle cx="${ringX}" cy="${ringY}" r="16" fill="none" stroke="${fg}" stroke-width="8" opacity=".1"/>
  <g filter="url(#s-${id})">${iconShape(kind, initials, fg, accent)}</g>
  <rect x="2.5" y="2.5" width="59" height="59" rx="16.5" fill="none" stroke="#fff" stroke-opacity=".18"/>
</svg>`;
  return encodeSVG(svg);
}

function isSvgIcon(icon) {
  return typeof icon === "string" && /^data:image\/svg\+xml/i.test(icon);
}

function iconHTML(icon, extraClass = "") {
  const value = String(icon || "").trim();
  if (isSvgIcon(value)) {
    const cls = ["svg-icon", extraClass].filter(Boolean).join(" ");
    return `<img class="${cls}" alt="" src="${htmlEscape(value)}">`;
  }
  return htmlEscape(value || "📱");
}

function renderApp(id, desc, html) {
  const win = S.windows[id];
  const appIcon = savedAppEntry(id)?.icon || iconFor(desc);
  if (!win) createWin(id, desc, appIcon, 540, 400);
  const w = S.windows[id];
  if (!w) return;
  w.title = desc
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  w.icon = appIcon;
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

function appIdFor(desc) {
  return (
    String(desc || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "app"
  );
}

function savedAppEntry(id) {
  try {
    const index = JSON.parse(localStorage.getItem("io_app_index") || "[]");
    return index.find((entry) => entry.id === id) || null;
  } catch (_) {
    return null;
  }
}

function savedAppName(id, fallback) {
  const entry = savedAppEntry(id);
  return entry?.name || fallback || id.replace(/_/g, " ");
}

function loadAppHTML(id) {
  if (appCache[id]) return appCache[id];
  try {
    const html = localStorage.getItem("io_app_" + id);
    if (html) appCache[id] = html;
    return html;
  } catch (_) {
    return null;
  }
}

async function openInstalledApp(id, fallbackName) {
  await openApp(savedAppName(id, fallbackName), { id });
}

async function regenerateApp(id, closeWinId) {
  const name = savedAppName(id);
  if (
    !confirm(
      `Regenerate "${name}" with AI? This replaces the app code but keeps any data the app saved separately.`,
    )
  ) {
    return;
  }

  delete appCache[id];
  try {
    localStorage.removeItem("io_app_" + id);
  } catch (_) {}

  if (closeWinId && S.windows[closeWinId]) cW(closeWinId);
  if (S.windows[id]) cW(id);
  showNotif("🔁 Regenerating", 'Building a fresh version of "' + name + '"');
  await openApp(name, { id, regenerate: true });
}

async function openApp(desc, options = {}) {
  closeLauncher();
  const d = String(desc || "").trim();
  if (!d) return;
  const id = options.id || appIdFor(d);
  const forceRegenerate = !!options.regenerate;
  if (S.windows[id] && !forceRegenerate) {
    focusWin(id);
    return;
  }
  if (S.windows[id] && forceRegenerate) cW(id);

  const cachedHTML = forceRegenerate ? null : loadAppHTML(id);
  if (cachedHTML) {
    const cached = validateGeneratedApp(cachedHTML, d);
    if (cached.ok) {
      renderApp(id, d, cachedHTML);
      return;
    }
    console.warn(
      "[AI] Cached app failed validation; regenerating",
      cached.reasons,
    );
    delete appCache[id];
    try {
      localStorage.removeItem("io_app_" + id);
    } catch (_) {}
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

  const setBuildStatus = (message) => {
    const st = document.getElementById("build-st-" + id);
    if (st) st.textContent = message;
  };

  const raw =
    (await streamApp(id, d, (txt) => {
      const el = document.getElementById("build-pv-" + id);
      const st = document.getElementById("build-st-" + id);
      if (!el || !st) return;
      el.style.display = "block";
      let clean = stripAIFormatting(txt) || "";
      el.textContent = clean.length > 1200 ? "…\n" + clean.slice(-1200) : clean;
      el.scrollTop = el.scrollHeight;
      st.textContent = "Generating...";
    })) || (await genWithAI(d));

  setBuildStatus("Checking functionality...");
  let result = prepareGeneratedApp(raw, d);

  if (!result.ok) {
    console.warn("[AI] Generated app failed validation", result.reasons);
    setBuildStatus(
      "Generated UI looked incomplete. Repairing functionality...",
    );
    const repairedRaw = await repairGeneratedApp(
      d,
      result.source || raw,
      result.reasons,
    );
    result = prepareGeneratedApp(repairedRaw, d);
  }

  if (result.ok && result.html) {
    appCache[id] = result.html;
    saveApp(id, d, result.html);
    renderApp(id, d, result.html);
  } else {
    console.warn("[AI] App generation failed", result.reasons);
    renderApp(id, d, generationErrorHTML(d, result.reasons));
  }
  updTB();
}

function addDI(id, name, emoji) {
  if (document.getElementById("di-" + id)) return;
  const el = document.createElement("div");
  el.className = "desktop-icon";
  el.id = "di-" + id;
  el.ondblclick = () => openInstalledApp(id, name);
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
  el.innerHTML = `<div class="icon-emoji">${iconHTML(emoji || iconFor(name), "desktop-svg-icon")}</div><div class="icon-label">${htmlEscape(name)}</div>`;
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
  el.innerHTML = `<div class="icon-emoji">${iconHTML(emoji || iconFor(name), "desktop-svg-icon")}</div><div class="icon-label">${htmlEscape(name)}</div>`;
  el.ondblclick = () => openInstalledApp(id, name);
}

function updateAppIconPreview(winId) {
  const preview = document.getElementById("pv-em-" + winId);
  const nameInp = document.getElementById("pn-" + winId);
  const iconInp = document.getElementById("pi-" + winId);
  if (!preview) return;
  const name = nameInp?.value.trim() || "App";
  const icon = iconInp?.value.trim() || iconFor(name);
  preview.innerHTML = iconHTML(icon, "properties-icon");
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
  const currentIconInput = isSvgIcon(currentIcon) ? "" : currentIcon;

  let htmlSize = 0;
  let appHealth = "Not saved";
  let appHealthDetail = "";
  try {
    const h = localStorage.getItem("io_app_" + id);
    if (h) {
      htmlSize = h.length;
      const check = validateGeneratedApp(h, currentName);
      appHealth = check.ok ? "Looks functional" : "Needs regeneration";
      appHealthDetail = check.ok ? "" : check.reasons.slice(0, 2).join(" ");
    }
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
    <div id="pv-em-${winId}" style="font-size:48px;margin-bottom:4px;display:flex;justify-content:center">${iconHTML(currentIcon, "properties-icon")}</div>
    <div style="font-size:11px;color:var(--text2)">Generated SVG icons are created locally from the app name.</div>
  </div>
  <div style="margin-bottom:10px">
    <label style="display:block;font-size:11px;color:var(--text2);margin-bottom:3px">Emoji override</label>
    <input id="pi-${winId}" value="${htmlEscape(currentIconInput)}" maxlength="12" placeholder="Leave blank for generated SVG" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:16px;text-align:center;outline:none" oninput="updateAppIconPreview('${winId}')">
    <div style="display:flex;justify-content:center;margin-top:6px">
      <button type="button" onclick="document.getElementById('pi-${winId}').value='';updateAppIconPreview('${winId}')" style="padding:5px 9px;border:none;border-radius:6px;background:var(--surface);color:var(--text2);font-size:11px;cursor:pointer">Use generated SVG</button>
    </div>
    <div style="display:flex;gap:3px;margin-top:5px;flex-wrap:wrap;justify-content:center">` +
    emojiStrip
      .map(
        (e) =>
          `<span data-em="${e}" onclick="document.getElementById('pi-${winId}').value='${e}';updateAppIconPreview('${winId}')" style="cursor:pointer;font-size:18px;padding:2px 5px;border-radius:4px" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">${e}</span>`,
      )
      .join("") +
    `</div>
  </div>
  <div style="margin-bottom:10px">
    <label style="display:block;font-size:11px;color:var(--text2);margin-bottom:3px">App name</label>
    <input id="pn-${winId}" value="${htmlEscape(currentName)}" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:14px;outline:none" oninput="updateAppIconPreview('${winId}')">
  </div>
  <div style="margin-bottom:12px;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:11px;color:var(--text2);line-height:1.5">
    <b>App ID:</b> ${htmlEscape(id)}<br>
    <b>Storage:</b> ${htmlSize > 0 ? (htmlSize / 1024).toFixed(1) + " KB" : "Not saved"}<br>
    <b>Status:</b> ${htmlEscape(appHealth)}${appHealthDetail ? `<br><span>${htmlEscape(appHealthDetail)}</span>` : ""}
  </div>
  <div style="margin-top:auto;display:flex;gap:8px;align-items:center;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--border)">
    <button onclick="regenerateApp('${id}','${winId}')" style="padding:8px 12px;border:none;border-radius:6px;background:var(--surface);color:var(--text);font-size:13px;cursor:pointer;margin-right:auto">🔁 Regenerate</button>
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
  const newIcon = iconInp.value.trim() || iconFor(newName);

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
  const syncFrame = (frame) => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      let style = doc.getElementById("os-theme-vars");
      if (!style) {
        style = doc.createElement("style");
        style.id = "os-theme-vars";
        doc.head.appendChild(style);
      }
      style.textContent = ":root{" + css + "}";
      doc.documentElement.style.colorScheme = colorScheme;
    } catch (e) {}
  };

  for (const id of Object.keys(S.windows)) {
    const body = document.getElementById("wb-" + id);
    if (!body) continue;
    const frame = body.querySelector("iframe.app-frame");
    if (frame) syncFrame(frame);
  }
  document.querySelectorAll("iframe.desktop-widget-frame").forEach(syncFrame);
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
    btn.innerHTML = `${iconHTML(w.icon, "tb-icon")}<span class="tb-title">${htmlEscape(w.title)}</span>`;
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
  updateWidgetClocks();
}

function widgetId() {
  return (
    "wg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  );
}

function widgetTitle(text) {
  const words = String(text || "Widget")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  const title = words.join(" ") || "Widget";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function widgetSpecFromPrompt(promptText) {
  const text = String(promptText || "Widget").trim() || "Widget";
  const q = text.toLowerCase();

  if (/\b(clock|time|date)\b/.test(q)) return { title: "Clock", icon: "🕒" };
  if (/\b(todo|task|checklist|list)\b/.test(q)) {
    return { title: "Checklist", icon: "✅" };
  }
  if (/\b(note|sticky)\b/.test(q)) return { title: "Note", icon: "📝" };
  if (/\breminder\b/.test(q)) return { title: "Reminder", icon: "🔔" };
  if (/\b(weather|forecast)\b/.test(q)) return { title: "Weather", icon: "🌤️" };

  return { title: widgetTitle(text), icon: "✨" };
}

function normalizeGeneratedWidgetHTML(raw) {
  let html = stripAIFormatting(raw) || "";
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) html = bodyMatch[1].trim();
  html =
    extractHTML(html) ||
    html
      .replace(
        /<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
        "",
      )
      .replace(/<link\b[\s\S]*?>/gi, "")
      .trim();
  if (!/^<div[\s>]/i.test(html)) {
    html = `<div class="widget-generated"><style>.widget-generated{padding:14px;color:var(--os-text);font:13px/1.45 system-ui,sans-serif}</style>${htmlEscape(html || "Widget generated.")}</div>`;
  }
  return html;
}

async function generateWidgetHTML(desc) {
  const raw = await callAI(buildWidgetPrompt(desc), null, {
    temperature: 0.75,
    maxOutputTokens: 2200,
  });
  return raw ? normalizeGeneratedWidgetHTML(raw) : null;
}

function widgetBodyClass(widget) {
  return widget.html ? "desktop-widget-body has-frame" : "desktop-widget-body";
}

function widgetBodyHTML(widget) {
  if (widget.status === "generating") {
    return `<div class="desktop-widget-status"><span class="spinner"></span><strong>Generating widget…</strong><small>Asking AI to build “${htmlEscape(widget.prompt || widget.title || "widget")}”</small></div>`;
  }
  if (widget.status === "error") {
    return `<div class="desktop-widget-status error"><strong>Couldn’t generate widget</strong><small>${htmlEscape(widget.error || "The AI backend did not return a widget.")}</small></div>`;
  }
  if (widget.html) {
    return `<iframe class="desktop-widget-frame" data-widget-frame="${widget.id}" title="${htmlEscape(widget.title || "Widget")}" scrolling="no"></iframe>`;
  }

  if (widget.type === "clock") {
    return `<div class="desktop-widget-clock" data-widget-clock="${widget.id}"><strong>--:--</strong><span>Loading date…</span></div>`;
  }
  if (widget.type === "list") {
    const items = String(widget.text || "")
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return `<ul class="desktop-widget-list">${items
      .map((item) => `<li>${htmlEscape(item)}</li>`)
      .join("")}</ul>`;
  }
  return htmlEscape(widget.text || "Double-click to regenerate this widget.");
}

function saveDesktopWidgets() {
  try {
    localStorage.setItem(WIDGETS_LS_KEY, JSON.stringify(S.widgets));
  } catch {}
}

function clampWidgetPos(widget) {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;
  const rect = desktop.getBoundingClientRect();
  const width = widget.w || 240;
  const height = widget.h || 132;
  widget.x = Math.max(8, Math.min(rect.width - width - 8, widget.x || 8));
  widget.y = Math.max(8, Math.min(rect.height - height - 8, widget.y || 8));
}

function applyWidgetFrameSize(id, width, height) {
  const widget = findWidget(id);
  const el = document.getElementById(id);
  const desktop = document.getElementById("desktop");
  const frame = el?.querySelector("iframe.desktop-widget-frame");
  const body = el?.querySelector(".desktop-widget-body.has-frame");
  if (!widget || !el || !desktop || !frame || !body) return;

  const headerHeight =
    el.querySelector(".desktop-widget-head")?.offsetHeight || 34;
  const desktopRect = desktop.getBoundingClientRect();
  const maxWidth = Math.max(220, Math.min(520, desktopRect.width - 16));
  const maxBodyHeight = Math.max(96, desktopRect.height - headerHeight - 16);
  const nextWidth = Math.max(220, Math.min(Math.ceil(width || 240), maxWidth));
  const bodyHeight = Math.max(
    96,
    Math.min(Math.ceil(height || 96), maxBodyHeight),
  );

  widget.w = nextWidth;
  widget.h = headerHeight + bodyHeight;
  el.style.width = nextWidth + "px";
  body.style.height = bodyHeight + "px";
  frame.style.height = bodyHeight + "px";
  frame.setAttribute("height", String(bodyHeight));
  clampWidgetPos(widget);
  el.style.left = widget.x + "px";
  el.style.top = widget.y + "px";
}

function resizeWidgetFrame(id) {
  const frame = document
    .getElementById(id)
    ?.querySelector("iframe.desktop-widget-frame");
  if (!frame) return;

  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const measured = Array.from(
      doc.body
        ? [doc.body, doc.documentElement, ...doc.body.querySelectorAll("*")]
        : [],
    ).reduce(
      (box, node) => {
        const rect = node.getBoundingClientRect();
        return {
          right: Math.max(
            box.right,
            rect.right,
            node.scrollWidth || 0,
            node.offsetWidth || 0,
          ),
          bottom: Math.max(
            box.bottom,
            rect.bottom,
            node.scrollHeight || 0,
            node.offsetHeight || 0,
          ),
        };
      },
      { right: 0, bottom: 0 },
    );
    applyWidgetFrameSize(id, measured.right, measured.bottom);
  } catch (e) {}
}

function watchWidgetFrame(id) {
  const frame = document
    .getElementById(id)
    ?.querySelector("iframe.desktop-widget-frame");
  if (!frame) return;
  const resize = () => resizeWidgetFrame(id);
  resize();
  requestAnimationFrame(resize);
  setTimeout(resize, 50);
  setTimeout(resize, 300);

  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    frame._widgetResizeObserver?.disconnect?.();
    frame._widgetMutationObserver?.disconnect?.();

    const resizeObserver = new ResizeObserver(resize);
    if (doc.documentElement) resizeObserver.observe(doc.documentElement);
    if (doc.body) resizeObserver.observe(doc.body);
    frame._widgetResizeObserver = resizeObserver;

    if (doc.body) {
      const mutationObserver = new MutationObserver(() =>
        requestAnimationFrame(resize),
      );
      mutationObserver.observe(doc.body, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      frame._widgetMutationObserver = mutationObserver;
    }
  } catch (e) {}
}

function renderDesktopWidget(widget) {
  const container = document.getElementById("desktop-widgets");
  if (!container) return;
  const old = document.getElementById(widget.id);
  if (old) old.remove();
  clampWidgetPos(widget);

  const el = document.createElement("div");
  el.className = "desktop-widget";
  el.id = widget.id;
  el.dataset.id = widget.id;
  Object.assign(el.style, {
    left: widget.x + "px",
    top: widget.y + "px",
    width: (widget.w || 240) + "px",
    zIndex: widget.z || 1,
  });
  el.innerHTML = `<div class="desktop-widget-head" onmousedown="dragWidget(event,'${widget.id}')">
    <div class="desktop-widget-title"><span>${htmlEscape(widget.icon || "✨")}</span><span>${htmlEscape(widget.title || "Widget")}</span></div>
    <div class="desktop-widget-actions">
      <button onclick="editWidget('${widget.id}')" title="Regenerate widget" aria-label="Regenerate widget">✎</button>
      <button onclick="removeWidget('${widget.id}')" title="Remove widget" aria-label="Remove widget">×</button>
    </div>
  </div>
  <div class="${widgetBodyClass(widget)}" ondblclick="editWidget('${widget.id}')">${widgetBodyHTML(widget)}</div>`;
  container.appendChild(el);
  const frame = el.querySelector("[data-widget-frame]");
  if (frame && widget.html) {
    frame.onload = () => watchWidgetFrame(widget.id);
    frame.srcdoc = widgetDocument("widget-" + widget.id, widget.html);
  }
  updateWidgetClocks();
}

function renderDesktopWidgets() {
  const container = document.getElementById("desktop-widgets");
  if (!container) return;
  container.innerHTML = "";
  S.widgets.forEach(renderDesktopWidget);
}

function loadDesktopWidgets() {
  try {
    const widgets = JSON.parse(localStorage.getItem(WIDGETS_LS_KEY) || "[]");
    S.widgets = Array.isArray(widgets) ? widgets : [];
  } catch {
    S.widgets = [];
  }
  S.widgetZ =
    S.widgets.reduce((max, widget) => Math.max(max, widget.z || 1), 1) + 1;
  renderDesktopWidgets();
}

function showWidgetDialog(options = {}) {
  return new Promise((resolve) => {
    document.querySelector(".widget-dialog-o")?.remove();
    const isConfirm = options.mode === "confirm";
    const overlay = document.createElement("div");
    overlay.className = "widget-dialog-o";
    overlay.innerHTML = `<div class="widget-dialog" role="dialog" aria-modal="true" aria-label="${htmlEscape(options.title || "Widget")}">
      <div class="widget-dialog-head">
        <span>${htmlEscape(options.icon || "✨")}</span>
        <div>
          <strong>${htmlEscape(options.title || "Widget")}</strong>
          <small>${htmlEscape(options.message || "")}</small>
        </div>
      </div>
      ${
        isConfirm
          ? ""
          : `<textarea class="widget-dialog-input" rows="4" placeholder="${htmlEscape(options.placeholder || "Describe a widget…")}">${htmlEscape(options.value || "")}</textarea>
             <p class="widget-dialog-hint">Tip: try “clock with date”, “sticky note for launch ideas”, or “todo list for today”.</p>`
      }
      <div class="widget-dialog-actions">
        <button class="widget-dialog-cancel" data-cancel>Cancel</button>
        <button class="widget-dialog-ok${options.danger ? " danger" : ""}" data-ok>${htmlEscape(options.confirmText || "Generate")}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector(".widget-dialog-input");
    const close = (value) => {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      resolve(value);
    };
    const submit = () => {
      if (isConfirm) {
        close(true);
        return;
      }
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }
      close(value);
    };
    const cancelValue = isConfirm ? false : null;
    const onKey = (e) => {
      if (e.key === "Escape") close(cancelValue);
      if (e.key === "Enter" && (isConfirm || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submit();
      }
    };

    overlay.querySelector("[data-cancel]").onclick = () => close(cancelValue);
    overlay.querySelector("[data-ok]").onclick = submit;
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close(cancelValue);
    });
    document.addEventListener("keydown", onKey);
    if (input) {
      input.focus();
      input.select();
    }
  });
}

async function addDesktopWidget(promptText, x, y) {
  const spec = widgetSpecFromPrompt(promptText);
  const widget = {
    id: widgetId(),
    title: spec.title,
    icon: spec.icon,
    prompt: promptText,
    html: "",
    status: "generating",
    x: x || 80,
    y: y || 80,
    w: 240,
    h: 132,
    z: S.widgetZ++,
  };
  clampWidgetPos(widget);
  S.widgets.push(widget);
  renderDesktopWidget(widget);

  try {
    const html = await generateWidgetHTML(promptText);
    if (!html) throw new Error("The AI backend did not return widget HTML.");
    widget.html = html;
    widget.status = "ready";
    widget.error = "";
    renderDesktopWidget(widget);
    saveDesktopWidgets();
    showNotif("✨ Widget added", `${widget.title} is now on the desktop`);
  } catch (e) {
    widget.status = "error";
    widget.error = e?.message || "Widget generation failed.";
    renderDesktopWidget(widget);
    saveDesktopWidgets();
    showNotif("⚠️ Widget failed", widget.error);
  }
}

async function generateWidgetFromDesktopMenu() {
  const pos = S.contextMenu || { x: 80, y: 80 };
  closeDesktopMenu();
  const request = await showWidgetDialog({
    title: "Generate Widget",
    message: "Describe the widget you want on your desktop.",
    value: "Clock with date",
    placeholder: "Example: compact weather card, sticky note, focus timer…",
    confirmText: "Generate",
  });
  if (!request) return;
  addDesktopWidget(request, pos.x, pos.y);
}

function findWidget(id) {
  return S.widgets.find((widget) => widget.id === id) || null;
}

function focusWidget(id) {
  const widget = findWidget(id);
  const el = document.getElementById(id);
  if (!widget || !el) return;
  widget.z = S.widgetZ++;
  el.style.zIndex = widget.z;
  saveDesktopWidgets();
}

function dragWidget(e, id) {
  if (e.target.closest("button")) return;
  const widget = findWidget(id);
  const el = document.getElementById(id);
  if (!widget || !el) return;
  e.preventDefault();
  focusWidget(id);
  const sx = e.clientX;
  const sy = e.clientY;
  const sl = widget.x;
  const st = widget.y;
  const mv = (ev) => {
    widget.x = sl + (ev.clientX - sx);
    widget.y = st + (ev.clientY - sy);
    clampWidgetPos(widget);
    el.style.left = widget.x + "px";
    el.style.top = widget.y + "px";
  };
  const up = () => {
    document.body.classList.remove("is-dragging");
    document.removeEventListener("mousemove", mv);
    document.removeEventListener("mouseup", up);
    window.removeEventListener("blur", up);
    saveDesktopWidgets();
  };
  document.body.classList.add("is-dragging");
  document.addEventListener("mousemove", mv);
  document.addEventListener("mouseup", up);
  window.addEventListener("blur", up);
}

async function editWidget(id) {
  const widget = findWidget(id);
  if (!widget) return;
  const next = await showWidgetDialog({
    title: "Regenerate Widget",
    message: "Update the prompt and AI will rebuild this widget.",
    value: widget.prompt || widget.text || widget.title || "Widget",
    placeholder: "Describe the regenerated widget…",
    confirmText: "Regenerate",
  });
  if (!next) return;

  const previous = { ...widget };
  const spec = widgetSpecFromPrompt(next);
  widget.title = spec.title;
  widget.icon = spec.icon;
  widget.prompt = next;
  widget.html = "";
  widget.status = "generating";
  widget.error = "";
  renderDesktopWidget(widget);

  try {
    const html = await generateWidgetHTML(next);
    if (!html) throw new Error("The AI backend did not return widget HTML.");
    widget.html = html;
    widget.status = "ready";
    renderDesktopWidget(widget);
    saveDesktopWidgets();
    showNotif("✨ Widget regenerated", `${widget.title} was rebuilt by AI`);
  } catch (e) {
    Object.assign(widget, previous);
    renderDesktopWidget(widget);
    showNotif(
      "⚠️ Regeneration failed",
      e?.message || "Widget generation failed.",
    );
  }
}

async function removeWidget(id) {
  const widget = findWidget(id);
  if (!widget) return;
  const ok = await showWidgetDialog({
    mode: "confirm",
    icon: "🗑️",
    title: "Remove Widget",
    message: `Remove ${widget.title || "this widget"} from the desktop?`,
    confirmText: "Remove",
    danger: true,
  });
  if (!ok) return;
  S.widgets = S.widgets.filter((item) => item.id !== id);
  document.getElementById(id)?.remove();
  saveDesktopWidgets();
}

function updateWidgetClocks() {
  document.querySelectorAll("[data-widget-clock]").forEach((el) => {
    const time = el.querySelector("strong");
    const date = el.querySelector("span");
    const now = new Date();
    if (time) {
      time.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (date) {
      date.textContent = now.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  });
}

function reclampDesktopWidgets() {
  S.widgets.forEach((widget) => {
    resizeWidgetFrame(widget.id);
    clampWidgetPos(widget);
    const el = document.getElementById(widget.id);
    if (el) {
      el.style.left = widget.x + "px";
      el.style.top = widget.y + "px";
    }
  });
  saveDesktopWidgets();
}

function closeDesktopMenu() {
  document.getElementById("ctx")?.classList.add("hide");
}

function desktopMenuActions() {
  return [
    {
      id: "launcher",
      icon: "✦",
      title: "Open Launcher",
      label: "✦ Open Launcher",
      description: "Search, launch, or generate an app.",
      shortcut: "Ctrl K",
      group: "main",
      run: openLauncherFromDesktopMenu,
    },
    {
      id: "addWidget",
      icon: "✨",
      title: "Generate Widget",
      label: "✨ Generate Widget",
      description: "Create a movable desktop widget here.",
      shortcut: "",
      group: "main",
      run: generateWidgetFromDesktopMenu,
    },
    {
      id: "showDesktop",
      icon: "🪟",
      title: "Show Desktop",
      label: "🪟 Show Desktop",
      description: "Minimize every open window.",
      shortcut: "",
      group: "main",
      run: showDesktop,
    },
    {
      id: "refreshDesktop",
      icon: "🔄",
      title: "Refresh Desktop",
      label: "🔄 Refresh Desktop",
      description: "Reload icons, taskbar, and theme state.",
      shortcut: "",
      group: "main",
      run: refreshDesktop,
    },
    {
      id: "closeWindows",
      icon: "🧹",
      title: "Close Windows",
      label: "🧹 Close Windows",
      description: "Close all currently open windows.",
      shortcut: "",
      group: "main",
      run: closeAllWindows,
    },
    {
      id: "settings",
      icon: "⚙️",
      title: "Settings",
      label: "⚙️ Settings",
      description: "Open Infinite OS settings.",
      shortcut: "",
      group: "system",
      run: openDesktopSettings,
    },
    {
      id: "welcome",
      icon: "✦",
      title: "Welcome",
      label: "✦ Welcome",
      description: "Show the getting-started window.",
      shortcut: "",
      group: "system",
      run: showWelcomeFromDesktopMenu,
    },
    {
      id: "manual",
      icon: "📖",
      title: "User Manual",
      label: "📖 User Manual",
      description: "Learn how to use Infinite OS.",
      shortcut: "",
      group: "system",
      run: showUserManualFromDesktopMenu,
    },
    {
      id: "about",
      icon: "ℹ️",
      title: "About Infinite OS",
      label: "ℹ️ About Infinite OS",
      description: "Show version and project information.",
      shortcut: "",
      group: "system",
      run: showAboutFromDesktopMenu,
    },
  ];
}

function desktopMenuActionById(id) {
  return desktopMenuActions().find((item) => item.id === id) || null;
}

function getDesktopMenuItemIds() {
  const known = new Set(desktopMenuActions().map((item) => item.id));
  const raw = window.os.settings.get("desktopMenuItems");
  const ids = Array.isArray(raw) ? raw : DEFAULT_DESKTOP_MENU_ITEMS;
  const clean = ids.filter(
    (id, index) => known.has(id) && ids.indexOf(id) === index,
  );
  return clean;
}

function saveDesktopMenuItemIds(ids) {
  const known = new Set(desktopMenuActions().map((item) => item.id));
  window.os.settings.set(
    "desktopMenuItems",
    ids.filter((id, index) => known.has(id) && ids.indexOf(id) === index),
  );
}

function insertDesktopMenuItem(ids, itemId) {
  if (ids.includes(itemId)) return ids;
  const defaults = DEFAULT_DESKTOP_MENU_ITEMS;
  const targetIndex = defaults.indexOf(itemId);
  if (targetIndex === -1) return [...ids, itemId];

  for (let i = targetIndex - 1; i >= 0; i--) {
    const before = ids.indexOf(defaults[i]);
    if (before !== -1) {
      const copy = [...ids];
      copy.splice(before + 1, 0, itemId);
      return copy;
    }
  }
  for (let i = targetIndex + 1; i < defaults.length; i++) {
    const after = ids.indexOf(defaults[i]);
    if (after !== -1) {
      const copy = [...ids];
      copy.splice(after, 0, itemId);
      return copy;
    }
  }
  return [...ids, itemId];
}

function setDesktopMenuItemEnabled(itemId, enabled, settingsWinId) {
  const ids = getDesktopMenuItemIds();
  const next = enabled
    ? insertDesktopMenuItem(ids, itemId)
    : ids.filter((id) => id !== itemId);
  saveDesktopMenuItemIds(next);
  rerenderSettingsWindow(settingsWinId);
}

function moveDesktopMenuItem(itemId, direction, settingsWinId) {
  const ids = getDesktopMenuItemIds();
  const index = ids.indexOf(itemId);
  const nextIndex = index + direction;
  if (index === -1 || nextIndex < 0 || nextIndex >= ids.length) return;
  const next = [...ids];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  saveDesktopMenuItemIds(next);
  rerenderSettingsWindow(settingsWinId);
}

function resetDesktopMenuItems(settingsWinId) {
  saveDesktopMenuItemIds([...DEFAULT_DESKTOP_MENU_ITEMS]);
  rerenderSettingsWindow(settingsWinId);
}

function rerenderSettingsWindow(settingsWinId) {
  const body = document.getElementById("wb-" + settingsWinId);
  if (!body) return;
  const scrollTop = body.scrollTop;
  const restoreScroll = () => {
    const maxScroll = Math.max(0, body.scrollHeight - body.clientHeight);
    body.scrollTop = Math.min(scrollTop, maxScroll);
  };
  renderSettingsBody(settingsWinId, body);
  restoreScroll();
  requestAnimationFrame(restoreScroll);
}

function renderDesktopContextMenu() {
  const menu = document.getElementById("ctx");
  if (!menu) return;
  const ids = getDesktopMenuItemIds();
  menu.innerHTML = "";

  if (!ids.length) {
    const empty = document.createElement("div");
    empty.className = "ctx-empty";
    empty.textContent = "No menu entries enabled";
    menu.appendChild(empty);
    return;
  }

  let previousGroup = null;
  ids.forEach((id) => {
    const item = desktopMenuActionById(id);
    if (!item) return;
    if (previousGroup && item.group !== previousGroup) {
      const sep = document.createElement("div");
      sep.className = "div";
      menu.appendChild(sep);
    }
    previousGroup = item.group;

    const row = document.createElement("div");
    row.className = "ctx-item";
    const label = document.createElement("span");
    label.textContent = item.label;
    row.appendChild(label);
    if (item.shortcut) {
      const shortcut = document.createElement("em");
      shortcut.textContent = item.shortcut;
      row.appendChild(shortcut);
    }
    row.onclick = item.run;
    menu.appendChild(row);
  });
}

function showDesktopMenu(x, y) {
  S.contextMenu = { x, y };
  const menu = document.getElementById("ctx");
  if (!menu) return;
  renderDesktopContextMenu();
  menu.style.visibility = "hidden";
  menu.classList.remove("hide");
  const w = menu.offsetWidth || 210;
  const h = menu.offsetHeight || 260;
  menu.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + "px";
  menu.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + "px";
  menu.style.visibility = "";
}

function openLauncherFromDesktopMenu() {
  closeDesktopMenu();
  openLauncher();
}

function openDesktopSettings() {
  closeDesktopMenu();
  openSettings();
}

function showWelcomeFromDesktopMenu() {
  closeDesktopMenu();
  showWelcome();
}

function showUserManualFromDesktopMenu() {
  closeDesktopMenu();
  showUserManual();
}

function showAboutFromDesktopMenu() {
  closeDesktopMenu();
  showAbout();
}

function showDesktop() {
  closeDesktopMenu();
  let count = 0;
  Object.values(S.windows).forEach((w) => {
    if (w.min) return;
    w.min = true;
    count++;
    const el = document.getElementById("w-" + w.id);
    if (el) el.style.display = "none";
  });
  updTB();
  showNotif(
    "🪟 Desktop",
    count
      ? `Minimized ${count} window${count === 1 ? "" : "s"}`
      : "No open windows",
  );
}

function refreshDesktop() {
  closeDesktopMenu();
  loadSavedApps();
  loadDesktopWidgets();
  applySettings();
  updTB();
  showNotif(
    "🔄 Desktop refreshed",
    "Icons, widgets, taskbar, and theme were refreshed",
  );
}

function closeAllWindows() {
  closeDesktopMenu();
  const ids = [...S.order];
  if (!ids.length) {
    showNotif("🧹 Close Windows", "No open windows to close");
    return;
  }
  if (
    !confirm(`Close ${ids.length} open window${ids.length === 1 ? "" : "s"}?`)
  ) {
    return;
  }
  ids.forEach((id) => {
    document.getElementById("w-" + id)?.remove();
    delete S.windows[id];
  });
  S.order = [];
  updTB();
  showNotif(
    "🧹 Closed",
    `Closed ${ids.length} window${ids.length === 1 ? "" : "s"}`,
  );
}

document.addEventListener("contextmenu", (e) => {
  const onDesktop = e.target.closest("#desktop");
  const onDesktopIcon = e.target.closest(".desktop-icon");
  const onDesktopWidget = e.target.closest(".desktop-widget");
  if (!onDesktop || onDesktopIcon || onDesktopWidget) return;
  e.preventDefault();
  showDesktopMenu(e.clientX, e.clientY);
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#ctx")) closeDesktopMenu();
});
document.getElementById("desktop").addEventListener("click", closeDesktopMenu);

let _welcomed = false;

function showWelcome() {
  const id = "_welcome";
  if (S.windows[id]) {
    focusWin(id);
    return;
  }
  createWin(id, "Welcome", "✦", 480, 450);
  const body = document.getElementById("wb-" + id);
  const hideWelcome = !!window.os.settings.get("hideWelcome", false);
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
      <span style="font-size:20px;flex-shrink:0">☁️</span>
      <div><strong style="font-size:13px">Cloud-powered AI</strong><br><span style="font-size:12px;color:var(--text2)">Apps are generated by Google Gemini via the cloud API backend.</span></div>
    </div>
  </div>
  <label style="margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:var(--text2);cursor:pointer;user-select:none">
    <input type="checkbox" ${hideWelcome ? "checked" : ""} onchange="setWelcomeHidden(this.checked)" style="accent-color:var(--accent);cursor:pointer">
    <span>Never show this again</span>
  </label>
  <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px">
    <button onclick="showUserManual()" style="padding:10px 20px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text);font-size:14px;cursor:pointer">📖 User Manual</button>
    <button onclick="cW('${id}')" style="padding:10px 32px;border:none;border-radius:var(--radius-sm);background:var(--accent);color:#fff;font-size:14px;cursor:pointer">Get Started</button>
  </div>
</div>`;
  }
}

function setWelcomeHidden(hidden) {
  window.os.settings.set("hideWelcome", !!hidden);
}

function showUserManual() {
  const id = "_manual";
  if (S.windows[id]) {
    focusWin(id);
    return;
  }
  createWin(id, "User Manual", "📖", 720, 560);
  const body = document.getElementById("wb-" + id);
  if (!body) return;
  body.style.overflow = "auto";
  body.innerHTML = `
<div class="manual-wrap">
  <style>
    .manual-wrap{padding:24px;color:var(--text);line-height:1.55;font-size:13px}
    .manual-wrap *{box-sizing:border-box}
    .manual-hero{padding:22px;border:1px solid var(--border);border-radius:18px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 22%,transparent),var(--surface));margin-bottom:16px}
    .manual-hero h1{margin:0 0 6px;font-size:28px;font-weight:700;letter-spacing:-.03em}
    .manual-hero p{margin:0;color:var(--text2);max-width:620px}
    .manual-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
    .manual-actions button{padding:9px 14px;border:1px solid var(--border);border-radius:12px;background:var(--bg2);color:var(--text);cursor:pointer;font-size:13px}
    .manual-actions button:hover{background:var(--surface-hover)}
    .manual-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:14px 0}
    .manual-card{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:16px}
    .manual-card h3{margin:0 0 8px;font-size:15px;display:flex;align-items:center;gap:8px}
    .manual-card p{margin:0 0 8px;color:var(--text2)}
    .manual-card ul,.manual-section ul{margin:8px 0 0;padding-left:18px;color:var(--text2)}
    .manual-card li,.manual-section li{margin:5px 0}
    .manual-section{border:1px solid var(--border);border-radius:16px;background:var(--bg2);padding:16px;margin-top:12px}
    .manual-section h2{margin:0 0 8px;font-size:18px}
    .manual-section strong{color:var(--text)}
    .manual-kbd{display:inline-block;padding:1px 6px;border-radius:6px;background:var(--bg3);border:1px solid var(--border);font-size:11px;color:var(--text)}
    .manual-note{margin-top:12px;padding:12px;border-radius:14px;background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 30%,var(--border));color:var(--text2)}
  </style>

  <div class="manual-hero">
    <h1>📖 Infinite OS User Manual</h1>
    <p>Infinite OS is a browser-based desktop where apps and widgets can be generated by AI, saved locally, and managed like a lightweight operating system.</p>
    <div class="manual-actions">
      <button onclick="openLauncher()">✦ Open Launcher</button>
      <button onclick="openSettings()">⚙️ Open Settings</button>
      <button onclick="showWelcome()">✦ Welcome</button>
      <button onclick="showAbout()">ℹ️ About</button>
    </div>
  </div>

  <div class="manual-grid">
    <div class="manual-card">
      <h3>🚀 Quick start</h3>
      <ul>
        <li>Click the <strong>✦</strong> launcher button or press <span class="manual-kbd">Ctrl</span>/<span class="manual-kbd">⌘</span> + <span class="manual-kbd">K</span>.</li>
        <li>Describe the app you want, then let Gemini generate it.</li>
        <li>Open generated apps from their desktop icons.</li>
      </ul>
    </div>
    <div class="manual-card">
      <h3>🪟 Windows</h3>
      <ul>
        <li>Drag a title bar to move a window.</li>
        <li>Use the window controls to minimize, maximize, or close.</li>
        <li>Use the taskbar to switch between open windows.</li>
      </ul>
    </div>
    <div class="manual-card">
      <h3>✨ Widgets</h3>
      <ul>
        <li>Right-click blank desktop space and choose <strong>Generate Widget</strong>.</li>
        <li>Describe a small desktop widget, like weather, notes, timer, or status card.</li>
        <li>Drag widgets around; use widget controls to regenerate or remove them.</li>
      </ul>
    </div>
  </div>

  <div class="manual-section">
    <h2>✦ AI app generation</h2>
    <ul>
      <li>The launcher creates full HTML/CSS/JS apps from natural language prompts.</li>
      <li>Generated apps are saved as desktop icons and restored on the next visit.</li>
      <li>Apps can use Infinite OS APIs for windows, notifications, clipboard, files, theme colors, and local storage.</li>
      <li>Be specific in prompts: include the workflow, buttons, inputs, data to save, and any visual style you want.</li>
    </ul>
  </div>

  <div class="manual-section">
    <h2>🖱️ Desktop right-click menu</h2>
    <ul>
      <li><strong>Launcher</strong>: create or open apps.</li>
      <li><strong>Generate Widget</strong>: create a movable AI desktop widget at the clicked position.</li>
      <li><strong>Show Desktop</strong>: minimize all open windows.</li>
      <li><strong>Refresh Desktop</strong>: reload icons, widgets, taskbar, and theme state.</li>
      <li><strong>Close Windows</strong>: close all currently open windows.</li>
      <li><strong>Settings</strong>, <strong>Welcome</strong>, <strong>User Manual</strong>, and <strong>About</strong>: open system tools.</li>
      <li>You can customize which menu entries appear and their order in <strong>Settings → Desktop Right-Click Menu</strong>.</li>
    </ul>
  </div>

  <div class="manual-section">
    <h2>⚙️ Settings</h2>
    <ul>
      <li><strong>Accent Color</strong>: pick a swatch, enter a custom hex color, or randomize it.</li>
      <li><strong>Wallpaper</strong>: set an image URL, preview it live, remove it, and tune blur/dim.</li>
      <li><strong>Theme</strong>: switch between dark and light mode.</li>
      <li><strong>Desktop Right-Click Menu</strong>: show, hide, reorder, or reset context-menu entries.</li>
      <li><strong>Reset Settings</strong>: restore preferences only.</li>
      <li><strong>Factory Reset</strong>: delete saved apps, widgets, files, settings, and generated data, then reload.</li>
    </ul>
  </div>

  <div class="manual-section">
    <h2>💾 Saving, data, and privacy</h2>
    <ul>
      <li>Infinite OS saves settings, generated apps, widgets, and app data in your browser storage.</li>
      <li>Factory Reset clears local save data for this OS.</li>
      <li>AI generation prompts are sent to the configured Gemini cloud backend so apps and widgets can be generated.</li>
      <li>If a generated app stores data, it should use the OS file/storage APIs or browser local storage.</li>
    </ul>
  </div>

  <div class="manual-section">
    <h2>⌨️ Keyboard shortcuts</h2>
    <ul>
      <li><span class="manual-kbd">Ctrl</span>/<span class="manual-kbd">⌘</span> + <span class="manual-kbd">K</span>: open the launcher.</li>
      <li><span class="manual-kbd">Esc</span>: close the launcher.</li>
    </ul>
  </div>

  <div class="manual-note">
    Tip: If the Welcome screen is hidden, open it manually from the desktop right-click menu or this manual, then uncheck <strong>Never show this again</strong>.
  </div>
</div>`;
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

function desktopMenuSettingsHTML(settingsWinId) {
  const enabledIds = getDesktopMenuItemIds();
  const actions = desktopMenuActions();
  const actionById = new Map(actions.map((item) => [item.id, item]));
  const visible = enabledIds.map((id) => actionById.get(id)).filter(Boolean);
  const hidden = actions.filter((item) => !enabledIds.includes(item.id));
  const preview = visible.length
    ? visible
        .map(
          (item) => `<span class="menu-preview-pill">
            <span class="menu-preview-icon">${htmlEscape(item.icon || "•")}</span>
            ${htmlEscape(item.title || item.label)}
          </span>`,
        )
        .join("")
    : `<span class="menu-preview-empty">No entries enabled. The desktop menu will show an empty state.</span>`;
  const row = (item, enabled, position) => {
    const title = item.title || item.label;
    const description = item.description || "Desktop context menu action.";
    const upDisabled = !enabled || position <= 0 ? "disabled" : "";
    const downDisabled =
      !enabled || position >= visible.length - 1 ? "disabled" : "";
    const shortcut = item.shortcut
      ? `<span class="menu-shortcut-chip">${htmlEscape(item.shortcut)}</span>`
      : "";
    const orderBadge = enabled
      ? `<span class="menu-order-badge" title="Menu position ${position + 1}">${position + 1}</span>`
      : `<span class="menu-order-badge muted">Hidden</span>`;

    return `<div class="menu-edit-row${enabled ? "" : " off"}">
      <div class="menu-edit-info">
        <span class="menu-edit-icon">${htmlEscape(item.icon || "•")}</span>
        <div class="menu-edit-main">
          <div class="menu-edit-title-row">
            <span class="menu-edit-title">${htmlEscape(title)}</span>
            ${shortcut}
          </div>
          <div class="menu-edit-desc">${htmlEscape(description)}</div>
        </div>
      </div>
      <div class="menu-edit-side">
        ${orderBadge}
        <div class="menu-edit-controls" aria-label="Reorder ${htmlEscape(title)}">
          <button ${upDisabled} onclick="moveDesktopMenuItem('${item.id}',-1,'${settingsWinId}')" title="Move up" aria-label="Move ${htmlEscape(title)} up">↑</button>
          <button ${downDisabled} onclick="moveDesktopMenuItem('${item.id}',1,'${settingsWinId}')" title="Move down" aria-label="Move ${htmlEscape(title)} down">↓</button>
        </div>
        <label class="menu-toggle" title="${enabled ? "Hide" : "Show"} ${htmlEscape(title)}">
          <input type="checkbox" ${enabled ? "checked" : ""} onchange="setDesktopMenuItemEnabled('${item.id}',this.checked,'${settingsWinId}')" aria-label="${enabled ? "Hide" : "Show"} ${htmlEscape(title)}">
          <span class="menu-toggle-ui"></span>
        </label>
      </div>
    </div>`;
  };

  return `<div class="menu-editor-head">
      <div>
        <strong>${enabledIds.length} visible ${enabledIds.length === 1 ? "entry" : "entries"}</strong>
        <span>Changes apply immediately to the desktop right-click menu.</span>
      </div>
      <button class="menu-reset-mini" onclick="resetDesktopMenuItems('${settingsWinId}')">Reset</button>
    </div>
    <div class="menu-preview-mini" aria-label="Current desktop menu preview">
      ${preview}
    </div>
    <div class="menu-editor-list">
      <div class="menu-group-title">Visible</div>
      ${visible.length ? visible.map((item, index) => row(item, true, index)).join("") : `<div class="menu-empty-card">No visible entries. Turn on any hidden action below.</div>`}
      ${hidden.length ? `<div class="menu-group-title">Hidden</div>${hidden.map((item) => row(item, false, -1)).join("")}` : ""}
    </div>`;
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
      <button class="btn-secondary" onclick="const c=os.randomColor();document.getElementById('set-hex-${id}').value=c;os.settings.set('accent',c)" style="padding:8px 14px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;background:var(--surface);color:var(--text)">🎲 Random</button>
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
    <h3>Desktop Right-Click Menu</h3>
    <p style="font-size:11px;color:var(--text2);line-height:1.5;margin:0 0 10px">Choose the commands shown when you right-click blank desktop space. Use the arrows to reorder visible entries.</p>
    <div class="menu-editor">
      ${desktopMenuSettingsHTML(id)}
    </div>
  </div>

  <div class="sec">
    <h3>System</h3>
    <p style="font-size:11px;color:var(--text2);line-height:1.5;margin:0 0 10px">Reset settings only, or wipe all saved Infinite OS data including generated apps, widgets, files, and preferences.</p>
    <div class="btn-row">
      <button class="btn-danger" onclick="resetSettingsOS('${id}')">Reset Settings</button>
      <button class="btn-danger" onclick="factoryResetOS()">Factory Reset</button>
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

// ─── Restart OS / Factory Reset ──────────────────────────────────────

async function resetSettingsOS(settingsWinId) {
  const ok = await showWidgetDialog({
    mode: "confirm",
    icon: "⚙️",
    title: "Reset Settings",
    message:
      "Reset preferences to defaults? Saved apps, widgets, and files will stay intact.",
    confirmText: "Reset Settings",
    danger: true,
  });
  if (!ok) return;
  os.settings.reset();
  cW(settingsWinId);
  openSettings();
}

async function factoryResetOS() {
  const ok = await showWidgetDialog({
    mode: "confirm",
    icon: "⚠️",
    title: "Factory Reset",
    message:
      "Delete all saved apps, widgets, files, settings, and generated data? This cannot be undone.",
    confirmText: "Delete Everything",
    danger: true,
  });
  if (!ok) return;

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  closeLauncher();
  document.querySelector(".widget-dialog-o")?.remove();
  const o = document.createElement("div");
  o.className = "ab-o";
  o.style.zIndex = "9999";
  o.onclick = null;
  o.innerHTML = `<div class="ab-b"><h1>🧨</h1><h2>Factory Resetting...</h2><p style="font-size:13px;color:var(--text2);margin-bottom:16px">All saved Infinite OS data has been deleted. Reloading now.</p><div style="width:100%;height:3px;background:#ffffff0d;border-radius:4px;overflow:hidden;margin:0 auto;max-width:200px"><div style="height:100%;width:100%;background:linear-gradient(90deg,#ef4444,#f87171,#ef4444);background-size:200% 100%;border-radius:4px;animation:barShimmer 0.8s linear infinite"></div></div></div>`;
  document.body.appendChild(o);
  setTimeout(() => location.reload(), 800);
}

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

window.addEventListener("resize", reclampDesktopWidgets);
window.addEventListener("message", (e) => {
  const data = e.data;
  if (!data || data.type !== "io-widget-size") return;
  applyWidgetFrameSize(data.id, data.w, data.h);
});

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
setTimeout(loadDesktopWidgets, 2300);
setTimeout(applySettings, 2400);

setTimeout(() => {
  dismissBoot();
  if (!_welcomed && !window.os.settings.get("hideWelcome", false)) {
    _welcomed = true;
    setTimeout(showWelcome, 300);
  }
  updTB();
}, 3500);
