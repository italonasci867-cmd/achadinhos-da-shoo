const API_URL = "https://achadinhos-shoo-api.nitalo874.workers.dev";
const GROUP_LINK = "https://chat.whatsapp.com/LQGGHRSAtcTDQmoHF4S55n?s=cl&p=i&mlu=0&ilr=4";
const INVITE_TEXT = "Convide um amigo para participar";

let offers = JSON.parse(localStorage.getItem("ads_offers") || "[]");
let queue = JSON.parse(localStorage.getItem("ads_queue") || "[]");
let history = JSON.parse(localStorage.getItem("ads_history") || "[]");
let groups = JSON.parse(localStorage.getItem("ads_groups") || "[]");
let automationRunning = false;

const titles = {
  inicio:"Início",
  ofertas:"Ofertas",
  criar:"Criar divulgação",
  fila:"Fila de publicação",
  historico:"Histórico",
  grupos:"Grupos",
  config:"Configurações"
};

function showPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
  document.getElementById("pageTitle").textContent=titles[id];
  render();
  document.querySelector(".sidebar").classList.remove("open");
}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));

document.getElementById("menuBtn").onclick=()=>{
  document.querySelector(".sidebar").classList.toggle("open");
};

function save(){
  localStorage.setItem("ads_offers",JSON.stringify(offers));
  localStorage.setItem("ads_queue",JSON.stringify(queue));
  localStorage.setItem("ads_history",JSON.stringify(history));
}

function formatBRL(v){
  let n=Number(v);
  if(!Number.isFinite(n)) return String(v||"");
  if(n>100000) n=n/100000;
  return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function esc(s){
  return String(s??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;"
  }[m]));
}

function makeId(link){
  return "shopee-" + btoa(unescape(encodeURIComponent(link)))
    .replace(/[^a-zA-Z0-9]/g,"")
    .slice(0,32);
}

function makePromo(o,index=0){
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

  const open = openings[index % openings.length];
  const link = o.aff || o.link;

  return `${open}

🛒 ${o.name}
💰 ${o.price}

👉 COMPRE AQUI:
${link}

👥 ${INVITE_TEXT}
${GROUP_LINK}`;
}

async function buscarOfertas(keyword){
  const response = await fetch(
    `${API_URL}/buscar-ofertas?q=${encodeURIComponent(keyword)}`
  );

  const data = await response.json();

  if(!response.ok){
    throw new Error(data.erro || "Erro na Shopee");
  }

  return (data.data?.productOfferV2?.nodes || [])
    .map(x=>({
      id:makeId(x.offerLink || x.productLink || x.productName),
      name:x.productName || "Produto da Shopee",
      price:x.priceMin != null
        ? formatBRL(x.priceMin)
        : formatBRL(x.price),
      old:"",
      link:x.productLink || "",
      aff:x.offerLink || x.productLink || "",
      image:x.imageUrl || "",
      category:"Shopee",
      sales:Number(x.sales || 0),
      commissionRate:x.commissionRate || "",
      shopName:x.shopName || "",
      date:new Date().toLocaleString("pt-BR"),
      source:"Shopee API"
    }))
    .filter(x=>x.link && x.price);
}

async function iniciarAutomacao(){

  if(automationRunning) return;

  automationRunning=true;

  const btn=document.getElementById("startAutomationBtn");
  const status=document.getElementById("automationStatus");

  if(btn){
    btn.disabled=true;
    btn.textContent="⏳ AUTOMATIZANDO...";
  }

  if(status){
    status.textContent="🔎 Buscando ofertas na Shopee...";
  }

  const keywords=[
    "fone bluetooth",
    "air fryer",
    "casa cozinha",
    "moda feminina",
    "eletrônicos"
  ];

  let all=[];
  let erros=0;

  try{

    for(let i=0;i<keywords.length;i++){

      if(status){
        status.textContent=
          `🔎 Buscando ${i+1}/${keywords.length}: ${keywords[i]}...`;
      }

      try{
        all.push(...await buscarOfertas(keywords[i]));
      }catch(e){
        erros++;
      }
    }

    const known=new Set(offers.map(x=>x.link));
    const queued=new Set(queue.map(x=>x.link));

    const unique=[];
    const seen=new Set();

    for(const item of all){

      if(
        !item.link ||
        seen.has(item.link) ||
        known.has(item.link) ||
        queued.has(item.link)
      ){
        continue;
      }

      seen.add(item.link);
      unique.push(item);
    }

    unique.sort((a,b)=>b.sales-a.sales);

    const selected=unique.slice(0,15);

    selected.forEach((o,i)=>{

      o.promo=makePromo(o,i);

      offers.unshift(o);
      queue.push(o);

    });

    save();
    render();

    showPage("fila");

    if(status){

      status.textContent=selected.length
        ? `✅ Concluído: ${selected.length} ofertas selecionadas, divulgadas e colocadas na fila.`
        : "ℹ️ Nenhuma oferta nova encontrada. A fila já está atualizada.";

    }

  }catch(e){

    if(status){
      status.textContent="❌ Não foi possível concluir a automação.";
    }

    alert(
      "A automação não conseguiu concluir: " +
      e.message
    );

  }finally{

    automationRunning=false;

    if(btn){
      btn.disabled=false;
      btn.textContent="▶️ INICIAR AUTOMAÇÃO";
    }

    render();
  }
}

function makePreview(o){

  const preview=document.getElementById("preview");

  if(!preview) return;

  preview.innerHTML=
    `<h3>Prévia da divulgação</h3>
     <div class="preview-box">
       ${esc(o.promo || makePromo(o,0)).replace(/\n/g,"<br>")}
     </div>`;

  showPage("criar");
}

function makePreviewById(id){

  const o=
    offers.find(x=>x.id===id) ||
    queue.find(x=>x.id===id);

  if(o) makePreview(o);
}

function saveOffer(){

  const name=
    document.getElementById("productName").value.trim() ||
    "Produto da Shopee";

  const price=
    document.getElementById("price").value.trim();

  const old=
    document.getElementById("oldPrice").value.trim();

  const link=
    document.getElementById("productLink").value.trim();

  const aff=
    document.getElementById("affiliateLink").value.trim();

  if(!price || !link){
    alert("Preencha o preço e o link do produto.");
    return;
  }

  if(!/^https?:\/\//i.test(link)){
    alert("Informe um link válido do produto.");
    return;
  }

  const o={
    id:Date.now(),
    name,
    price,
    old,
    link,
    aff,
    category:document.getElementById("category").value,
    date:new Date().toLocaleString("pt-BR")
  };

  o.promo=makePromo(o,offers.length);

  offers.unshift(o);
  queue.push(o);

  save();
  makePreview(o);
  render();
}

function addGroup(){

  const n=
    document.getElementById("groupName").value.trim();

  if(!n) return;

  groups.push(n);

  document.getElementById("groupName").value="";

  save();
  render();
}

function render(){

  document.getElementById("countOffers").textContent=
    offers.length;

  document.getElementById("countQueue").textContent=
    queue.length;

  document.getElementById("countLinks").textContent=
    offers.filter(x=>x.link).length;

  document.getElementById("countPublished").textContent=
    history.length;

  const list=
    document.getElementById("offersList");

  list.innerHTML=offers.length

    ? offers.map(o=>`

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

            : `<div class="image-placeholder">🛍️</div>`
          }

        </div>

        <div class="offer-content">

          <span class="tag">
            ${esc(o.category || "Achadinhos")}
          </span>

          <h3>${esc(o.name)}</h3>

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
              onclick="window.open('${esc(o.aff || o.link)}','_blank')">
              🛒 Ver oferta
            </button>

            <button
              class="primary"
              onclick="makePreviewById('${esc(o.id)}')">
              ✍️ Divulgação
            </button>

          </div>

        </div>

      </div>

    `).join("")

    : `<div class="empty">
        Nenhuma oferta cadastrada.
       </div>`;

  document.getElementById("recentOffers").innerHTML=
    offers.slice(0,5).map(o=>`

      <div class="queue-item">

        <b>${esc(o.name)}</b>

        <br>

        <span class="muted">
          ${esc(o.price)} • ${esc(o.date)}
        </span>

      </div>

    `).join("")

    || `<div class="empty">
          Nenhuma oferta cadastrada ainda.
        </div>`;

  document.getElementById("queueList").innerHTML=
    queue.map(o=>`

      <div class="queue-item">

        <b>${esc(o.name)}</b>

        <br>

        <span class="muted">
          ${esc(o.price)} • aguardando publicação
        </span>

        <div class="promo-mini">
          ${esc(o.promo || makePromo(o,0))
            .replace(/\n/g,"<br>")}
        </div>

      </div>

    `).join("")

    || `<div class="empty">
          Nenhuma oferta na fila.
        </div>`;

  document.getElementById("historyList").innerHTML=
    history.map(o=>`

      <div class="history-item">

        <b>${esc(o.name)}</b>

        <br>

        <span class="muted">
          ${esc(o.date)}
        </span>

      </div>

    `).join("")

    || `<div class="empty">
          Nenhuma publicação registrada.
        </div>`;

  document.getElementById("groupsList").innerHTML=
    groups.map(g=>`

      <div class="group">

        <span>
          👥 ${esc(g)}
        </span>

        <span>✓</span>

      </div>

    `).join("");
}

render();
