const API_URL = "https://achadinhos-shoo-api.nitalo874.workers.dev";

const GROUP_LINK =
  "https://chat.whatsapp.com/LQGGHRSAtcTDQmoHF4S55n?s=cl&p=i&mlu=0&ilr=4";

const INVITE_TEXT = "Convide um amigo para participar";

let offers = JSON.parse(localStorage.getItem("ads_offers") || "[]");
let queue = JSON.parse(localStorage.getItem("ads_queue") || "[]");
let history = JSON.parse(localStorage.getItem("ads_history") || "[]");
let groups = JSON.parse(localStorage.getItem("ads_groups") || "[]");

let settings = JSON.parse(
  localStorage.getItem("ads_settings") || "{}"
);

let automationRunning = false;
let scheduleTimer = null;


const titles = {
  inicio: "Início",
  ofertas: "Ofertas",
  criar: "Criar divulgação",
  fila: "Fila de publicação",
  historico: "Histórico",
  grupos: "Grupos",
  config: "Configurações"
};


/* =========================
   NAVEGAÇÃO
========================= */

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(x => x.classList.remove("active"));

  const page = document.getElementById(id);

  if (page) {
    page.classList.add("active");
  }

  document
    .querySelectorAll(".nav")
    .forEach(x =>
      x.classList.toggle(
        "active",
        x.dataset.page === id
      )
    );

  const title = document.getElementById("pageTitle");

  if (title) {
    title.textContent = titles[id] || id;
  }

  render();

  const sidebar =
    document.querySelector(".sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}


document
  .querySelectorAll(".nav")
  .forEach(button => {

    button.onclick = () =>
      showPage(button.dataset.page);

  });


const menuBtn =
  document.getElementById("menuBtn");

if (menuBtn) {

  menuBtn.onclick = () => {

    document
      .querySelector(".sidebar")
      .classList.toggle("open");

  };

}


/* =========================
   SALVAR DADOS
========================= */

function save() {

  localStorage.setItem(
    "ads_offers",
    JSON.stringify(offers)
  );

  localStorage.setItem(
    "ads_queue",
    JSON.stringify(queue)
  );

  localStorage.setItem(
    "ads_history",
    JSON.stringify(history)
  );

  localStorage.setItem(
    "ads_groups",
    JSON.stringify(groups)
  );

}


/* =========================
   FORMATAÇÃO
========================= */

function formatBRL(v) {

  let n = Number(v);

  if (!Number.isFinite(n)) {
    return String(v || "");
  }

  if (n > 100000) {
    n = n / 100000;
  }

  return n.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


function esc(s) {

  return String(s ?? "")
    .replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m])
    );

}


function makeId(link) {

  return "shopee-" +
    btoa(
      unescape(
        encodeURIComponent(link)
      )
    )
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 32);

}


/* =========================
   TEXTOS DAS DIVULGAÇÕES
========================= */

function makePromo(o, index = 0) {

  const openings = [

    "🚨 OLHA O ACHADINHO QUE APARECEU!",

    "😱 ESSE PREÇO MERECE ATENÇÃO!",

    "🔥 CORRE DAR UMA OLHADA NESSE ACHADO!",

    "🛍️ ACHEI UMA OFERTA DAQUELAS!",

    "💥 PREÇO BAIXO ENCONTRADO NA SHOPEE!",

    "👀 OLHA O QUE EU ENCONTREI!",

    "✨ MAIS UM ACHADINHO PRA SALVAR!",

    "🤯 ESSE VALOR CHAMOU ATENÇÃO!"

  ];

  const open =
    openings[index % openings.length];

  const link =
    o.aff || o.link;

  return `${open}

🛒 ${o.name}
💰 ${o.price}

👉 COMPRE AQUI:
${link}

👥 ${INVITE_TEXT}
${GROUP_LINK}`;

}


/* =========================
   BUSCAR OFERTAS
========================= */

async function buscarOfertas(keyword) {

  const response =
    await fetch(
      `${API_URL}/buscar-ofertas?q=${encodeURIComponent(keyword)}`
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.erro || "Erro na Shopee"
    );

  }

  return (
    data.data?.productOfferV2?.nodes || []
  )
    .map(x => ({

      id:
        makeId(
          x.offerLink ||
          x.productLink ||
          x.productName
        ),

      name:
        x.productName ||
        "Produto da Shopee",

      price:
        x.priceMin != null
          ? formatBRL(x.priceMin)
          : formatBRL(x.price),

      old: "",

      link:
        x.productLink || "",

      aff:
        x.offerLink ||
        x.productLink ||
        "",

      image:
        x.imageUrl || "",

      category:
        "Shopee",

      sales:
        Number(x.sales || 0),

      commissionRate:
        x.commissionRate || "",

      shopName:
        x.shopName || "",

      date:
        new Date().toLocaleString("pt-BR"),

      source:
        "Shopee API"

    }))
    .filter(
      x =>
        x.link &&
        x.price
    );

}


/* =========================
   AUTOMAÇÃO
========================= */

async function iniciarAutomacao() {

  if (automationRunning) {
    return;
  }

  automationRunning = true;

  const btn =
    document.getElementById(
      "startAutomationBtn"
    );

  const status =
    document.getElementById(
      "automationStatus"
    );


  if (btn) {

    btn.disabled = true;

    btn.textContent =
      "⏳ AUTOMATIZANDO...";

  }


  if (status) {

    status.textContent =
      "🔎 Buscando ofertas na Shopee...";

  }


  const keywords = [

    "fone bluetooth",
    "air fryer",
    "casa cozinha",
    "moda feminina",
    "eletrônicos"

  ];


  let all = [];


  try {

    for (
      let i = 0;
      i < keywords.length;
      i++
    ) {

      if (status) {

        status.textContent =
          `🔎 Buscando ${i + 1}/${keywords.length}: ${keywords[i]}...`;

      }


      try {

        const result =
          await buscarOfertas(
            keywords[i]
          );

        all.push(...result);

      } catch (e) {

        console.log(
          "Erro nessa busca:",
          e
        );

      }

    }


    const known =
      new Set(
        offers.map(x => x.link)
      );


    const queued =
      new Set(
        queue.map(x => x.link)
      );


    const unique = [];

    const seen =
      new Set();


    for (const item of all) {

      if (
        !item.link ||
        seen.has(item.link) ||
        known.has(item.link) ||
        queued.has(item.link)
      ) {

        continue;

      }


      seen.add(item.link);

      unique.push(item);

    }


    unique.sort(
      (a, b) =>
        b.sales - a.sales
    );


    const selected =
      unique.slice(0, 15);


    selected.forEach(
      (o, i) => {

        o.promo =
          makePromo(
            o,
            offers.length + i
          );

        offers.unshift(o);

        queue.push(o);

      }
    );


    save();

    render();


    showPage("fila");


    if (status) {

      status.textContent =
        selected.length

          ? `✅ Concluído: ${selected.length} ofertas selecionadas e colocadas na fila.`

          : "ℹ️ Nenhuma oferta nova encontrada.";

    }


  } catch (e) {

    console.error(e);

    if (status) {

      status.textContent =
        "❌ Não foi possível concluir a automação.";

    }


    alert(
      "A automação não conseguiu concluir: " +
      e.message
    );

  } finally {

    automationRunning = false;


    if (btn) {

      btn.disabled = false;

      btn.textContent =
        "▶️ INICIAR AUTOMAÇÃO";

    }

    render();

  }

}


/* =========================
   PRÉVIA
========================= */

function makePreview(o) {

  const preview =
    document.getElementById(
      "preview"
    );

  if (!preview) {
    return;
  }


  preview.innerHTML =

    `<h3>Prévia da divulgação</h3>

     <div class="preview-box">

       ${esc(
         o.promo ||
         makePromo(o, 0)
       ).replace(
         /\n/g,
         "<br>"
       )}

     </div>`;


  showPage("criar");

}


function makePreviewById(id) {

  const o =
    offers.find(
      x => String(x.id) === String(id)
    ) ||

    queue.find(
      x => String(x.id) === String(id)
    );


  if (o) {
    makePreview(o);
  }

}


/* =========================
   SALVAR OFERTA MANUAL
========================= */

function saveOffer() {

  const name =
    document
      .getElementById("productName")
      .value
      .trim() ||
    "Produto da Shopee";


  const price =
    document
      .getElementById("price")
      .value
      .trim();


  const old =
    document
      .getElementById("oldPrice")
      .value
      .trim();


  const link =
    document
      .getElementById("productLink")
      .value
      .trim();


  const aff =
    document
      .getElementById("affiliateLink")
      .value
      .trim();


  if (!price || !link) {

    alert(
      "Preencha o preço e o link do produto."
    );

    return;

  }


  if (
    !/^https?:\/\//i.test(link)
  ) {

    alert(
      "Informe um link válido do produto."
    );

    return;

  }


  const o = {

    id: Date.now(),

    name,

    price,

    old,

    link,

    aff,

    category:
      document
        .getElementById("category")
        .value,

    date:
      new Date()
        .toLocaleString("pt-BR")

  };


  o.promo =
    makePromo(
      o,
      offers.length
    );


  offers.unshift(o);

  queue.push(o);


  save();

  makePreview(o);

  render();

}


/* =========================
   GRUPOS
========================= */

function addGroup() {

  const input =
    document.getElementById(
      "groupName"
    );


  const n =
    input.value.trim();


  if (!n) {
    return;
  }


  groups.push(n);

  input.value = "";


  save();

  render();

}


/* =========================
   CONFIGURAÇÕES
========================= */

function salvarConfiguracoes() {

  const startTime =
    document.getElementById(
      "startTime"
    )?.value || "08:00";


  const endTime =
    document.getElementById(
      "endTime"
    )?.value || "22:00";


  const interval =
    Number(
      document.getElementById(
        "publishInterval"
      )?.value || 30
    );


  const autoPublish =
    document.getElementById(
      "autoPublish"
    )?.value || "off";


  const days = {

    0:
      document.getElementById(
        "daySunday"
      )?.checked || false,

    1:
      document.getElementById(
        "dayMonday"
      )?.checked || false,

    2:
      document.getElementById(
        "dayTuesday"
      )?.checked || false,

    3:
      document.getElementById(
        "dayWednesday"
      )?.checked || false,

    4:
      document.getElementById(
        "dayThursday"
      )?.checked || false,

    5:
      document.getElementById(
        "dayFriday"
      )?.checked || false,

    6:
      document.getElementById(
        "daySaturday"
      )?.checked || false

  };


  settings = {

    systemName:
      document.getElementById(
        "systemName"
      )?.value ||
      "Achadinhos da Shoo",

    groupLink:
      document.getElementById(
        "groupLink"
      )?.value ||
      GROUP_LINK,

    inviteText:
      document.getElementById(
        "inviteText"
      )?.value ||
      INVITE_TEXT,

    startTime,

    endTime,

    interval,

    days,

    autoPublish

  };


  localStorage.setItem(
    "ads_settings",
    JSON.stringify(settings)
  );


  atualizarStatusHorario();


  alert(
    "✅ Configurações salvas com sucesso!"
  );


  iniciarControleHorario();

}


/* =========================
   CARREGAR CONFIGURAÇÕES
========================= */

function carregarConfiguracoes() {

  if (!settings) {
    settings = {};
  }


  const start =
    document.getElementById(
      "startTime"
    );

  const end =
    document.getElementById(
      "endTime"
    );

  const interval =
    document.getElementById(
      "publishInterval"
    );

  const auto =
    document.getElementById(
      "autoPublish"
    );


  if (start) {
    start.value =
      settings.startTime ||
      "08:00";
  }


  if (end) {
    end.value =
      settings.endTime ||
      "22:00";
  }


  if (interval) {
    interval.value =
      settings.interval ||
      30;
  }


  if (auto) {
    auto.value =
      settings.autoPublish ||
      "off";
  }


  const days =
    settings.days || {};


  const ids = [

    "daySunday",
    "dayMonday",
    "dayTuesday",
    "dayWednesday",
    "dayThursday",
    "dayFriday",
    "daySaturday"

  ];


  ids.forEach(
    (id, index) => {

      const el =
        document.getElementById(id);

      if (!el) {
        return;
      }


      if (
        Object.prototype.hasOwnProperty.call(
          days,
          index
        )
      ) {

        el.checked =
          days[index];

      } else {

        el.checked = true;

      }

    }
  );


  atualizarStatusHorario();

}


/* =========================
   VERIFICAR HORÁRIO
========================= */

function dentroDoHorario() {

  if (!settings) {
    return false;
  }


  const agora =
    new Date();


  const dia =
    agora.getDay();


  if (
    settings.days &&
    settings.days[dia] === false
  ) {

    return false;

  }


  const horaAtual =
    agora.getHours() * 60 +
    agora.getMinutes();


  const [hInicio, mInicio] =
    (settings.startTime || "08:00")
      .split(":")
      .map(Number);


  const [hFim, mFim] =
    (settings.endTime || "22:00")
      .split(":")
      .map(Number);


  const inicio =
    hInicio * 60 + mInicio;


  const fim =
    hFim * 60 + mFim;


  return (
    horaAtual >= inicio &&
    horaAtual <= fim
  );

}


/* =========================
   STATUS DOS HORÁRIOS
========================= */

function atualizarStatusHorario() {

  const status =
    document.getElementById(
      "scheduleStatus"
    );


  if (!status) {
    return;
  }


  if (!settings.startTime) {

    status.textContent =
      "⚪ Horários ainda não configurados.";

    return;

  }


  if (
    settings.autoPublish === "on"
  ) {

    if (dentroDoHorario()) {

      status.textContent =
        `🟢 Sistema ativo. Funcionando das ${settings.startTime} às ${settings.endTime}.`;

    } else {

      status.textContent =
        `🌙 Fora do horário. Funcionamento das ${settings.startTime} às ${settings.endTime}.`;

    }

  } else {

    status.textContent =
      `⚙️ Horário configurado: ${settings.startTime} às ${settings.endTime}. Publicação automática desativada.`;

  }

}


/* =========================
   CONTROLE AUTOMÁTICO
========================= */

function iniciarControleHorario() {

  if (scheduleTimer) {

    clearInterval(
      scheduleTimer
    );

  }


  if (
    !settings ||
    settings.autoPublish !== "on"
  ) {

    atualizarStatusHorario();

    return;

  }


  const intervaloMs =
    Math.max(
      1,
      Number(
        settings.interval || 30
      )
    ) *
    60 *
    1000;


  scheduleTimer =
    setInterval(
      () => {

        atualizarStatusHorario();


        if (
          dentroDoHorario() &&
          !automationRunning
        ) {

          iniciarAutomacao();

        }

      },
      intervaloMs
    );


  atualizarStatusHorario();

}


/* =========================
   RENDER
========================= */

function render() {

  const countOffers =
    document.getElementById(
      "countOffers"
    );

  const countQueue =
    document.getElementById(
      "countQueue"
    );

  const countLinks =
    document.getElementById(
      "countLinks"
    );

  const countPublished =
    document.getElementById(
      "countPublished"
    );


  if (countOffers) {
    countOffers.textContent =
      offers.length;
  }


  if (countQueue) {
    countQueue.textContent =
      queue.length;
  }


  if (countLinks) {

    countLinks.textContent =
      offers.filter(
        x => x.link
      ).length;

  }


  if (countPublished) {

    countPublished.textContent =
      history.length;

  }


  /* OFERTAS */

  const list =
    document.getElementById(
      "offersList"
    );


  if (list) {

    list.innerHTML =
      offers.length

        ? offers.map(
            o => `

      <div class="offer-card">

        <div class="offer-image">

          ${
            o.image

            ? `<img
                src="${esc(o.image)}"
                alt="${esc(o.name)}"
                loading="lazy"
                onerror="
                  this.style.display='none';
                  this.parentElement.classList.add('image-error')
                "
              >`

            : `<div class="image-placeholder">
                🛍️
              </div>`
          }

        </div>


        <div class="offer-content">

          <span class="tag">
            ${esc(
              o.category ||
              "Achadinhos"
            )}
          </span>


          <h3>
            ${esc(o.name)}
          </h3>


          <div class="price">
            ${esc(o.price)}
          </div>


          <p class="muted">

            ${
              o.sales
                ? `🔥 ${o.sales} vendidos`
                : "🔗 Link disponível"
            }

          </p>


          <div class="offer-actions">

            <button
              class="gold"
              onclick="window.open('${esc(
                o.aff || o.link
              )}','_blank')">

              🛒 Ver oferta

            </button>


            <button
              class="primary"
              onclick="makePreviewById('${esc(
                o.id
              )}')">

              ✍️ Divulgação

            </button>

          </div>

        </div>

      </div>

    `
          ).join("")

        : `<div class="empty">
             Nenhuma oferta cadastrada.
           </div>`;

  }


  /* RECENTES */

  const recent =
    document.getElementById(
      "recentOffers"
    );


  if (recent) {

    recent.innerHTML =

      offers.slice(0, 5).map(
        o => `

        <div class="queue-item">

          <b>
            ${esc(o.name)}
          </b>

          <br>

          <span class="muted">
            ${esc(o.price)}
            •
            ${esc(o.date)}
          </span>

        </div>

      `
      ).join("")

      ||

      `<div class="empty">
        Nenhuma oferta cadastrada ainda.
      </div>`;

  }


  /* FILA */

  const queueList =
    document.getElementById(
      "queueList"
    );


  if (queueList) {

    queueList.innerHTML =

      queue.map(
        o => `

        <div class="queue-item">

          <b>
            ${esc(o.name)}
          </b>

          <br>

          <span class="muted">
            ${esc(o.price)}
            • aguardando publicação
          </span>


          <div class="promo-mini">

            ${esc(
              o.promo ||
              makePromo(o, 0)
            ).replace(
              /\n/g,
              "<br>"
            )}

          </div>

        </div>

      `
      ).join("")

      ||

      `<div class="empty">
        Nenhuma oferta na fila.
      </div>`;

  }


  /* HISTÓRICO */

  const historyList =
    document.getElementById(
      "historyList"
    );


  if (historyList) {

    historyList.innerHTML =

      history.map(
        o => `

        <div class="history-item">

          <b>
            ${esc(o.name)}
          </b>

          <br>

          <span class="muted">
            ${esc(o.date)}
          </span>

        </div>

      `
      ).join("")

      ||

      `<div class="empty">
        Nenhuma publicação registrada.
      </div>`;

  }


  /* GRUPOS */

  const groupsList =
    document.getElementById(
      "groupsList"
    );


  if (groupsList) {

    groupsList.innerHTML =

      groups.map(
        g => `

        <div class="group">

          <span>
            👥 ${esc(g)}
          </span>

          <span>✓</span>

        </div>

      `
      ).join("");

  }

}


/* =========================
   INICIALIZAÇÃO
========================= */

carregarConfiguracoes();

render();

iniciarControleHorario();
