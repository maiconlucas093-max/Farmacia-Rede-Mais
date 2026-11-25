(() => {
 const cfg = window.STORE_CONFIG || {};
   let products = [];
  let categories = [];
 const $ = s => document.querySelector(s);
 const normalize = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 let cart = [];
 let activeCategory = "";
 const phone = (cfg.whatsapp || "").replace(/\D/g,"");
 const makeWhatsApp = message => phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "";
 const generalMessage = "Olá! Gostaria de informações sobre os produtos da Drogaria Rede Mais.";
   async function loadRemoteCatalog() {
    const supabase = window.redeMaisSupabase;
    
    if (!supabase) {
      throw new Error("Conexão com o Supabase não encontrada.");
    }
    
    const [categoryResult, productResult] = await Promise.all([
      supabase
      .from("categories")
      .select("name, icon, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
      
      supabase
      .from("products")
      .select("id, name, brand, category, description, keywords, icon, image_url, price, stock, active")
      .eq("active", true)
      .order("name")
    ]);
    
    if (categoryResult.error) throw categoryResult.error;
    if (productResult.error) throw productResult.error;
    
    categories = categoryResult.data || [];
    products = productResult.data || [];
  }
 function setupLinks(){
   document.querySelectorAll("[data-whatsapp-link]").forEach(a=>{
     const url=makeWhatsApp(generalMessage);
     if(url){a.href=url;a.setAttribute("aria-label","Conversar com a Drogaria Rede Mais pelo WhatsApp");}
     else {a.href="#contato";a.addEventListener("click",e=>{e.preventDefault();alert("O WhatsApp comercial ainda não foi configurado. Preencha o número em js/config.js.");});}
   });
   $("#floatingWhatsapp").addEventListener("click",()=>openWhatsApp(generalMessage));
 }
 function openWhatsApp(message){
   const url=makeWhatsApp(message);
   if(!url){alert("Configure o WhatsApp comercial em js/config.js antes de publicar o site.");return;}
   window.open(url,"_blank","noopener");
 }
 function renderCategories(){
   $("#categoryGrid").innerHTML=categories.map(c=>`<button class="category-card ${activeCategory===c.name?"active":""}" data-category="${escapeHtml(c.name)}"><span class="category-icon">${c.icon}</span><strong>${escapeHtml(c.name)}</strong></button>`).join("");
   document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;renderCategories();filterProducts($("#searchInput").value);document.querySelector("#produtos").scrollIntoView({behavior:"smooth"});}));
 }
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function renderProducts(list){
       $("#productGrid").innerHTML = list.map(p => `<article class="product-card"><div class="product-visual">${p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:contain;padding:8px">`:escapeHtml(p.icon||"＋")}</div><small>${escapeHtml(p.category)}</small><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||"Consulte nossa equipe para mais informações.")}</p><button type="button" data-add="${escapeHtml(p.id)}">Adicionar à minha lista</button></article>`).join("");
    document.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addToCart(b.dataset.add)));
   $("#resultCount").textContent=`${list.length} ${list.length===1?"item encontrado":"itens encontrados"}`;
   $("#emptyState").hidden=list.length!==0;
   $("#productGrid").hidden=list.length===0;
 }
 function filterProducts(query=""){
   const q=normalize(query);
   const result=products.filter(p=>{
     const text=normalize([p.name,p.brand,p.category,p.description,p.keywords].join(" "));
     return (!q||text.includes(q))&&(!activeCategory||p.category===activeCategory);
   });
   renderProducts(result);
   const msg=q?`Olá! Gostaria de consultar este produto: ${query}`:"Olá! Gostaria de informações sobre os produtos.";
   $("#emptyWhatsapp").href=makeWhatsApp(msg)||"#contato";
 }
 function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({id,qty:1});updateCart();}
 function updateCart(){
   $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);
   $("#cartItems").innerHTML=cart.length?cart.map(x=>{const p=products.find(y=>y.id===x.id);return `<div class="cart-line"><span><strong>${escapeHtml(p.name)}</strong><br><small>Quantidade: ${x.qty}</small></span><span><button data-remove="${x.id}">Remover</button></span></div>`;}).join(""):"<p>Sua lista está vazia. Adicione produtos do catálogo para consultar.</p>";
   document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{cart=cart.filter(x=>x.id!==Number(b.dataset.remove));updateCart();}));
 }
 $("#searchForm").addEventListener("submit",e=>{e.preventDefault();activeCategory="";renderCategories();filterProducts($("#searchInput").value);$("#produtos").scrollIntoView({behavior:"smooth"});});
 $("#searchInput").addEventListener("input",e=>{activeCategory="";renderCategories();filterProducts(e.target.value);});
 $("#clearFilter").addEventListener("click",()=>{$("#searchInput").value="";activeCategory="";renderCategories();filterProducts("");});
 $("#cartOpen").addEventListener("click",()=>$("#cartDialog").showModal());
 $("#cartClose").addEventListener("click",()=>$("#cartDialog").close());
 $("#sendOrder").addEventListener("click",()=>{
   if(!cart.length){alert("Adicione pelo menos um produto à sua lista.");return;}
   const lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `- ${p.name} — Quantidade: ${x.qty}`;}).join("\n");
   openWhatsApp(`Olá! Gostaria de consultar os seguintes produtos na Drogaria Rede Mais:\n\n${lines}\n\nPoderiam confirmar disponibilidade e valores, por favor?`);
 });
 $("#menuToggle").addEventListener("click",()=>{const nav=$("#mainNav");const open=nav.classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open));});
 document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>{$("#mainNav").classList.remove("open");$("#menuToggle").setAttribute("aria-expanded","false");}));
 $("#year").textContent=new Date().getFullYear();
 setupLinks();renderCategories();filterProducts("");
 if(cfg.address)document.querySelector(".contact-placeholder span").textContent=cfg.address+(cfg.hours?" • "+cfg.hours:"");
})();