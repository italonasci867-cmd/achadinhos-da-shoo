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
  catalogo: "Catálogo Shopee",
  estudio: "Estúdio de vídeos",
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


/* =========================
   GERAR TEXTO DA OFERTA
========================= */

function makeUniquePromo(o, index = 0) {

  const seed =
    `${o.name}|${o.price}|${o.link}|${index}`;

  const base =
    hashNumber(seed);

  let openingIndex =
    base % promoOpenings.length;

  let middleIndex =
    Math.floor(base / 7) %
    promoMiddle.length;

  let closingIndex =
    Math.floor(base / 13) %
    promoClosings.length;

  let promo = "";

  for (
    let tentativa = 0;
    tentativa < 300;
    tentativa++
  ) {

    const oi =
      (openingIndex + tentativa) %
      promoOpenings.length;

    const mi =
      (middleIndex + tentativa * 3) %
      promoMiddle.length;

    const ci =
      (closingIndex + tentativa * 5) %
      promoClosings.length;

    const linkFinal =
      o.aff ||
      o.link;

    promo = `${promoOpenings[oi]}

🛒 ${o.name}
💰 ${o.price}

${promoMiddle[mi]}

${promoClosings[ci]}:
${linkFinal}

👥 ${INVITE_TEXT}
${GROUP_LINK}`;

    if (!usedPromos.includes(promo)) {
      break;
    }
  }

  usedPromos.push(promo);

  if (usedPromos.length > 3000) {

    usedPromos =
      usedPromos.slice(-2500);

  }

  return promo;
}


/* =========================
   COPIAR OFERTA
========================= */

async function copiarOferta(id) {

  const o =
    offers.find(
      x => String(x.id) === String(id)
    ) ||
    queue.find(
      x => String(x.id) === String(id)
    ) ||
    history.find(
      x => String(x.id) === String(id)
    );

  if (!o) {

    alert("Oferta não encontrada.");

    return;

  }


  /*
    Se a oferta ainda não tiver
    divulgação, cria automaticamente.
  */

  if (!o.promo) {

    o.promo =
      makeUniquePromo(
        o,
        offers.length
      );

    save();

  }


  const texto =
    o.promo;


  try {

    await navigator.clipboard.writeText(texto);

    mostrarMensagemCopiado(id);

  } catch (error) {

    /*
      Método alternativo para celulares
      caso o navegador bloqueie clipboard.
    */

    const textarea =
      document.createElement("textarea");

    textarea.value = texto;

    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {

      document.execCommand("copy");

      mostrarMensagemCopiado(id);

    } catch (e) {

      alert(
        "Não foi possível copiar automaticamente. Tente novamente."
      );

    }

    document.body.removeChild(textarea);

  }

}


/* =========================
   AVISO DE COPIADO
========================= */

function mostrarMensagemCopiado(id) {

  const botoes =
    document.querySelectorAll(
      `[data-copy-id="${id}"]`
    );

  botoes.forEach(botao => {

    const textoOriginal =
      botao.innerHTML;

    botao.innerHTML =
      "✅ COPIADO!";

    botao.disabled = true;

    setTimeout(() => {

      botao.innerHTML =
        textoOriginal;

      botao.disabled = false;

    }, 1800);

  });

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
      "⏳ PESQUISANDO...";

  }

  try {

    const keyword =
      keywords[
        Math.floor(
          Math.random() *
          keywords.length
        )
      ];

    if (status) {

      status.textContent =
        `🔎 Procurando ofertas de "${keyword}"...`;

    }


    /* =========================
       BUSCAR NA SHOPEE
    ========================= */

    const produtos =
      await buscarOfertas(keyword);


    if (!produtos.length) {

      throw new Error(
        "Nenhuma oferta encontrada para essa busca."
      );

    }


    produtos.sort(
      (a, b) =>
        Number(b.sales || 0) -
        Number(a.sales || 0)
    );


    /*
      Procura um produto novo.
    */

    const o =
      produtos.find(
        x =>
          x.link &&
          !offers.some(
            o => o.link === x.link
          ) &&
          !queue.some(
            o => o.link === x.link
          )
      );


    if (!o) {

      throw new Error(
        "Os produtos encontrados já estavam cadastrados."
      );

    }


    /* =========================
       GERAR DIVULGAÇÃO
    ========================= */

    o.promo =
      makeUniquePromo(
        o,
        offers.length
      );


    /* =========================
       SALVAR
    ========================= */

    offers.unshift(o);

    queue.push(o);

    save();

    render();


    if (status) {

      status.textContent =
        `✅ Oferta encontrada e divulgação gerada: ${o.name}`;

    }


    alert(
      "✅ Oferta encontrada!\n\nA divulgação foi gerada e já está pronta para copiar."
    );


  } catch (e) {

    console.error(e);

    if (status) {

      status.textContent =
        "❌ Não foi possível concluir a busca.";

    }

    alert(
      "A busca encontrou um erro:\n\n" +
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

  if (!o.promo) {

    o.promo =
      makeUniquePromo(
        o,
        offers.length
      );

    save();

  }

  preview.innerHTML =

    `<h3>📝 Texto gerado</h3>

     <div class="preview-box">

       ${esc(o.promo).replace(
         /\n/g,
         "<br>"
       )}

     </div>

     <button
       class="primary"
       data-copy-id="${esc(o.id)}"
       onclick="copiarOferta('${esc(o.id)}')">

       📋 COPIAR OFERTA

     </button>`;

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


  /* =========================
     OFERTAS
  ========================= */

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

              📝 Texto gerado

            </button>


            <button
              class="primary"
              data-copy-id="${esc(o.id)}"
              onclick="copiarOferta('${esc(o.id)}')">

              📋 COPIAR OFERTA

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


  /* =========================
     RECENTES
  ========================= */

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


  /* =========================
     FILA
  ========================= */

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
              ""
            ).replace(
              /\n/g,
              "<br>"
            )}

          </div>


          <button
            class="primary"
            data-copy-id="${esc(o.id)}"
            onclick="copiarOferta('${esc(o.id)}')">

            📋 COPIAR OFERTA

          </button>

        </div>

      `
        )
        .join("")

      ||

      `<div class="empty">
        Nenhuma oferta na fila.
      </div>`;

  }


  /* =========================
     HISTÓRICO
  ========================= */

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


  /* =========================
     GRUPOS
  ========================= */

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
   CATÁLOGO E ESTÚDIO DE VÍDEOS
========================= */
let catalogProducts = [];
let studioProduct = null;
let studioImage = null;

function setCatalogStatus(message) {
  const el = document.getElementById("catalogStatus");
  if (el) el.textContent = message;
}

async function pesquisarCatalogo() {
  const input = document.getElementById("catalogQuery");
  const query = (input?.value || "").trim();
  const btn = document.getElementById("catalogSearchBtn");
  const results = document.getElementById("catalogResults");
  if (!query) {
    setCatalogStatus("Digite o nome de um produto para pesquisar.");
    input?.focus();
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Pesquisando..."; }
  setCatalogStatus("🔎 Consultando a integração de ofertas da Shopee...");
  if (results) results.innerHTML = '<div class="empty">Buscando produtos...</div>';
  try {
    const products = await buscarOfertas(query);
    catalogProducts = products;
    if (!products.length) {
      if (results) results.innerHTML = '<div class="empty">Nenhum produto retornou nessa busca. Tente outro termo.</div>';
      setCatalogStatus("Nenhum produto encontrado para essa pesquisa.");
      return;
    }
    if (results) results.innerHTML = products.map((p, i) => `
      <article class="catalog-card">
        <div class="catalog-image">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('no-image')">` : '<span>🛍️</span>'}</div>
        <div class="catalog-card-body">
          <span class="tag">SHOPEE</span>
          <h3>${esc(p.name)}</h3>
          <div class="price">${esc(p.price)}</div>
          <p class="muted">${p.sales ? '🔥 ' + Number(p.sales).toLocaleString('pt-BR') + ' vendidos' : 'Achadinho encontrado'}</p>
          <div class="catalog-actions">
            <button class="gold" onclick="selecionarProdutoCatalogo(${i})">🎬 Criar vídeo</button>
            <button class="secondary-btn" onclick="abrirLinkCatalogo(${i})">Ver produto ↗</button>
          </div>
        </div>
      </article>`).join("");
    setCatalogStatus(`✅ ${products.length} produto(s) encontrado(s). Escolha um para criar o vídeo.`);
  } catch (error) {
    console.error(error);
    if (results) results.innerHTML = '<div class="empty">Não foi possível carregar os resultados.</div>';
    setCatalogStatus("❌ A busca falhou: " + (error.message || "verifique a conexão da API."));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🔎 Buscar produtos"; }
  }
}

function abrirLinkCatalogo(index) {
  const p = catalogProducts[index];
  const url = p && (p.aff || p.link);
  if (url && /^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener");
  else alert("Esse produto não tem um link disponível.");
}

function selecionarProdutoCatalogo(index) {
  const p = catalogProducts[index];
  if (!p) return;
  studioProduct = { ...p };
  studioImage = null;
  const info = document.getElementById("studioProductInfo");
  if (info) info.className = "selected-product";
  if (info) info.innerHTML = `
    <div class="selected-product-row">
      ${p.image ? `<img src="${esc(p.image)}" alt="">` : '<span class="selected-emoji">🛍️</span>'}
      <div><strong>${esc(p.name)}</strong><div class="price">${esc(p.price)}</div><small>Produto selecionado</small></div>
    </div>`;
  if (p.image) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { studioImage = img; atualizarPreviewVideo(); };
    img.onerror = () => { studioImage = null; atualizarPreviewVideo(); };
    img.src = p.image;
  }
  const status = document.getElementById("videoStatus");
  if (status) status.textContent = "Produto selecionado. Personalize os textos e gere seu vídeo.";
  showPage("estudio");
  atualizarPreviewVideo();
}

function desenharArtePromocional(ctx, frame, elapsed, total) {
  const w = 360, h = 640;
  const p = studioProduct || {};
  const headline = (document.getElementById("studioHeadline")?.value || "ACHADINHO IMPERDÍVEL").trim().toUpperCase();
  const subtitle = (document.getElementById("studioSubtitle")?.value || "Confira essa oferta").trim();
  const price = String(p.price || "Confira o preço");
  const pulse = 1 + Math.sin(elapsed * 3) * 0.018;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#17130a"); grad.addColorStop(.55, "#08090c"); grad.addColorStop(1, "#30230a");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#d4af37"; ctx.globalAlpha = .12;
  ctx.beginPath(); ctx.arc(320, 70, 120 + Math.sin(elapsed * 2) * 8, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#d4af37"; ctx.fillRect(24, 28, 42, 4);
  ctx.fillStyle = "#f7d978"; ctx.font = "bold 13px Arial"; ctx.fillText("ACHADINHOS DA SHOO", 24, 55);
  ctx.fillStyle = "#ffffff"; ctx.font = "900 27px Arial";
  const words = headline.split(/\s+/); let line = "", y = 102;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > 310 && line) { ctx.fillText(line, 24, y); y += 32; line = word; }
    else line = test;
  }
  if (line && y < 178) ctx.fillText(line, 24, y);
  const cardY = 190;
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(24, cardY, 312, 242, 20); ctx.fill();
  if (studioImage) {
    try {
      const img = studioImage;
      const scale = Math.min(280 / img.width, 210 / img.height);
      const iw = img.width * scale, ih = img.height * scale;
      ctx.drawImage(img, 180 - iw / 2, cardY + 16 + (210 - ih) / 2, iw, ih);
    } catch (e) { desenharIconeProduto(ctx, cardY); }
  } else desenharIconeProduto(ctx, cardY);
  ctx.fillStyle = "#f7d978"; ctx.font = "bold 12px Arial"; ctx.fillText("OFERTA EM DESTAQUE", 24, 464);
  ctx.fillStyle = "#fff"; ctx.font = "bold 17px Arial";
  const name = String(p.name || "Seu produto").slice(0, 56);
  const nameLines = name.match(/.{1,34}(?:\s|$)|.{1,34}/g) || [name];
  ctx.fillText(nameLines[0].trim(), 24, 490);
  if (nameLines[1]) ctx.fillText(nameLines[1].trim(), 24, 512);
  ctx.save(); ctx.translate(180, 550); ctx.scale(pulse, pulse);
  ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.roundRect(-156, -26, 312, 52, 14); ctx.fill();
  ctx.fillStyle = "#111"; ctx.font = "900 25px Arial"; ctx.textAlign = "center"; ctx.fillText(price, 0, 8); ctx.restore();
  ctx.fillStyle = "#dedede"; ctx.font = "13px Arial"; ctx.textAlign = "center";
  ctx.fillText(subtitle.slice(0, 44), 180, 594);
  ctx.fillStyle = "#a7a7a7"; ctx.font = "10px Arial"; ctx.fillText("CONFIRA OS DETALHES NO LINK DO PRODUTO", 180, 619);
  ctx.textAlign = "left";
}

function desenharIconeProduto(ctx, y) {
  ctx.fillStyle = "#f5f0df"; ctx.beginPath(); ctx.arc(180, y + 120, 66, 0, Math.PI * 2); ctx.fill();
  ctx.font = "64px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "#30230a"; ctx.fillText("🛍️", 180, y + 143); ctx.textAlign = "left";
}

function atualizarPreviewVideo() {
  const canvas = document.getElementById("promoCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  desenharArtePromocional(ctx, 0, 1.5, 12);
  const status = document.getElementById("videoStatus");
  if (status && studioProduct) status.textContent = "Prévia atualizada. Toque em “Gerar e baixar vídeo” para exportar.";
}

async function gerarVideoPromocional() {
  const canvas = document.getElementById("promoCanvas");
  const btn = document.getElementById("downloadVideoBtn");
  const status = document.getElementById("videoStatus");
  if (!studioProduct) {
    if (status) status.textContent = "Escolha primeiro um produto no Catálogo Shopee.";
    showPage("catalogo");
    return;
  }
  if (!canvas || !canvas.captureStream || !window.MediaRecorder) {
    if (status) status.textContent = "Seu navegador não oferece gravação de vídeo por este recurso. Tente abrir o site no Chrome atualizado.";
    return;
  }
  const seconds = Number(document.getElementById("studioDuration")?.value || 12);
  const stream = canvas.captureStream(24);
  let recorder;
  let chunks = [];
  try {
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
    recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  } catch (e) {
    stream.getTracks().forEach(t => t.stop());
    if (status) status.textContent = "Não foi possível iniciar o gerador de vídeo neste navegador.";
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = "⏳ GERANDO VÍDEO..."; }
  if (status) status.textContent = `Renderizando vídeo vertical de ${seconds} segundos...`;
  const ctx = canvas.getContext("2d");
  let startedAt = 0, raf = 0;
  const draw = (time) => {
    if (!startedAt) startedAt = time;
    const elapsed = (time - startedAt) / 1000;
    desenharArtePromocional(ctx, 0, elapsed, seconds);
    if (elapsed < seconds) raf = requestAnimationFrame(draw);
  };
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onerror = () => {
    if (status) status.textContent = "O navegador encontrou um erro ao gravar o vídeo.";
  };
  recorder.onstop = () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach(t => t.stop());
    if (chunks.length) {
      const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "achadinho-da-shoo-video.webm";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (status) status.textContent = "✅ Vídeo gerado! Confira a pasta Downloads do seu celular.";
    }
    if (btn) { btn.disabled = false; btn.textContent = "🎬 GERAR E BAIXAR VÍDEO"; }
  };
  recorder.start();
  requestAnimationFrame(draw);
  setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, seconds * 1000 + 350);
}


/* =========================
   EVENTOS DO CATÁLOGO E ESTÚDIO
========================= */
function conectarBotoesCatalogoEstudio() {
  const searchButton = document.getElementById("catalogSearchBtn");
  const queryInput = document.getElementById("catalogQuery");
  const previewButton = document.querySelector("#estudio .studio-controls .primary");
  const videoButton = document.getElementById("downloadVideoBtn");

  if (searchButton) {
    searchButton.addEventListener("click", event => {
      event.preventDefault();
      pesquisarCatalogo();
    });
  }

  if (queryInput) {
    queryInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        pesquisarCatalogo();
      }
    });
  }

  if (previewButton) {
    previewButton.addEventListener("click", event => {
      event.preventDefault();
      atualizarPreviewVideo();
    });
  }

  if (videoButton) {
    videoButton.addEventListener("click", event => {
      event.preventDefault();
      gerarVideoPromocional();
    });
  }
}

conectarBotoesCatalogoEstudio();

/* =========================
   INICIAR
========================= */

/* =========================
   LIGAÇÃO EXPLÍCITA DOS BOTÕES
========================= */
// Expõe as funções para os botões HTML e liga os controles mesmo
// quando o navegador mantém uma versão antiga da página em cache.
window.pesquisarCatalogo = pesquisarCatalogo;
window.abrirLinkCatalogo = abrirLinkCatalogo;
window.selecionarProdutoCatalogo = selecionarProdutoCatalogo;
window.atualizarPreviewVideo = atualizarPreviewVideo;
window.gerarVideoPromocional = gerarVideoPromocional;

const catalogSearchButton = document.getElementById("catalogSearchBtn");
if (catalogSearchButton) {
  catalogSearchButton.addEventListener("click", (event) => {
    event.preventDefault();
    pesquisarCatalogo();
  });
}

const downloadVideoButton = document.getElementById("downloadVideoBtn");
if (downloadVideoButton) {
  downloadVideoButton.addEventListener("click", (event) => {
    event.preventDefault();
    gerarVideoPromocional();
  });
}

const previewVideoButton = document.querySelector("#estudio .studio-controls button.primary");
if (previewVideoButton) {
  previewVideoButton.addEventListener("click", (event) => {
    event.preventDefault();
    atualizarPreviewVideo();
  });
}

carregarConfiguracoes();

render();

iniciarControleFila();
