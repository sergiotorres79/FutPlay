const $ = (s) => document.querySelector(s);
let allMatches = [];
let teams = [];
let selected = null;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMatches(matches) {
  const list = $("#matchesList");
  list.innerHTML = "";
  $("#countBadge").textContent = String(matches.length);
  if (!matches.length) {
    list.innerHTML = `<div class="footerNote">No hay partidos para el filtro.</div>`;
    return;
  }
  matches.forEach(m => {
    const isSelected = selected && selected.id === m.id;
    const matchEl = document.createElement("div");
    matchEl.className = "match";
    if (isSelected) {
      matchEl.style.borderColor = "rgba(0,212,255,0.55)";
      matchEl.style.background = "rgba(0,212,255,0.06)";
    }
    const date = new Date(m.date + "T00:00:00");
    const dateText = date.toLocaleDateString("es-ES", { year:"numeric", month:"short", day:"2-digit" });
    matchEl.innerHTML = `
      <div class="matchTop">
        <div>
          <div class="date">${escapeHtml(dateText)} · ${escapeHtml(m.status || "")}</div>
          <div class="teams">
            ${escapeHtml(m.homeTeam)} <span style="color:var(--muted)">vs</span> ${escapeHtml(m.awayTeam)}
          </div>
        </div>
        <div class="score">
          <div class="scoreLine">
            <span style="color:var(--text)">${m.score.home}</span>
            <span style="color:var(--muted); font-weight:800">-</span>
            <span style="color:var(--text)">${m.score.away}</span>
          </div>
          <div class="scoreSmall">Marcador</div>
        </div>
      </div>
    `;
    matchEl.addEventListener("click", () => {
      selected = m;
      renderMatches(currentFiltered());
      renderDetail(m);
    });
    list.appendChild(matchEl);
  });
}

function statBox(title, homeVal, awayVal, homePercent = null, formatFn = (x)=>x) {
  let barHtml = "";
  if (homePercent !== null) {
    const homeW = Math.max(0, Math.min(100, homePercent));
    barHtml = `
      <div class="bar">
        <span style="width:${homeW}%"></span>
      </div>
    `;
  }
  return `
    <div class="stat">
      <div class="k">${escapeHtml(title)}</div>
      <div class="v">
        ${escapeHtml(String(homeVal))} - ${escapeHtml(String(awayVal))}
      </div>
      ${barHtml}
    </div>
  `;
}

function renderDetail(m) {
  const panel = $("#detailPanel");
  const home = m.homeTeam;
  const away = m.awayTeam;
  $("#statusBadge").textContent = m.status || "—";
  const date = new Date(m.date + "T00:00:00");
  const dateText = date.toLocaleDateString("es-ES", { year:"numeric", month:"long", day:"2-digit" });
  const st = m.stats || {};
  let possessionPercent = null;
  if (st.possession && typeof st.possession.home === "number" && typeof st.possession.away === "number") {
    const total = st.possession.home + st.possession.away;
    possessionPercent = total ? (st.possession.home / total) * 100 : null;
  }
  panel.innerHTML = `
    <h3>${escapeHtml(home)} <span style="color:var(--muted)">vs</span> ${escapeHtml(away)}</h3>
    <div class="footerNote">${escapeHtml(dateText)} · ${escapeHtml(m.status || "")}</div>
    <div style="height:10px"></div>
    <div class="statGrid">
      ${st.possession
        ? statBox("Posesión (%)", st.possession.home, st.possession.away, possessionPercent, (x)=>x)
        : statBox("Posesión", "—", "—")}
      ${st.shots
        ? statBox("Tiros", st.shots.home, st.shots.away)
        : statBox("Tiros", "—", "—")}
      ${st.shotsOnTarget
        ? statBox("Tiros a puerta", st.shotsOnTarget.home, st.shotsOnTarget.away)
        : statBox("Tiros a puerta", "—", "—")}
      ${st.corners
        ? statBox("Corners", st.corners.home, st.corners.away)
        : statBox("Corners", "—", "—")}
    </div>
    <div class="eventList">
      <div class="footerNote" style="margin:0 0 6px;">
        Eventos (goles, etc.)
      </div>
      ${(m.events && m.events.length)
        ? m.events.map(ev => `
            <div class="event">
              <div class="eventTop">
                <div class="type">${escapeHtml(ev.type || "Event")}</div>
                <div class="time">${escapeHtml(String(ev.minute || ""))}'</div>
              </div>
              <div style="margin-top:6px; color:var(--text); font-weight:900;">
                ${escapeHtml(ev.team || "")}
              </div>
            </div>
          `).join("")
        : `<div class="footerNote">Sin eventos para este partido.</div>`}
    </div>
  `;
}

function currentFiltered() {
  const team = $("#teamFilter").value;
  const q = ($("#search").value || "").trim().toLowerCase();
  return allMatches
    .filter(m => {
      if (team === "Todos") return true;
      return m.homeTeam === team || m.awayTeam === team;
    })
    .filter(m => {
      if (!q) return true;
      const s = `${m.homeTeam} ${m.awayTeam} ${m.status || ""}`.toLowerCase();
      return s.includes(q);
    })
    .sort((a,b) => (b.date > a.date ? 1 : -1));
}

async function init() {
  const data = await fetch("/api/matches").then(r => r.json());
  allMatches = data.matches || [];
  teams = data.teams || [];
  $("#leagueSubtitle").textContent = data.leagueName || "—";
  const sel = $("#teamFilter");
  sel.innerHTML = "";
  const optTodos = document.createElement("option");
  optTodos.value = "Todos";
  optTodos.textContent = "Todos";
  sel.appendChild(optTodos);
  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    selected = null;
    renderMatches(currentFiltered());
    $("#detailPanel").innerHTML = `<h3>Selecciona un partido</h3><div class="footerNote">Aquí verás estadísticas y eventos.</div>`;
    $("#statusBadge").textContent = "—";
  });
  $("#search").addEventListener("input", () => {
    selected = null;
    renderMatches(currentFiltered());
    $("#detailPanel").innerHTML = `<h3>Selecciona un partido</h3><div class="footerNote">Aquí verás estadísticas y eventos.</div>`;
    $("#statusBadge").textContent = "—";
  });
  renderMatches(currentFiltered());
}

init();