/*
 * Módulo da Lojinha
 *
 * Etapa que ocorre após as rolagens de Ouro e antes do Nome. Permite ao
 * jogador gastar (ou não) o ouro inicial rolado na etapa de Ouro,
 * comprando itens de um catálogo carregado do backend (/api/gear).
 * Esse catálogo é o mesmo que o Mestre pode editar na aba "Loja" do
 * Painel do Mestre (adicionar/alterar/remover itens).
 *
 * O ouro/prata/cobre que sobrar continua com o personagem e é
 * exportado normalmente na ficha final (gold/silver/copper) e no
 * JSON de importação do Foundry (gear[], ledger[]).
 */
(function(){
  if (!window.app) window.app = {};
  const { state, $, el, showCheck } = window.app;
  const GEAR_SLOTS_TOTAL = Number(window.app.GEAR_SLOTS_TOTAL) || 10;

  const TYPE_LABELS = { weapon: "Armas", armor: "Armaduras", sundry: "Diversos", potion: "Poções" };
  const TYPE_ORDER = ["weapon","armor","sundry","potion"];
  const CURRENCY_LABEL = { gp: "PO", sp: "PP", cp: "PC" };

  let catalog = [];          // itens carregados de /api/gear
  let cart = {};             // { itemId: quantidade }
  let activeType = "all";
  let shopLocked = false;

  // ====================== Utilidades de moeda ======================
  function toCopper(gp, sp, cp){
    return (gp||0) * 100 + (sp||0) * 10 + (cp||0);
  }
  function fromCopper(total){
    total = Math.max(0, Math.round(total));
    const gp = Math.floor(total / 100);
    total -= gp * 100;
    const sp = Math.floor(total / 10);
    const cp = total - sp * 10;
    return { gp, sp, cp };
  }
  function itemUnitCopper(item){
    if (!item) return 0;
    if (item.currency === "gp") return item.cost * 100;
    if (item.currency === "sp") return item.cost * 10;
    return item.cost; // cp
  }
  function formatMoney(gp, sp, cp){
    const parts = [];
    if (gp) parts.push(`${gp} PO`);
    if (sp) parts.push(`${sp} PP`);
    if (cp || parts.length === 0) parts.push(`${cp} PC`);
    return parts.join(", ");
  }
  function formatItemCost(item){
    return `${item.cost} ${CURRENCY_LABEL[item.currency] || "PO"}`;
  }

  function baseWalletCopper(){
    return toCopper(state.gold || 0, state.silver || 0, state.copper || 0);
  }
  function cartTotalCopper(){
    return catalog.reduce((sum, item) => {
      const qty = cart[item.id] || 0;
      return sum + qty * itemUnitCopper(item);
    }, 0);
  }
  function cartSlotsUsed(){
    return catalog.reduce((sum, item) => sum + (cart[item.id] || 0) * (Number(item.slots) || 0), 0);
  }
  function remainingCopper(){
    return baseWalletCopper() - cartTotalCopper();
  }

  // ====================== Carregamento do catálogo ======================
  async function loadCatalog(){
    try {
      const resp = await fetch("/api/gear", { headers: { "cache-control": "no-store" } });
      if (!resp.ok) throw new Error("bad status");
      const data = await resp.json();
      catalog = Array.isArray(data.items) ? data.items : [];
    } catch {
      catalog = [];
    }
  }

  // ====================== Renderização ======================
  function renderWallet(){
    const walletEl = $("#shopWallet");
    if (!walletEl) return;
    const rem = fromCopper(remainingCopper());
    walletEl.textContent = `Restante: ${formatMoney(rem.gp, rem.sp, rem.cp)}`;
  }

  function renderCapacity(){
    const capacityEl = $("#shopCapacity");
    if (!capacityEl) return;
    const used = cartSlotsUsed();
    capacityEl.textContent = `Espaços na mochila: ${used}/${GEAR_SLOTS_TOTAL}`;
    capacityEl.classList.toggle("shop-capacity-full", used >= GEAR_SLOTS_TOTAL);
  }

  function renderTabs(){
    const wrap = $("#shopFilterTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    const types = ["all", ...TYPE_ORDER.filter(t => catalog.some(i => i.type === t))];
    types.forEach(t => {
      const btn = el("button", {
        class: t === activeType ? "" : "ghost",
        type: "button",
        onclick: () => { activeType = t; renderTabs(); renderList(); }
      });
      btn.textContent = t === "all" ? "Tudo" : (TYPE_LABELS[t] || t);
      wrap.append(btn);
    });
  }

  function renderList(){
    const listEl = $("#shopList");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!catalog.length){
      listEl.append(el("div", { class: "gm-empty" }, "Nenhum item disponível na lojinha no momento."));
      return;
    }

    const rem = remainingCopper();
    const usedSlots = cartSlotsUsed();
    const items = catalog
      .filter(i => activeType === "all" || i.type === activeType)
      .slice()
      .sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));

    if (!items.length){
      listEl.append(el("div", { class: "gm-empty" }, "Nenhum item encontrado com esse filtro."));
      return;
    }

    items.forEach(item => {
      const qty = cart[item.id] || 0;
      const unitCopper = itemUnitCopper(item);
      const hasMoney = rem - unitCopper >= 0;
      const hasSlots = item.slots === 0 || usedSlots + item.slots <= GEAR_SLOTS_TOTAL;
      const canAdd = !shopLocked && hasMoney && hasSlots;
      const canRemove = !shopLocked && qty > 0;

      const row = el("div", { class: "shop-item" });

      const info = el("div", { class: "shop-item-info" });
      info.append(el("div", { class: "shop-item-name" }, item.name));
      const metaBits = [formatItemCost(item)];
      metaBits.push(item.slots === 0 ? "sem peso" : `${item.slots} espaço${item.slots > 1 ? "s" : ""}`);
      info.append(el("div", { class: "shop-item-meta muted" }, metaBits.join(" · ")));
      row.append(info);

      const controls = el("div", { class: "shop-item-controls" });
      const btnMinus = el("button", {
        class: "ghost", type: "button",
        onclick: () => { changeQty(item, -1); }
      }, "–");
      btnMinus.disabled = !canRemove;
      const qtyOut = el("span", { class: "shop-item-qty" }, String(qty));
      const btnPlus = el("button", {
        class: "ghost", type: "button",
        onclick: () => { changeQty(item, 1); }
      }, "+");
      btnPlus.disabled = !canAdd;
      if (!hasSlots) btnPlus.title = `Limite de ${GEAR_SLOTS_TOTAL} espaços atingido`;
      else if (!hasMoney) btnPlus.title = "Saldo insuficiente";
      controls.append(btnMinus, qtyOut, btnPlus);
      row.append(controls);

      listEl.append(row);
    });
  }

  function renderCart(){
    const cartEl = $("#shopCart");
    const emptyEl = $("#shopCartEmpty");
    if (!cartEl || !emptyEl) return;
    cartEl.innerHTML = "";

    const entries = catalog
      .map(item => ({ item, qty: cart[item.id] || 0 }))
      .filter(e => e.qty > 0);

    emptyEl.style.display = entries.length ? "none" : "";

    entries.forEach(({ item, qty }) => {
      const line = el("div", { class: "shop-cart-line" });
      const unit = itemUnitCopper(item) * qty;
      const totalDisplay = fromCopper(unit);
      const totalStr = formatMoney(totalDisplay.gp, totalDisplay.sp, totalDisplay.cp);
      line.append(el("span", {}, `${item.name} ×${qty}`));
      line.append(el("span", { class: "muted" }, totalStr));
      cartEl.append(line);
    });
  }

  function renderAll(){
    renderWallet();
    renderCapacity();
    renderList();
    renderCart();
    const btnConfirm = $("#btnConfirmShop");
    const btnSkip = $("#btnSkipShop");
    if (btnConfirm) btnConfirm.disabled = shopLocked;
    if (btnSkip) btnSkip.disabled = shopLocked;
  }

  function changeQty(item, delta){
    if (shopLocked) return;
    const current = cart[item.id] || 0;
    const next = Math.max(0, current + delta);
    if (delta > 0){
      const cost = itemUnitCopper(item);
      if (remainingCopper() - cost < 0) return; // sem saldo suficiente
    }
    if (next === 0) delete cart[item.id];
    else cart[item.id] = next;
    renderAll();
  }

  // ====================== Confirmação da compra ======================
  function buildGearFromCart(){
    const gear = [];
    const ledger = [];
    catalog.forEach(item => {
      const qty = cart[item.id] || 0;
      if (qty <= 0) return;
      const totalCost = item.cost * qty;
      const totalSlots = item.slots * qty;
      const instanceId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
      gear.push({
        instanceId,
        gearId: item.id,
        name: item.name,
        type: item.type === "weapon" ? "weapon" : (item.type === "armor" ? "armor" : (item.type === "potion" ? "potion" : "sundry")),
        quantity: qty,
        totalUnits: qty,
        slots: totalSlots,
        cost: totalCost,
        currency: item.currency
      });
      const change = { goldChange: 0, silverChange: 0, copperChange: 0 };
      if (item.currency === "gp") change.goldChange = -totalCost;
      else if (item.currency === "sp") change.silverChange = -totalCost;
      else change.copperChange = -totalCost;
      ledger.push({
        ...change,
        desc: `Compra: ${item.name}${qty > 1 ? ` (x${qty})` : ""}`,
        notes: ""
      });
    });
    return { gear, ledger };
  }

  function lockShopUI(){
    shopLocked = true;
    renderAll();
  }

  function finishShop(){
    const { gear, ledger } = buildGearFromCart();
    const rem = fromCopper(remainingCopper());
    state.gold = rem.gp;
    state.silver = rem.sp;
    state.copper = rem.cp;
    state.shopGear = gear;
    state.shopLedger = ledger;

    const goldOut = $("#goldOut");
    if (goldOut){
      goldOut.style.display = "";
      goldOut.textContent = `Ouro restante após compras: ${formatMoney(rem.gp, rem.sp, rem.cp)}`;
    }

    lockShopUI();

    if (typeof window.app.goToName === "function"){
      window.app.goToName();
    } else {
      const stepFinal = document.getElementById("stepFinal");
      if (stepFinal){
        stepFinal.style.display = "";
        stepFinal.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // ====================== Navegação ======================
  async function goToShop(){
    const step = $("#stepShop");
    if (!step) {
      // Fallback: se a seção não existir por algum motivo, pula direto pro Nome
      if (typeof window.app.goToName === "function") window.app.goToName();
      return;
    }
    step.style.display = "";

    if (!shopLocked){
      if (!catalog.length) await loadCatalog();
      renderTabs();
      renderAll();
    }

    step.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btnConfirm = $("#btnConfirmShop");
    const btnSkip = $("#btnSkipShop");
    if (btnConfirm){
      btnConfirm.addEventListener("click", () => {
        if (shopLocked) return;
        try { showCheck?.(btnConfirm); } catch {}
        finishShop();
      });
    }
    if (btnSkip){
      btnSkip.addEventListener("click", () => {
        if (shopLocked) return;
        cart = {};
        try { showCheck?.(btnSkip); } catch {}
        finishShop();
      });
    }
  });

  window.app.goToShop = goToShop;
})();

