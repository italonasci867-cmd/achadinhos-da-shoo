const API_URL = "https://achadinhos-shoo-api.nitalo874.workers.dev";

const GROUP_LINK =
  "https://chat.whatsapp.com/LQGGHRSAtcTDQmoHF4S55n?s=cl&p=i&mlu=0&ilr=4";

const INVITE_TEXT = "Convide um amigo para participar";

let offers = JSON.parse(localStorage.getItem("ads_offers") || "[]");
let queue = JSON.parse(localStorage.getItem("ads_queue") || "[]");
let history = JSON.parse(localStorage.getItem("ads_history") || "[]");
let groups = JSON.parse(localStorage.getItem("ads_groups") || "[]");
let usedPromos = JSON.parse(
  localStorage.getItem("ads_used_promos") || "[]"
);

let settings = JSON.parse(
  localStorage.getItem("ads_settings") || "{}"
);

let automationRunning = false;
let queueTimer = null;


/* =========================
   NAVEGAÇÃO
========================= */

const titles = {
  inicio: "Início",
  ofertas: "Ofertas",
  criar: "Criar divulgação",
  fila: "Fila de publicação",
  historico: "Histórico",
  grupos: "Grupos",
  config: "Configurações"
};

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

  const title =
    document.getElementById("pageTitle");

  if (title) {
    title.textContent =
      titles[id] || id;
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
   SALVAR
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

  localStorage.setItem(
    "ads_used_promos",
    JSON.stringify(usedPromos)
  );

}


/* =========================
   UTILIDADES
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
   GERADOR DE TEXTOS
========================= */

const promoOpenings = [

  "🚨 OLHA O ACHADINHO QUE ACABOU DE APARECER!",

  "😱 VOCÊ PRECISA VER ESSE PREÇO!",

  "🔥 MAIS UM ACHADO BOM DEMAIS!",

  "🛍️ ACHEI ESSA OFERTA E VIM COMPARTILHAR!",

  "👀 PARA TUDO E OLHA ESSE ACHADO!",

  "💥 ESSA OFERTA CHAMOU MUITO A ATENÇÃO!",

  "🤯 OLHA O PREÇO DESSE PRODUTO!",

  "✨ ACHADINHO DO DIA ENCONTRADO!",

  "🚨 ATENÇÃO PARA ESSA OFERTA!",

  "😍 ESSE AQUI VALE A PENA CONFERIR!",

  "💸 PREÇO BAIXO ENCONTRADO NA SHOPEE!",

  "🛒 MAIS UMA OFERTA PRA COLOCAR NA LISTA!",

  "🔥 QUEM ESTAVA PROCURANDO ISSO VAI GOSTAR!",

  "😳 OLHA O QUE EU ACABEI DE ENCONTRAR!",

  "🎯 ACHADO INTERESSANTE ENCONTRADO!",

  "⚡ ESSA OFERTA MERECE UM OLHAR!",

  "🤑 PREÇO QUE CHAMOU ATENÇÃO!",

  "💎 MAIS UM ACHADINHO SELECIONADO!",

  "📢 ENCONTREI UMA OFERTA BEM INTERESSANTE!",

  "🙌 OLHA ESSA OPORTUNIDADE!"
];


const promoMiddle = [

  "Se estava procurando algo assim, vale conferir 👀",

  "Dá uma olhada antes que o preço mude 🔥",

  "Pode ser uma boa oportunidade para aproveitar 🛒",

  "Olha todos os detalhes antes de comprar 👇",

  "Essa apareceu entre os achados de hoje 😍",

  "Vale conferir o preço diretamente na Shopee 💰",

  "Mais uma opção interessante para colocar na lista ✨",

  "Se gostou, confira a oferta pelo link abaixo 👇",

  "Essa chamou atenção pelo valor encontrado 🤯",

  "Confira enquanto a oferta estiver disponível ⚡",

  "Pode ser aquele achado que você estava procurando 👀",

  "Dá uma conferida nessa oportunidade 🛍️",

  "Mais um produto selecionado para vocês 🔥",

  "Vale a pena conferir as condições da oferta 💸",

  "O preço encontrado foi esse, mas pode mudar a qualquer momento ⏰"
];


const promoClosings = [

  "👇 Clique e confira",

  "🛒 Veja a oferta",

  "👉 Confira aqui",

  "🔥 Aproveite enquanto estiver disponível",

  "👀 Dá uma olhada",

  "💰 Confira o preço",

  "➡️ Acesse a oferta",

  "🛍️ Veja todos os detalhes",

  "⚡ Confira agora",

  "👇 Link da oferta"
];


function hashNumber(text) {

  let hash = 0;

  for (let i = 0; i < text.length; i++) {

    hash =
      ((hash << 5) - hash) +
      text.charCodeAt(i);

    hash |= 0;
  }

  return Math.abs(hash);

}


function makeUniquePromo(o, index = 0) {

  const seed =
    `${o.name}|${o.price}|${o.link}|${index}`;

  const base =
    hashNumber(seed);


  /*
    Criamos muitas combinações:

    20 aberturas
    15 frases intermediárias
    10 fechamentos

    = até 3.000 combinações.
  */

  let openingIndex =
    base % promoOpenings.length;

  let middleIndex =
    Math.floor(base / 7) %
    promoMiddle.length;

  let closingIndex =
    Math.floor(base / 13) %
    promoClosings.length;


  let promo = "";


  for (let tentativa = 0; tentativa < 300; tentativa++) {

    const oi =
      (openingIndex + tentativa) %
      promoOpenings.length;

    const mi =
      (middleIndex + tentativa * 3) %
      promoMiddle.length;

    const ci =
      (closingIndex + tentativa * 5) %
      promoClosings.length;


    promo = `${promoOpenings[oi]}

🛒 ${o.name}
💰 ${o.price}

${promoMiddle[mi]}

${promoClosings[ci]}:
${o.aff || o.link}

👥 ${INVITE_TEXT}
${GROUP_LINK}`;


    if (!usedPromos.includes(promo)) {
      break;
    }

  }


  usedPromos.push(promo);

  /*
    Mantém o histórico de textos sem
    deixar o localStorage crescer demais.
  */

  if (usedPromos.length > 3000) {
    usedPromos =
      usedPromos.slice(-2500);
  }


  return promo;
}


/* =========================
   PALAVRAS DE BUSCA
========================= */

const keywords = [

  "fone bluetooth",
  "fone sem fio",
  "caixa de som",
  "smartwatch",
  "relógio inteligente",
  "celular",
  "carregador",
  "cabo usb",
  "power bank",
  "suporte celular",

  "air fryer",
  "liquidificador",
  "batedeira",
  "cafeteira",
  "panela",
  "jogo de panelas",
  "utensílios cozinha",
  "organizador cozinha",
  "potes cozinha",
  "casa decoração",

  "mesa",
  "cadeira",
  "sofá",
  "armário",
  "prateleira",
  "organizador",
  "tapete",
  "cortina",
  "luminária",
  "decoração",

  "calça feminina",
  "vestido feminino",
  "blusa feminina",
  "conjunto feminino",
  "tênis feminino",
  "bolsa feminina",
  "moda feminina",

  "camiseta masculina",
  "calça masculina",
  "tênis masculino",
  "boné masculino",
  "moda masculina",

  "maquiagem",
  "skincare",
  "perfume",
  "cabelo",
  "beleza",

  "brinquedo",
  "material escolar",
  "infantil",
  "bebê",

  "acessórios carro",
  "automotivo",
  "organizador carro",

  "mouse",
  "teclado",
  "headset gamer",
  "mousepad",
  "notebook",
  "informática",

  "ferramentas",
  "furadeira",
  "casa",
  "jardim",

  "academia",
  "esporte",
  "fitness",

  "pet",
  "cachorro",
  "gato"

];


/* =========================
   BUSCAR SHOPEE
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
      data.erro ||
      "Erro na Shopee"
    );

  }


  return (
    data.data?.productOfferV2?.nodes ||
    []
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
        x.productLink ||
        "",

      aff:
        x.offerLink ||
        x.productLink ||
        "",

      image:
        x.imageUrl ||
        "",

      category:
        "Shopee",

      sales:
        Number(
          x.sales ||
          x.soldCount ||
          0
        ),

      commissionRate:
        x.commissionRate ||
        "",

      shopName:
        x.shopName ||
        "",

      date:
        new Date()
          .toLocaleString("pt-BR"),

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
      "⏳ BUSCANDO OFERTAS...";

  }


  let all = [];


  try {

    /*
      Fazemos várias buscas para aumentar
      a variedade de produtos.
    */

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
          "Falha na busca:",
          keywords[i],
          e
        );

      }


      /*
        Pequena pausa para não disparar
        todas as requisições ao mesmo tempo.
      */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            150
          )
      );

    }


    /*
      Links já existentes.
    */

    const knownLinks =
      new Set(
        offers.map(
          x => x.link
        )
      );


    const queueLinks =
      new Set(
        queue.map(
          x => x.link
        )
      );


    const unique = [];

    const seen =
      new Set();


    for (const item of all) {

      if (!item.link) {
        continue;
      }


      if (
        seen.has(item.link) ||
        knownLinks.has(item.link) ||
        queueLinks.has(item.link)
      ) {

        continue;

      }


      seen.add(item.link);

      unique.push(item);

    }


    /*
      Primeiro os produtos com mais vendas.
    */

    unique.sort(
      (a, b) =>
        b.sales - a.sales
    );


    /*
      Seleciona até 30 novos produtos.
    */

    const selected =
      unique.slice(0, 30);


    selected.forEach(
      (o, i) => {

        o.promo =
          makeUniquePromo(
            o,
            offers.length + i
          );


        offers.unshift(o);

        queue.push(o);

      }
    );


    save();

    render();


    if (status) {

      status.textContent =
        selected.length

          ? `✅ ${selected.length} novas ofertas encontradas, com divulgações diferentes, e adicionadas à fila.`

          : "ℹ️ Nenhuma oferta nova encontrada.";

    }


    showPage("fila");


  } catch (e) {

    console.error(e);


    if (status) {

      status.textContent =
        "❌ Não foi possível concluir a busca.";

    }


    alert(
      "A automação encontrou um erro: " +
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
   HORÁRIOS
========================= */

function dentroDoHorario() {

  const s =
    settings || {};


  const agora =
    new Date();


  const dia =
    agora.getDay();


  if (
    s.days &&
    s.days[dia] === false
  ) {

    return false;

  }


  const atual =
    agora.getHours() * 60 +
    agora.getMinutes();


  const inicioParts =
    (s.startTime || "08:00")
      .split(":")
      .map(Number);


  const fimParts =
    (s.endTime || "22:00")
      .split(":")
      .map(Number);


  const inicio =
    inicioParts[0] * 60 +
    inicioParts[1];


  const fim =
    fimParts[0] * 60 +
    fimParts[1];


  if (inicio <= fim) {

    return (
      atual >= inicio &&
      atual <= fim
    );

  }


  return (
    atual >= inicio ||
    atual <= fim
  );

}


/* =========================
   PROCESSAR FILA
========================= */

function processarProximaOferta() {

  if (!queue.length) {

    atualizarStatusFila(
      "🏁 A fila está vazia."
    );

    pararControleFila();

    return;

  }


  if (!dentroDoHorario()) {

    atualizarStatusFila(
      "🌙 Fora do horário de funcionamento."
    );

    return;

  }


  const oferta =
    queue.shift();


  oferta.publishedAt =
    new Date()
      .toLocaleString("pt-BR");


  oferta.status =
    "processada";


  history.unshift(
    oferta
  );


  save();

  render();


  atualizarStatusFila(
    `✅ Oferta processada: ${oferta.name}`
  );

}


/* =========================
   CONTROLE DA FILA
========================= */

function atualizarStatusFila(texto) {

  const status =
    document.getElementById(
      "automationStatus"
    );

  if (status) {
    status.textContent =
      texto;
  }

}


function iniciarControleFila() {

  pararControleFila();


  if (
    !settings ||
    settings.autoPublish !== "on"
  ) {

    atualizarStatusHorario();

    return;

  }


  const minutos =
    Number(
      settings.interval ||
      30
    );


  const intervalo =
    Math.max(
      1,
      minutos
    ) *
    60 *
    1000;


  if (
    dentroDoHorario() &&
    queue.length
  ) {

    processarProximaOferta();

  }


  queueTimer =
    setInterval(
      () => {

        atualizarStatusHorario();


        if (
          dentroDoHorario() &&
          queue.length &&
          !automationRunning
        ) {

          processarProximaOferta();

        }

      },
      intervalo
    );

}


function pararControleFila() {

  if (queueTimer) {

    clearInterval(
      queueTimer
    );

    queueTimer = null;

  }

}


/* =========================
   CONFIGURAÇÕES
========================= */

function salvarConfiguracoes() {

  const startTime =
    document.getElementById(
      "startTime"
    )?.value ||
    "08:00";


  const endTime =
    document.getElementById(
      "endTime"
    )?.value ||
    "22:00";


  const interval =
    Number(
      document.getElementById(
        "publishInterval"
      )?.value ||
      30
    );


  const autoPublish =
    document.getElementById(
      "autoPublish"
    )?.value ||
    "off";


  const days = {

    0:
      document.getElementById(
        "daySunday"
      )?.checked ?? true,

    1:
      document.getElementById(
        "dayMonday"
      )?.checked ?? true,

    2:
      document.getElementById(
        "dayTuesday"
      )?.checked ?? true,

    3:
      document.getElementById(
        "dayWednesday"
      )?.checked ?? true,

    4:
      document.getElementById(
        "dayThursday"
      )?.checked ?? true,

    5:
      document.getElementById(
        "dayFriday"
      )?.checked ?? true,

    6:
      document.getElementById(
        "daySaturday"
      )?.checked ?? true

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

  iniciarControleFila();


  alert(
    "✅ Configurações salvas com sucesso!"
  );

}


/* =========================
   CARREGAR CONFIGURAÇÕES
========================= */

function carregarConfiguracoes() {

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

        el.checked =
          true;

      }

    }
  );


  atualizarStatusHorario();

}


/* =========================
   STATUS
========================= */

function atualizarStatusHorario() {

  const status =
    document.getElementById(
      "scheduleStatus"
    );


  if (!status) {
    return;
  }


  const inicio =
    settings.startTime ||
    "08:00";


  const fim =
    settings.endTime ||
    "22:00";


  const intervalo =
    settings.interval ||
    30;


  if (
    settings.autoPublish === "on"
  ) {

    if (dentroDoHorario()) {

      status.textContent =
        `🟢 Sistema ativo: ${inicio} às ${fim}. Intervalo de ${intervalo} minutos.`;

    } else {

      status.textContent =
        `🌙 Fora do horário: funcionamento das ${inicio} às ${fim}.`;

    }

  } else {

    status.textContent =
      `⚙️ Horário: ${inicio} às ${fim}. Publicação automática desativada.`;

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
         makeUniquePromo(o, offers.length)
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
      x =>
        String(x.id) ===
        String(id)
    ) ||

    queue.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (o) {
    makePreview(o);
  }

}


/* =========================
   OFERTA MANUAL
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

    id:
      Date.now(),

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
    makeUniquePromo(
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
                o.aff ||
                o.link
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

      offers
        .slice(0, 5)
        .map(
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
        )
        .join("")

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

      queue
        .map(
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
              makeUniquePromo(
                o,
                offers.length
              )
            ).replace(
              /\n/g,
              "<br>"
            )}

          </div>

        </div>

      `
        )
        .join("")

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

      history
        .map(
          o => `

        <div class="history-item">

          <b>
            ${esc(o.name)}
          </b>

          <br>

          <span class="muted">
            ${esc(
              o.publishedAt ||
              o.date ||
              ""
            )}
          </span>

        </div>

      `
        )
        .join("")

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

      groups
        .map(
          g => `

        <div class="group">

          <span>
            👥 ${esc(g)}
          </span>

          <span>✓</span>

        </div>

      `
        )
        .join("");

  }

}


/* =========================
   INICIAR
========================= */

carregarConfiguracoes();

render();

iniciarControleFila();
