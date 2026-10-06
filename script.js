const API_URL = "https://achadinhos-shoo-api.nitalo874.workers.dev";

let offers = JSON.parse(localStorage.getItem("ads_offers") || "[]");
let queue = JSON.parse(localStorage.getItem("ads_queue") || "[]");
let history = JSON.parse(localStorage.getItem("ads_history") || "[]");
let groups = JSON.parse(localStorage.getItem("ads_groups") || "[]");

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
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));

  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  document.querySelectorAll(".nav").forEach(x =>
    x.classList.toggle("active", x.dataset.page === id)
  );

  const title = document.getElementById("pageTitle");
  if (title) title.textContent = titles[id] || "";

  render();

  document.querySelector(".sidebar")?.classList.remove("open");
}

document.querySelectorAll(".nav").forEach(b => {
  b.onclick = () => showPage(b.dataset.page);
});

const menuBtn = document.getElementById("menuBtn");

if (menuBtn) {
  menuBtn.onclick = () =>
    document.querySelector(".sidebar")?.classList.toggle("open");
}

function save() {
  localStorage.setItem("ads_offers", JSON.stringify(offers));
  localStorage.setItem("ads_queue", JSON.stringify(queue));
  localStorage.setItem("ads_history", JSON.stringify(history));
  localStorage.setItem("ads_groups", JSON.stringify(groups));
}

/* =========================================================
   BUSCAR OFERTAS DA SHOPEE
========================================================= */

async function buscarOfertasShopee() {
  const termo =
    document.getElementById("searchShopee")?.value.trim() ||
    document.getElementById("searchTerm")?.value.trim() ||
    "";

  if (!termo) {
    alert("Digite o que você quer procurar na Shopee.");
    return;
  }

  const botao =
    document.getElementById("searchShopeeBtn") ||
    document.querySelector("[onclick*='buscarOfertasShopee']");

  const textoOriginal = botao?.textContent;

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Buscando...";
    }

    const resposta = await fetch(
      `${API_URL}/buscar-ofertas?q=${encodeURIComponent(termo)}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados?.erro ||
        dados?.message ||
        "Não foi possível buscar as ofertas."
      );
    }

    const produtos = dados?.data?.productOfferV2?.nodes || [];

    if (!produtos.length) {
      alert("Nenhuma oferta encontrada para essa busca.");
      return;
    }

    const ofertasShopee = produtos.map((p, index) => ({
      id: Date.now() + index,
      name: p.productName || "Produto da Shopee",
      price: formatarPreco(p.price),
      old: "",
      link: p.productLink || "",
      aff: p.offerLink || "",
      image: p.imageUrl || "",
      sales: p.sales || 0,
      commissionRate: p.commissionRate || "",
      shopName: p.shopName || "",
      category: termo,
      date: new Date().toLocaleString("pt-BR"),
      origem: "Shopee"
    }));

    ofertasShopee.forEach(o => {
      const existe = offers.some(
        item =>
          item.link === o.link ||
          (item.name === o.name && item.price === o.price)
      );

      if (!existe) {
        offers.unshift(o);
      }
    });

    save();
    render();

    alert(
      `${ofertasShopee.length} ofertas encontradas!\n\nElas já apareceram na área de Ofertas.`
    );

  } catch (erro) {
    console.error(erro);
    alert("Erro ao buscar ofertas: " + erro.message);
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal || "Buscar ofertas";
    }
  }
}

/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarPreco(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return "";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/* =========================================================
   SALVAR OFERTA MANUALMENTE
========================================================= */

function saveOffer() {
  let name =
    document.getElementById("productName")?.value.trim() ||
    "Produto da Shopee";

  let price =
    document.getElementById("price")?.value.trim() || "";

  let old =
    document.getElementById("oldPrice")?.value.trim() || "";

  let link =
    document.getElementById("productLink")?.value.trim() || "";

  let aff =
    document.getElementById("affiliateLink")?.value.trim() || "";

  if (!price || !link) {
    alert("Preencha o preço e o link do produto.");
    return;
  }

  if (!/^https?:\/\//i.test(link)) {
    alert("Informe um link válido do produto.");
    return;
  }

  let o = {
    id: Date.now(),
    name,
    price,
    old,
    link,
    aff,
    image: "",
    category:
      document.getElementById("category")?.value || "Geral",
    date: new Date().toLocaleString("pt-BR"),
    origem: "Manual"
  };

  offers.unshift(o);
  queue.push(o);

  save();

  if (document.getElementById("productName"))
    document.getElementById("productName").value = "";

  if (document.getElementById("price"))
    document.getElementById("price").value = "";

  if (document.getElementById("oldPrice"))
    document.getElementById("oldPrice").value = "";

  if (document.getElementById("productLink"))
    document.getElementById("productLink").value = "";

  if (document.getElementById("affiliateLink"))
    document.getElementById("affiliateLink").value = "";

  makePreview(o);

  alert("Oferta salva e colocada na fila!");
}

/* =========================================================
   PRÉVIA DA DIVULGAÇÃO
========================================================= */

function makePreview(o) {
  const preview = document.getElementById("preview");

  if (!preview) return;

  const link = o.aff || o.link;

  preview.innerHTML = `
    <h3>Prévia da divulgação</h3>

    <div class="preview-box">
🔥 ACHADINHO DO DIA!

🛍️ ${esc(o.name)}

💰 Por apenas ${esc(o.price)}
${o.old ? `🏷️ Antes: ${esc(o.old)}` : ""}

🛒 COMPRE AQUI:
${esc(link)}

👥 Convide um amigo para participar
${esc(document.getElementById("groupLink")?.value || "")}
    </div>
  `;
}

/* =========================================================
   ADICIONAR GRUPO
========================================================= */

function addGroup() {
  const campo = document.getElementById("groupName");

  if (!campo) return;

  let n = campo.value.trim();

  if (!n) return;

  groups.push(n);

  campo.value = "";

  save();
  render();
}

/* =========================================================
   RENDERIZAR PAINEL
========================================================= */

function render() {
  const countOffers = document.getElementById("countOffers");
  const countQueue = document.getElementById("countQueue");
  const countLinks = document.getElementById("countLinks");
  const countPublished = document.getElementById("countPublished");

  if (countOffers) countOffers.textContent = offers.length;
  if (countQueue) countQueue.textContent = queue.length;
  if (countLinks)
    countLinks.textContent = offers.filter(x => x.link).length;
  if (countPublished) countPublished.textContent = history.length;

  const list = document.getElementById("offersList");

  if (list) {
    list.innerHTML = offers.length
      ? offers.map(o => `
        <div class="offer">

          <div class="offer-photo">
            ${
              o.image
                ? `<img src="${esc(o.image)}"
                     alt="${esc(o.name)}"
                     style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
                : "🛍️"
            }
          </div>

          <div class="offer-body">

            <span class="tag">
              ${esc(o.category || "Geral")}
            </span>

            <h3>${esc(o.name)}</h3>

            ${
              o.shopName
                ? `<p class="muted">🏪 ${esc(o.shopName)}</p>`
                : ""
            }

            ${
              o.sales !== undefined
                ? `<p class="muted">📊 ${esc(o.sales)} vendas</p>`
                : ""
            }

            ${
              o.old
                ? `<div class="old">${esc(o.old)}</div>`
                : ""
            }

            <div class="price">
              ${esc(o.price)}
            </div>

            <p class="muted">
              🔗 Link cadastrado
            </p>

            <button
              class="gold"
              onclick="makePreview(${JSON.stringify(o).replace(/"/g, "&quot;")})">
              Ver divulgação
            </button>

          </div>
        </div>
      `).join("")
      : `<div class="empty">Nenhuma oferta cadastrada.</div>`;
  }

  const recentOffers = document.getElementById("recentOffers");

  if (recentOffers) {
    recentOffers.innerHTML =
      offers.slice(0, 5).map(o => `
        <div class="queue-item">
          <b>${esc(o.name)}</b>
          <br>
          <span class="muted">
            ${esc(o.price)} • ${esc(o.date)}
          </span>
        </div>
      `).join("") ||
      `<div class="empty">Nenhuma oferta cadastrada ainda.</div>`;
  }

  const queueList = document.getElementById("queueList");

  if (queueList) {
    queueList.innerHTML =
      queue.map(o => `
        <div class="queue-item">
          <b>${esc(o.name)}</b>
          <br>
          <span class="muted">
            ${esc(o.price)} • aguardando publicação
          </span>
        </div>
      `).join("") ||
      `<div class="empty">Nenhuma oferta na fila.</div>`;
  }

  const historyList = document.getElementById("historyList");

  if (historyList) {
    historyList.innerHTML =
      history.map(o => `
        <div class="history-item">
          <b>${esc(o.name)}</b>
          <br>
          <span class="muted">
            ${esc(o.date)}
          </span>
        </div>
      `).join("") ||
      `<div class="empty">Nenhuma publicação registrada.</div>`;
  }

  const groupsList = document.getElementById("groupsList");

  if (groupsList) {
    groupsList.innerHTML =
      groups.map(g => `
        <div class="group">
          <span>👥 ${esc(g)}</span>
          <span>✓</span>
        </div>
      `).join("");
  }
}

/* =========================================================
   SEGURANÇA DO HTML
========================================================= */

function esc(s) {
  return String(s ?? "").replace(
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

render();
