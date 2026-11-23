(function () {
  "use strict";
  // WhatsApp do consultório (DDI + DDD + número, só dígitos)
  const WHATSAPP = "5519989385757";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------------- UI geral ---------------- */
  $("#year").textContent = new Date().getFullYear();

  const header = $(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const nav = $("#nav"), toggle = $("#menuToggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  if ("IntersectionObserver" in window) {
    const sections = ["sobre", "especialidades", "casos", "agendamento", "localizacao"].map(id => document.getElementById(id));
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          $$("#nav a:not(.btn)").forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => s && navObs.observe(s));

    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); revObs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(el => revObs.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("is-in"));
  }

  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-show"), 3200);
  }

  // Máscara de telefone
  function maskPhone(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length <= 2) return v.length ? "(" + v : v;
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  }
  $$('input[type="tel"]').forEach(i => i.addEventListener("input", () => { i.value = maskPhone(i.value); }));

  /* ---------------- Antes e depois ---------------- */
  const ba = $("#ba");
  if (ba) {
    const range = $(".ba__range", ba);
    range.addEventListener("input", () => ba.style.setProperty("--pos", range.value + "%"));
  }

  /* ---------------- Galeria + lightbox ---------------- */
  const lb = $("#lightbox");
  const items = $$("#gallery .gallery__item");
  let lbIdx = 0;
  function showLb(i) {
    lbIdx = (i + items.length) % items.length;
    const img = $("img", items[lbIdx]);
    $("img", lb).src = img.src;
    $("img", lb).alt = img.alt;
    $("figcaption", lb).textContent = $("figcaption", items[lbIdx]).textContent;
  }
  if (lb && lb.showModal) {
    items.forEach((it, i) => it.addEventListener("click", () => { showLb(i); lb.showModal(); }));
    $(".lightbox__close", lb).addEventListener("click", () => lb.close());
    $(".lightbox__nav--prev", lb).addEventListener("click", () => showLb(lbIdx - 1));
    $(".lightbox__nav--next", lb).addEventListener("click", () => showLb(lbIdx + 1));
    lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") showLb(lbIdx - 1);
      if (e.key === "ArrowRight") showLb(lbIdx + 1);
    });
  }

  /* ---------------- Vídeo do Dr. Paulo ---------------- */
  const vid = $("#drVideo"), vPlay = $("#vPlay");
  if (vid && vPlay) {
    const card = vid.closest(".vcard");
    vPlay.addEventListener("click", () => {
      vid.currentTime = 0;
      vid.controls = true;
      vid.play();
      card.classList.add("is-playing");
    });
    vid.addEventListener("ended", () => { card.classList.remove("is-playing"); vid.controls = false; vid.currentTime = 0.6; });
  }

  /* ---------------- Formulário → WhatsApp ---------------- */
  const form = $("#bookForm");
  const preview = $("#waPreview");

  function readForm() {
    const fd = new FormData(form);
    const dias = fd.getAll("dias");
    return {
      nome: (fd.get("nome") || "").trim(),
      telefone: (fd.get("telefone") || "").trim(),
      servico: fd.get("servico") || "Avaliação / Consulta",
      dias: dias.length ? dias.join(", ") : "Qualquer dia (seg. a sex.)",
      periodo: fd.get("periodo") || "Qualquer horário",
      primeira: fd.get("primeira") === "Não" ? "Não, já sou paciente" : "Sim",
      obs: (fd.get("obs") || "").trim()
    };
  }

  // Mensagem final (texto puro, com negrito do WhatsApp)
  function buildMessage(d) {
    const lines = [
      `Olá, Dr. Paulo! Gostaria de agendar uma consulta.`,
      ``,
      `*Nome:* ${d.nome || "-"}`,
      `*Telefone:* ${d.telefone || "-"}`,
      `*Especialidade:* ${d.servico}`,
      `*Dias de preferência:* ${d.dias}`,
      `*Período:* ${d.periodo}`,
      `*Primeira consulta:* ${d.primeira}`
    ];
    if (d.obs) lines.push(`*Motivo:* ${d.obs}`);
    lines.push(``, `(Enviado pelo site)`);
    return lines.join("\n");
  }

  const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function renderPreview() {
    const d = readForm();
    const html = esc(buildMessage({ ...d, nome: d.nome || "Seu nome", telefone: d.telefone || "(19) 9____-____" }))
      .replace(/\*(.+?)\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
    const now = new Date();
    preview.innerHTML = html + `<span class="wa-bubble__time">${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ✓✓</span>`;
  }

  if (form) {
    form.addEventListener("input", renderPreview);
    form.addEventListener("change", renderPreview);
    renderPreview();

    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = readForm();
      const err = $("#formError");
      $$(".field", form).forEach(f => f.classList.remove("is-invalid"));
      if (d.nome.length < 3) {
        err.textContent = "Informe seu nome completo.";
        form.nome.closest(".field").classList.add("is-invalid"); form.nome.focus(); return;
      }
      if (d.telefone.replace(/\D/g, "").length < 10) {
        err.textContent = "Informe um telefone válido com DDD.";
        form.telefone.closest(".field").classList.add("is-invalid"); form.telefone.focus(); return;
      }
      err.textContent = "";
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage(d))}`;
      window.open(url, "_blank", "noopener");
      toast("Abrindo o WhatsApp com a sua mensagem…");
    });
  }

  function setServico(val) {
    const r = form && $$('input[name="servico"]', form).find(i => i.value === val);
    if (r) { r.checked = true; renderPreview(); }
  }

  // Barra rápida do topo → pré-preenche o formulário
  $("#quickbar").addEventListener("submit", e => {
    e.preventDefault();
    const q = new FormData(e.target);
    if (q.get("nome")) form.nome.value = q.get("nome");
    if (q.get("telefone")) form.telefone.value = q.get("telefone");
    setServico(q.get("servico"));
    renderPreview();
    $("#agendamento").scrollIntoView({ behavior: "smooth" });
    toast("Agora escolha o dia e o período 📅");
  });

  // Links dos cards → seleciona a especialidade
  $$("[data-servico]").forEach(a => a.addEventListener("click", () => setServico(a.dataset.servico)));
})();
