const U = document.querySelector("#uyg");
const $ = s => document.querySelector(s);
const MODLAR = {
  a: { ad: "İngilizce → okunuş ve anlam", al: [["okunus", "Okunuşu"], ["tr", "Türkçe anlamı"]] },
  b: { ad: "Türkçe → İngilizce ve okunuş", al: [["en", "İngilizcesi"], ["okunus", "Okunuşu"]] },
  c: { ad: "Dinle → yazılış ve anlam", al: [["en", "Yazılışı"], ["tr", "Türkçe anlamı"]] },
  d: { ad: "Kartlar", al: [] }
};
let K = [], M = "a", S = null, son = null, R = {}, asama = 0, IST = {};
try { IST = JSON.parse(localStorage.getItem("le-ist") || "{}"); } catch (e) {}
const kaydet = () => { try { localStorage.setItem("le-ist", JSON.stringify(IST)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Büyük/küçük harf, Türkçe karakter ve fazla boşluk farkını yok sayar
const norm = s => s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
  .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function dist(a, b) {
  const d = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    let p = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = t;
    }
  }
  return d[b.length];
}

// 2 = doğru, 1 = neredeyse doğru (1 harf hata), 0 = yanlış
function puan(girdi, dogrular, bol) {
  if (!norm(girdi)) return 0;
  const parcalar = (bol ? girdi.split(/[;,\/]/) : [girdi]).map(norm).filter(Boolean);
  let en = 0;
  for (const p of parcalar) for (const d of dogrular.map(norm)) {
    if (p === d) return 2;
    if (p.length >= 4 && dist(p, d) <= 1) en = 1;
  }
  return en;
}

// Türkçe → İngilizce modunda aynı anlama gelen tüm kelimeler doğru sayılır (boş: empty / free)
const esler = k => M === "b" ? K.filter(x => x.tr.some(t => k.tr.map(norm).includes(norm(t)))) : [k];
const dogrular = (alan, k) => alan === "tr" ? k.tr : esler(k).map(x => x[alan]);

function sec() {
  const w = K.map(k => k === son ? 0 : Math.max(1, 3 + 2 * (IST[k.id]?.y || 0) - (IST[k.id]?.d || 0)));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < K.length; i++) { r -= w[i]; if (r < 0) return K[i]; }
  return K[0];
}

function cal(k) {
  const el = $("#kaynak"), ek = ["webm", "mp4", "mp3"];
  let i = 0;
  const dene = () => {
    if (i >= ek.length) return robot(k, el);
    new Audio(`audio/${k.id}.${ek[i++]}`).play()
      .then(() => { if (el) el.textContent = "Hocanın kaydı"; })
      .catch(er => er.name === "NotAllowedError" ? robot(k, el) : dene());
  };
  dene();
}
function robot(k, el) {
  if (!("speechSynthesis" in window)) { if (el) el.textContent = "Bu cihazda sesli okuma yok."; return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(k.en);
  u.lang = "en-US";
  speechSynthesis.speak(u);
  if (el) el.textContent = "Bilgisayar sesi";
}

function ana() {
  U.innerHTML = `<h1>İngilizce öğreniyorum</h1><p class="alt">${K.length} sıfat. Yanlış yaptıkların daha sık sorulur.</p>` +
    Object.entries(MODLAR).map(([m, v]) => `<button data-m="${m}">${v.ad}</button>`).join("") +
    `<div class="yedek"><button class="kucuk" id="ind">Yedeği indir</button><label class="kucuk">Yedeği yükle<input type="file" id="yuk" accept=".json" hidden></label></div>`;
}

function soru() {
  S = sec(); asama = 0; R = {};
  const baslik = M === "a" ? esc(S.en) : M === "b" ? esc(S.tr.join(" / ")) : "Dinle ve yaz";
  U.innerHTML = `<button class="geri" id="geri">Ana ekran</button><div class="kelime">${baslik}</div>
    <div><button class="kucuk" id="dinle">Dinle</button> <span id="kaynak" class="alt"></span></div>
    ${MODLAR[M].al.map(([a, e]) => `<label>${e}<input data-a="${a}" autocomplete="off" autocapitalize="none" spellcheck="false"></label>`).join("")}
    <div id="sonuc"></div><button class="ana" id="tamam">Kontrol et</button>`;
  if (M === "c") cal(S);
  else if (M === "a") $("input").focus();
  if (M !== "a") $("input").focus();
}

function goster() {
  $("#sonuc").innerHTML = MODLAR[M].al.map(([a, e]) => {
    const p = R[a], d = dogrular(a, S).join(" / ");
    return `<div class="s s${p}"><b>${e}:</b> ${["Yanlış", "Neredeyse doğru", "Doğru"][p]}` +
      (p < 2 ? `<span>Doğrusu: ${esc(d)}</span>` : "") +
      (a === "okunus" && p < 2 ? `<button class="kucuk" data-say="${a}">Doğru yazdım</button>` : "") + `</div>`;
  }).join("");
}

function ilerle() {
  if (asama === 0) {
    document.querySelectorAll("input").forEach(i => { R[i.dataset.a] = puan(i.value, dogrular(i.dataset.a, S), i.dataset.a === "tr"); i.disabled = true; });
    goster(); asama = 1; $("#tamam").textContent = "Sonraki";
  } else {
    const ok = Object.values(R).every(p => p > 0), s = IST[S.id] = IST[S.id] || { d: 0, y: 0 };
    ok ? s.d++ : s.y++;
    kaydet(); son = S; soru();
  }
}

function kart() {
  S = sec(); son = S;
  U.innerHTML = `<button class="geri" id="geri">Ana ekran</button><div class="kart" id="kart"><div class="kelime">${esc(S.en)}</div><p class="alt">Cevap için dokun</p></div>
    <div><button class="kucuk" id="dinle">Dinle</button> <span id="kaynak" class="alt"></span></div><button class="ana" id="sonraki">Sonraki kart</button>`;
}

U.onclick = e => {
  if (e.target.closest("#kart")) { $("#kart").innerHTML = `<div class="kelime">${esc(S.en)}</div><p>${esc(S.okunus)}</p><p>${esc(S.tr.join(" / "))}</p>`; return; }
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.m) { M = t.dataset.m; son = null; M === "d" ? kart() : soru(); }
  else if (t.id === "geri") ana();
  else if (t.id === "dinle") cal(S);
  else if (t.id === "tamam") ilerle();
  else if (t.id === "sonraki") kart();
  else if (t.dataset.say) { R[t.dataset.say] = 2; goster(); }
  else if (t.id === "ind") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(IST)], { type: "application/json" }));
    a.download = "ingilizce-yedek.json"; a.click();
  }
};
U.onkeydown = e => { if (e.key === "Enter" && $("#tamam")) ilerle(); };
U.onchange = e => {
  if (e.target.id !== "yuk") return;
  e.target.files[0].text().then(t => { IST = JSON.parse(t); kaydet(); ana(); }).catch(() => alert("Yedek dosyası okunamadı."));
};

fetch("data/adjectives.json").then(r => { if (!r.ok) throw 0; return r.json(); }).then(v => { K = v; ana(); })
  .catch(() => { U.innerHTML = "<p>Kelime listesi yüklenemedi. Sayfayı GitHub adresinden aç ve data/adjectives.json dosyasının yüklü olduğunu kontrol et.</p>"; });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
