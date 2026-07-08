(function () {
  "use strict";

  var state = {
    filter: "all",
    tag: "all",
    current: null,
    lastIndex: -1
  };

  var el = {
    card: document.getElementById("card"),
    badge: document.getElementById("card-badge"),
    text: document.getElementById("card-text"),
    source: document.getElementById("card-source"),
    watermark: document.querySelector(".card-watermark"),
    toast: document.getElementById("toast"),
    btnNew: document.getElementById("btn-new"),
    btnImage: document.getElementById("btn-image"),
    btnCopy: document.getElementById("btn-copy"),
    btnShare: document.getElementById("btn-share"),
    btnFav: document.getElementById("btn-fav"),
    filterBtns: document.querySelectorAll(".filter-btn"),
    tagBtns: document.querySelectorAll(".tag-btn"),
    bgColorInput: document.getElementById("bg-color-input"),
    textColorInput: document.getElementById("text-color-input"),
    btnResetColor: document.getElementById("btn-reset-color"),
    sizeSelect: document.getElementById("size-select"),
    year: document.getElementById("year")
  };

  var BADGE_LABEL = { bible: "성경구절", quote: "명언", idiom: "사자성어" };
  var FAV_KEY = "favoriteIds";
  var STYLE_KEY = "cardStyle";
  var SIZE_KEY = "cardSizePref";
  var DEFAULT_BG = "#ffffff";
  var DEFAULT_TEXT = "#2b2b2b";

  var SIZE_PRESETS = {
    default: null,
    kakao: { width: 1000, height: 1000, label: "카카오톡 프로필" },
    instagram: { width: 1080, height: 1080, label: "인스타그램 게시물" },
    instagram_story: { width: 1080, height: 1920, label: "인스타그램 스토리" }
  };

  var style = { bg: DEFAULT_BG, text: DEFAULT_TEXT };

  function loadStyle() {
    try {
      var raw = localStorage.getItem(STYLE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved.bg) style.bg = saved.bg;
        if (saved.text) style.text = saved.text;
      }
    } catch (e) {}
  }

  function saveStyle() {
    try {
      localStorage.setItem(STYLE_KEY, JSON.stringify(style));
    } catch (e) {}
  }

  function loadSizePref() {
    try {
      return localStorage.getItem(SIZE_KEY) || "default";
    } catch (e) {
      return "default";
    }
  }

  function saveSizePref(value) {
    try {
      localStorage.setItem(SIZE_KEY, value);
    } catch (e) {}
  }

  function hexLuminance(hex) {
    var c = String(hex).replace("#", "");
    if (c.length === 3) {
      c = c.split("").map(function (ch) { return ch + ch; }).join("");
    }
    var r = parseInt(c.substr(0, 2), 16);
    var g = parseInt(c.substr(2, 2), 16);
    var b = parseInt(c.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 1;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function applyCardColors() {
    el.card.style.background = style.bg;
    el.text.style.color = style.text;
    el.source.style.color = style.text;
    el.source.style.opacity = "0.7";
    if (el.watermark) {
      el.watermark.style.color = style.text;
      el.watermark.style.opacity = "0.35";
    }
    var light = hexLuminance(style.bg) > 0.6;
    el.badge.style.background = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)";
    el.badge.style.color = style.text;
    if (el.bgColorInput) el.bgColorInput.value = style.bg;
    if (el.textColorInput) el.textColorInput.value = style.text;
  }

  function getFavoriteIds() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setFavoriteIds(ids) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
    } catch (e) {
      // localStorage 사용 불가 (프라이빗 모드 등) - 조용히 무시
    }
  }

  function isFavorited(id) {
    return getFavoriteIds().indexOf(id) !== -1;
  }

  function toggleFavorite(id) {
    var ids = getFavoriteIds();
    var idx = ids.indexOf(id);
    if (idx === -1) {
      ids.push(id);
    } else {
      ids.splice(idx, 1);
    }
    setFavoriteIds(ids);
    return ids.indexOf(id) !== -1;
  }

  function updateFavButton() {
    if (!el.btnFav) return;
    if (!state.current) {
      el.btnFav.classList.remove("is-active");
      el.btnFav.textContent = "♡";
      el.btnFav.setAttribute("aria-pressed", "false");
      return;
    }
    var active = isFavorited(state.current.id);
    el.btnFav.classList.toggle("is-active", active);
    el.btnFav.textContent = active ? "♥" : "♡";
    el.btnFav.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function getFilteredList() {
    return CONTENT_DATA.filter(function (item) {
      var matchType = state.filter === "all" || item.type === state.filter;
      var matchTag = state.tag === "all" || (item.tags && item.tags.indexOf(state.tag) !== -1);
      return matchType && matchTag;
    });
  }

  function pickRandom() {
    var list = getFilteredList();
    if (list.length === 0) return null;
    var idx;
    if (list.length === 1) {
      idx = 0;
    } else {
      do {
        idx = Math.floor(Math.random() * list.length);
      } while (idx === state.lastIndex);
    }
    state.lastIndex = idx;
    return list[idx];
  }

  function renderItem(item, animate) {
    if (!item) {
      state.current = null;
      el.badge.textContent = "";
      el.text.textContent = "선택하신 조합에 맞는 문장이 아직 없어요.";
      el.source.textContent = "다른 카테고리나 태그를 선택해보세요.";
      updateFavButton();
      return;
    }
    state.current = item;

    function apply() {
      el.badge.textContent = BADGE_LABEL[item.type] || "";
      el.text.textContent = item.text;
      el.source.textContent = "— " + item.source;
      updateFavButton();
    }

    if (animate) {
      el.card.classList.add("is-fading");
      window.setTimeout(function () {
        apply();
        el.card.classList.remove("is-fading");
      }, 180);
    } else {
      apply();
    }
  }

  function showNew() {
    var item = pickRandom();
    renderItem(item, true);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      el.toast.classList.remove("is-visible");
    }, 2200);
  }

  function setFilter(filter) {
    state.filter = filter;
    el.filterBtns.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-filter") === filter);
    });
    state.lastIndex = -1;
    showNew();
  }

  function setTag(tag) {
    state.tag = tag;
    el.tagBtns.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tag") === tag);
    });
    state.lastIndex = -1;
    showNew();
  }

  function getShareText() {
    if (!state.current) return "";
    return state.current.text + " (" + state.current.source + ")\n\n당신을 위한 한마디에서 더 만나보세요.";
  }

  function copyText() {
    var text = getShareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("텍스트가 복사되었습니다.");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("텍스트가 복사되었습니다.");
    } catch (e) {
      showToast("복사에 실패했습니다.");
    }
    document.body.removeChild(ta);
  }

  function generateCardImage() {
    if (typeof html2canvas === "undefined") {
      return Promise.reject(new Error("html2canvas not loaded"));
    }
    return html2canvas(el.card, {
      backgroundColor: style.bg,
      scale: 2
    });
  }

  function buildExportNode(preset) {
    var wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.left = "-99999px";
    wrap.style.top = "0";
    wrap.style.width = preset.width + "px";
    wrap.style.height = preset.height + "px";
    wrap.style.background = style.bg;
    wrap.style.fontFamily = '"Noto Serif KR", "Noto Sans KR", sans-serif';

    var inner = document.createElement("div");
    inner.style.position = "relative";
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.boxSizing = "border-box";
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.alignItems = "center";
    inner.style.justifyContent = "center";
    inner.style.textAlign = "center";
    inner.style.padding = Math.round(preset.width * 0.12) + "px";

    var light = hexLuminance(style.bg) > 0.6;
    var item = state.current;

    var badge = document.createElement("div");
    badge.textContent = BADGE_LABEL[item.type] || "";
    badge.style.fontSize = Math.round(preset.width * 0.022) + "px";
    badge.style.padding = Math.round(preset.width * 0.012) + "px " + Math.round(preset.width * 0.03) + "px";
    badge.style.borderRadius = "999px";
    badge.style.marginBottom = Math.round(preset.width * 0.045) + "px";
    badge.style.background = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)";
    badge.style.color = style.text;
    badge.style.letterSpacing = "0.05em";

    var text = document.createElement("p");
    text.textContent = item.text;
    text.style.fontFamily = '"Noto Serif KR", serif';
    text.style.fontWeight = "500";
    text.style.fontSize = Math.round(preset.width * (item.text.length > 40 ? 0.042 : 0.052)) + "px";
    text.style.lineHeight = "1.6";
    text.style.color = style.text;
    text.style.margin = "0 0 " + Math.round(preset.width * 0.03) + "px";
    text.style.wordBreak = "keep-all";

    var source = document.createElement("p");
    source.textContent = "— " + item.source;
    source.style.fontSize = Math.round(preset.width * 0.024) + "px";
    source.style.color = style.text;
    source.style.opacity = "0.7";
    source.style.margin = "0";

    var watermark = document.createElement("p");
    watermark.textContent = "당신을 위한 한마디";
    watermark.style.position = "absolute";
    watermark.style.bottom = Math.round(preset.width * 0.03) + "px";
    watermark.style.right = Math.round(preset.width * 0.035) + "px";
    watermark.style.fontSize = Math.round(preset.width * 0.016) + "px";
    watermark.style.color = style.text;
    watermark.style.opacity = "0.35";
    watermark.style.margin = "0";
    watermark.style.letterSpacing = "0.05em";

    inner.appendChild(badge);
    inner.appendChild(text);
    inner.appendChild(source);
    inner.appendChild(watermark);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
    return wrap;
  }

  function generateExportImage() {
    var presetKey = el.sizeSelect ? el.sizeSelect.value : "default";
    var preset = SIZE_PRESETS[presetKey];
    if (!preset) {
      return generateCardImage().then(function (canvas) {
        return { canvas: canvas, presetKey: presetKey };
      });
    }
    if (typeof html2canvas === "undefined") {
      return Promise.reject(new Error("html2canvas not loaded"));
    }
    var node = buildExportNode(preset);
    return html2canvas(node, { backgroundColor: style.bg, scale: 1 }).then(function (canvas) {
      document.body.removeChild(node);
      return { canvas: canvas, presetKey: presetKey };
    }).catch(function (err) {
      document.body.removeChild(node);
      throw err;
    });
  }

  function downloadImage() {
    if (!state.current) {
      showToast("저장할 문장이 없습니다.");
      return;
    }
    el.btnImage.disabled = true;
    el.btnImage.textContent = "생성 중...";
    generateExportImage().then(function (result) {
      var suffix = result.presetKey === "default" ? "" : "_" + result.presetKey;
      var link = document.createElement("a");
      link.download = "당신을위한한마디" + suffix + ".png";
      link.href = result.canvas.toDataURL("image/png");
      link.click();
      showToast("이미지가 저장되었습니다.");
    }).catch(function () {
      showToast("이미지 생성에 실패했습니다.");
    }).finally(function () {
      el.btnImage.disabled = false;
      el.btnImage.textContent = "이미지로 저장";
    });
  }

  function shareCard() {
    if (!state.current) {
      showToast("공유할 문장이 없습니다.");
      return;
    }
    var shareText = getShareText();
    var shareUrl = window.location.href;

    // 1) 이미지 파일 공유 지원 시 (모바일 브라우저 대부분)
    if (navigator.share && navigator.canShare) {
      el.btnShare.disabled = true;
      generateExportImage().then(function (result) {
        return new Promise(function (resolve) {
          result.canvas.toBlob(resolve, "image/png");
        });
      }).then(function (blob) {
        if (!blob) throw new Error("no blob");
        var file = new File([blob], "당신을위한한마디.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          return navigator.share({
            files: [file],
            title: "당신을 위한 한마디",
            text: shareText
          });
        }
        throw new Error("cannot share files");
      }).catch(function () {
        // 이미지 공유 실패 시 텍스트/링크 공유로 대체
        if (navigator.share) {
          navigator.share({ title: "당신을 위한 한마디", text: shareText, url: shareUrl }).catch(function () {});
        } else {
          copyText();
        }
      }).finally(function () {
        el.btnShare.disabled = false;
      });
      return;
    }

    // 2) Web Share API (텍스트만)
    if (navigator.share) {
      navigator.share({ title: "당신을 위한 한마디", text: shareText, url: shareUrl }).catch(function () {});
      return;
    }

    // 3) 폴백: 클립보드 복사
    copyText();
  }

  el.btnNew.addEventListener("click", showNew);
  el.btnImage.addEventListener("click", downloadImage);
  el.btnCopy.addEventListener("click", copyText);
  el.btnShare.addEventListener("click", shareCard);

  if (el.btnFav) {
    el.btnFav.addEventListener("click", function () {
      if (!state.current) return;
      var active = toggleFavorite(state.current.id);
      updateFavButton();
      showToast(active ? "즐겨찾기에 추가했습니다." : "즐겨찾기에서 제거했습니다.");
    });
  }

  el.filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFilter(btn.getAttribute("data-filter"));
    });
  });

  el.tagBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTag(btn.getAttribute("data-tag"));
    });
  });

  if (el.bgColorInput) {
    el.bgColorInput.addEventListener("input", function () {
      style.bg = el.bgColorInput.value;
      applyCardColors();
      saveStyle();
    });
  }

  if (el.textColorInput) {
    el.textColorInput.addEventListener("input", function () {
      style.text = el.textColorInput.value;
      applyCardColors();
      saveStyle();
    });
  }

  if (el.btnResetColor) {
    el.btnResetColor.addEventListener("click", function () {
      style.bg = DEFAULT_BG;
      style.text = DEFAULT_TEXT;
      applyCardColors();
      saveStyle();
      showToast("색상을 기본값으로 되돌렸습니다.");
    });
  }

  if (el.sizeSelect) {
    el.sizeSelect.value = loadSizePref();
    el.sizeSelect.addEventListener("change", function () {
      saveSizePref(el.sizeSelect.value);
    });
  }

  if (el.year) {
    el.year.textContent = new Date().getFullYear();
  }

  // 초기 렌더링
  loadStyle();
  applyCardColors();
  showNew();
})();
