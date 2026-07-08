// 쿠키/광고 고지 배너
// 참고: 이 배너는 투명성 고지용 기본 배너입니다.
// EEA(유럽경제지역)·영국·스위스 이용자에게 실제로 맞춤 광고를 게재하려면
// Google 인증 CMP(예: Google Funding Choices)를 별도로 연동해야
// Google의 EU 이용자 동의 정책을 충족할 수 있습니다.
(function () {
  "use strict";

  var KEY = "cookieConsentAck";

  try {
    if (localStorage.getItem(KEY)) return;
  } catch (e) {}

  function init() {
    var bar = document.createElement("div");
    bar.id = "cookie-consent-bar";
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;background:#2b2b2b;color:#fff;padding:14px 18px;font-size:13px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;z-index:9999;font-family:'Noto Sans KR',sans-serif;box-shadow:0 -6px 20px rgba(0,0,0,0.15);";

    var text = document.createElement("span");
    text.innerHTML = '이 사이트는 광고 제공을 위해 쿠키를 사용할 수 있습니다. 자세한 내용은 <a href="/privacy.html" style="color:#f0d9a0;">개인정보처리방침</a>에서 확인하세요.';

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "확인";
    btn.style.cssText = "background:#b08d57;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit;white-space:nowrap;";
    btn.addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      bar.remove();
    });

    bar.appendChild(text);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
