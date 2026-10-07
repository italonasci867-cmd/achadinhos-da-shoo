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


/* =========================
   NAVEGAÇÃO
========================= */

function showPage(id) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(id);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === id
    );
  });

  const title = document.getElementById("pageTitle");

  if (title) {
    title.textContent = titles[id] || "";
  }

  render();

  document
    .querySelector(".sidebar")
    ?.classList.remove("open");
}


document.querySelectorAll(".nav").forEach(button => {

  button.onclick = () => {
    showPage(button.dataset.page);
  };

});


const menuBtn = document.getElementById("menuBtn");

if (menuBtn) {

  menuBtn.onclick = () => {

    document
      .querySelector(".sidebar")
      ?.classList.toggle("open");

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
   BUSCAR SHOPEE
========================= */

async function buscarOfertasShopee() {

  const campo = document.getElementById("searchShopee");

  const termo = campo
    ? campo.value.trim()
    : "";

  if (!termo) {

    alert(
      "Digite o produto que você quer procurar."
    );

    return;
  }


  const botao =
    document.getElementById("searchShopeeBtn");


  try {

    if (botao) {

      botao.disabled = true;

      botao.textContent =
        "⏳ Buscando...";
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
        "Erro ao buscar ofertas."
      );

    }


    const produtos =
      dados?.data?.productOfferV2?.nodes || [];


    if (!produtos.length) {

      alert(
        "Nenhuma oferta encontrada."
      );

      return;
    }


    const novasOfertas = produtos.map(
      (produto, index) => {

        return {

          id:
            Date.now() +
            index,

          name:
            produto.productName ||
            "Produto da Shopee",

          price:
            formatarPreco(
              produto.price
            ),

          old: "",

          link:
            produto.productLink ||
            "",

          aff:
            produto.offerLink ||
            "",

          image:
            produto.imageUrl ||
            "",

          sales:
            produto.sales || 0,

          commissionRate:
            produto.commissionRate ||
            "",

          shopName:
            produto.shopName ||
            "",

          category:
            termo,

          date:
            new Date().toLocaleString(
              "pt-BR"
            ),

          origem:
            "Shopee"

        };

      }
    );


    let adicionadas = 0;


    novasOfertas.forEach(oferta => {

      const existe =
        offers.some(item =>
          item.link === oferta.link
        );


      if (!existe) {

        offers.unshift(oferta);

        adicionadas++;

      }

    });


    save();

    render();


    alert(
      `${adicionadas} novas ofertas encontradas!`
    );


  } catch (erro) {

    console.error(erro);

    alert(
      "Erro ao buscar ofertas: " +
      erro.message
    );


  } finally {

    if (botao) {

      botao.disabled = false;

      botao.textContent =
        "🔎 Buscar ofertas";

    }

  }

}


/* =========================
   PREÇO
========================= */

function formatarPreco(valor) {

  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {

    return "";

  }


  const numero =
    Number(valor);


  if (Number.isNaN(numero)) {

    return String(valor);

  }


  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* =========================
   SALVAR MANUAL
========================= */

function saveOffer() {

  const name =
    document
      .getElementById("productName")
      ?.value.trim() ||
    "Produto da Shopee";


  const price =
    document
      .getElementById("price")
      ?.value.trim() ||
    "";


  const old =
    document
      .getElementById("oldPrice")
      ?.value.trim() ||
    "";


  const link =
    document
      .getElementById("productLink")
      ?.value.trim() ||
    "";


  const aff =
    document
      .getElementById("affiliateLink")
      ?.value.trim() ||
    "";


  if (!price || !link) {

    alert(
      "Preencha o preço e o link do produto."
    );

    return;
  }


  if (!/^https?:\/\//i.test(link)) {

    alert(
      "Informe um link válido."
    );

    return;
  }


  const oferta = {

    id: Date.now(),

    name,

    price,

    old,

    link,

    aff,

    image: "",

    category:
      document
        .getElementById("category")
        ?.value ||
      "Achadinhos",

    date:
      new Date().toLocaleString(
        "pt-BR"
      ),

    origem:
      "Manual"

  };


  offers.unshift(oferta);

  queue.push(oferta);

  save();

  makePreview(oferta);

  render();


  alert(
    "Oferta salva e colocada na fila!"
  );


  document
    .getElementById("productName")
    .value = "";

  document
    .getElementById("price")
    .value = "";

  document
    .getElementById("oldPrice")
    .value = "";

  document
    .getElementById("productLink")
    .value = "";

  document
    .getElementById("affiliateLink")
    .value = "";

}


/* =========================
   PRÉVIA
========================= */

function makePreview(oferta) {

  const preview =
    document.getElementById(
      "preview"
    );


  if (!preview) return;


  const link =
    oferta.aff ||
    oferta.link;


  preview.innerHTML = `

    <h3>
      Prévia da divulgação
    </h3>

    <div class="preview-box">

🔥 ACHADINHO DO DIA!

🛍️ ${esc(oferta.name)}

💰 ${esc(oferta.price)}

${oferta.old
  ? `🏷️ Antes: ${esc(oferta.old)}`
  : ""}

🛒 COMPRE AQUI:

${esc(link)}

👥 Convide um amigo para participar

${esc(
  document
    .getElementById("groupLink")
    ?.value || ""
)}

    </div>

  `;

}


/* =========================
   GRUPOS
========================= */

function addGroup() {

  const campo =
    document.getElementById(
      "groupName"
    );


  if (!campo) return;


  const nome =
    campo.value.trim();


  if (!nome) return;


  groups.push(nome);

  campo.value = "";

  save();

  render();

}


/* =========================
   RENDERIZAR OFERTAS
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
        oferta => oferta.link
      ).length;

  }


  if (countPublished) {

    countPublished.textContent =
      history.length;

  }


  const lista =
    document.getElementById(
      "offersList"
    );


  if (lista) {

    if (!offers.length) {

      lista.innerHTML = `
        <div class="empty">
          Nenhuma oferta encontrada.
        </div>
      `;

    } else {

      lista.innerHTML =
        offers.map(
          oferta => {

            return `

              <article
                class="offer-card">

                <div
                  class="offer-image">

                  ${
                    oferta.image

                    ? `

                      <img
                        src="${esc(
                          oferta.image
                        )}"

                        alt="${esc(
                          oferta.name
                        )}"

                        loading="lazy"

                        onerror="
                          this.style.display='none';
                          this.parentElement.classList.add('image-error');
                        "
                      >

                    `

                    : `

                      <div
                        class="image-placeholder">
                        🛍️
                      </div>

                    `
                  }

                </div>


                <div
                  class="offer-content">

                  <span
                    class="tag">

                    ${esc(
                      oferta.category ||
                      "Achadinhos"
                    )}

                  </span>


                  <h3>
                    ${esc(
                      oferta.name
                    )}
                  </h3>


                  ${
                    oferta.shopName

                    ? `

                      <p
                        class="shop">

                        🏪 ${esc(
                          oferta.shopName
                        )}

                      </p>

                    `

                    : ""
                  }


                  <div
                    class="offer-price">

                    ${esc(
                      oferta.price
                    )}

                  </div>


                  ${
                    oferta.sales

                    ? `

                      <div
                        class="sales">

                        🔥 ${esc(
                          oferta.sales
                        )} vendas

                      </div>

                    `

                    : ""
                  }


                  <button
                    class="primary offer-button"

                    onclick="abrirProduto('${esc(
                      oferta.aff ||
                      oferta.link
                    )}')">

                    🛒 Ver oferta

                  </button>


                  <button
                    class="gold offer-button"

                    onclick="makePreviewById(${oferta.id})">

                    ✍️ Gerar divulgação

                  </button>

                </div>

              </article>

            `;

          }
        ).join("");

    }

  }


  const recentes =
    document.getElementById(
      "recentOffers"
    );


  if (recentes) {

    recentes.innerHTML =
      offers
        .slice(0, 5)
        .map(
          oferta => `

            <div
              class="queue-item">

              <b>
                ${esc(
                  oferta.name
                )}
              </b>

              <br>

              <span
                class="muted">

                ${esc(
                  oferta.price
                )}

                •
                ${esc(
                  oferta.date
                )}

              </span>

            </div>

          `
        )
        .join("") ||

      `
        <div class="empty">
          Nenhuma oferta cadastrada ainda.
        </div>
      `;

  }


  const fila =
    document.getElementById(
      "queueList"
    );


  if (fila) {

    fila.innerHTML =
      queue
        .map(
          oferta => `

            <div
              class="queue-item">

              <b>
                ${esc(
                  oferta.name
                )}
              </b>

              <br>

              <span
                class="muted">

                ${esc(
                  oferta.price
                )}
                • aguardando publicação

              </span>

            </div>

          `
        )
        .join("") ||

      `
        <div class="empty">
          Nenhuma oferta na fila.
        </div>
      `;

  }


  const historico =
    document.getElementById(
      "historyList"
    );


  if (historico) {

    historico.innerHTML =
      history
        .map(
          oferta => `

            <div
              class="history-item">

              <b>
                ${esc(
                  oferta.name
                )}
              </b>

              <br>

              <span
                class="muted">

                ${esc(
                  oferta.date
                )}

              </span>

            </div>

          `
        )
        .join("") ||

      `
        <div class="empty">
          Nenhuma publicação registrada.
        </div>
      `;

  }


  const grupos =
    document.getElementById(
      "groupsList"
    );


  if (grupos) {

    grupos.innerHTML =
      groups
        .map(
          grupo => `

            <div
              class="group">

              <span>
                👥 ${esc(grupo)}
              </span>

              <span>
                ✓
              </span>

            </div>

          `
        )
        .join("");

  }

}


/* =========================
   ABRIR PRODUTO
========================= */

function abrirProduto(link) {

  if (!link) {

    alert(
      "Este produto não possui link."
    );

    return;
  }


  window.open(
    link,
    "_blank"
  );

}


/* =========================
   PRÉVIA PELO ID
========================= */

function makePreviewById(id) {

  const oferta =
    offers.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (!oferta) return;


  makePreview(oferta);

}


/* =========================
   SEGURANÇA
========================= */

function esc(valor) {

  return String(
    valor ?? ""
  ).replace(
    /[&<>"']/g,

    caractere => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[caractere])

  );

}


/* =========================
   INICIALIZAÇÃO
========================= */

render();
