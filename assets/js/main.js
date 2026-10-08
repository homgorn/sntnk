/* Syntonik — интерактив сайта: меню, калькулятор экономии, вкладки каталога */
(function () {
  "use strict";

  /* ---------- Мобильное меню ---------- */
  var header = document.querySelector(".site-header");
  var burger = document.querySelector(".burger");
  if (header && burger) {
    burger.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("is-open") && !header.contains(e.target)) {
        header.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Вкладки топлива ---------- */
  function initTabs(root) {
    var tabs = root.querySelectorAll(".tab");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        var fuel = tab.getAttribute("data-fuel") || "gasoline";
        root.setAttribute("data-active-fuel", fuel);
        root.querySelectorAll("[data-fuel-img]").forEach(function (img) {
          var vol = img.getAttribute("data-vol");
          var next = img.getAttribute("data-fuel-img").replace("{fuel}", fuel);
          img.onerror = function () {
            img.onerror = null;
            img.src = img.getAttribute("data-fallback");
          };
          img.src = next;
          img.alt = "Syntonik, топливо: " + tab.textContent.trim() + ", объём " + vol;
        });
        document.dispatchEvent(new CustomEvent("fuelchange", { detail: { fuel: fuel, root: root } }));
      });
    });
  }
  document.querySelectorAll("[data-tabs]").forEach(initTabs);

  /* ---------- Калькулятор экономии ---------- */
  var calc = document.querySelector("[data-calc]");
  if (calc) {
    var FUEL = {
      gasoline: { label: "Бензин", price: 80.6, dose: 2.2 },
      diesel: { label: "Дизель", price: 88, dose: 2.2 },
      mazut: { label: "Мазут", price: 60, dose: 4.4 },
      gbo: { label: "ГБО", price: 45, dose: 2.2 }
    };
    var state = { fuel: "gasoline", cut: 25 };

    var inRoad = calc.querySelector("#calc-road");
    var inUse = calc.querySelector("#calc-use");
    var inPrice = calc.querySelector("#calc-price");
    var outMonth = calc.querySelector("#out-month");
    var outYear = calc.querySelector("#out-year");
    var outBefore = calc.querySelector("#out-before");
    var outAfter = calc.querySelector("#out-after");
    var outLiters = calc.querySelector("#out-liters");
    var outCost = calc.querySelector("#out-cost");

    function num(el, fallback) {
      var v = parseFloat(String(el && el.value || "").replace(",", "."));
      return isFinite(v) && v > 0 ? v : fallback;
    }
    function fmt(n) {
      return Math.round(n).toLocaleString("ru-RU");
    }
    function calcAll() {
      var road = num(inRoad, 1000);
      var use = num(inUse, 10);
      var price = num(inPrice, FUEL[state.fuel].price);
      var litersBefore = road * use / 100;
      var litersAfter = litersBefore * (1 - state.cut / 100);
      var saved = litersBefore - litersAfter;
      var addCost = litersAfter * FUEL[state.fuel].dose; /* дозировка на фактический расход */
      var economy = saved * price - addCost;
      if (outMonth) outMonth.textContent = fmt(economy) + " ₽";
      if (outYear) outYear.textContent = fmt(economy * 12) + " ₽";
      if (outBefore) outBefore.textContent = fmt(litersBefore) + " л";
      if (outAfter) outAfter.textContent = fmt(litersAfter) + " л";
      if (outLiters) outLiters.textContent = fmt(saved) + " л";
      if (outCost) outCost.textContent = fmt(addCost) + " ₽";
    }

    calc.querySelectorAll(".tab[data-fuel]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.fuel = tab.getAttribute("data-fuel");
        if (inPrice && document.activeElement !== inPrice) {
          inPrice.value = FUEL[state.fuel].price.toFixed(2).replace(".", ",");
        }
        calcAll();
      });
    });
    calc.querySelectorAll("input[name='cut']").forEach(function (r) {
      r.addEventListener("change", function () {
        state.cut = parseFloat(r.value);
        calcAll();
      });
    });
    [inRoad, inUse, inPrice].forEach(function (el) {
      if (el) { el.addEventListener("input", calcAll); }
    });
    document.addEventListener("fuelchange", function () { calcAll(); });
    calcAll();
  }

  /* ---------- Ленивая загрузка Telegram-виджетов ---------- */
  var embeds = document.querySelectorAll("[data-tg-embed]");
  if (embeds.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var post = el.getAttribute("data-tg-embed");
        var s = document.createElement("script");
        s.async = true;
        s.src = "https://telegram.org/js/telegram-widget.js?22";
        s.setAttribute("data-telegram-post", post);
        s.setAttribute("data-width", "100%");
        s.setAttribute("data-userpic", "false");
        el.appendChild(s);
      });
    }, { rootMargin: "300px" });
    embeds.forEach(function (el) { io.observe(el); });
  }
})();
