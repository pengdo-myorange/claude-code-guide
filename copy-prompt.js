(function () {
  "use strict";

  /* HTML 소스 들여쓰기 제거 */
  function dedent(text) {
    var lines = text.replace(/\r\n/g, "\n").split("\n");
    var minIndent = Infinity;
    lines.forEach(function (line) {
      if (line.trim().length === 0) return;
      var m = line.match(/^(\s*)/);
      if (m && m[1].length < minIndent) minIndent = m[1].length;
    });
    if (!isFinite(minIndent)) minIndent = 0;
    return lines.map(function (l) { return l.slice(minIndent); }).join("\n").trim();
  }

  /* badge 주입 + 텍스트 정규화 */
  function injectBadges() {
    document.querySelectorAll(".prompt-box").forEach(function (el) {
      if (el.querySelector(".copy-badge")) return;
      var raw = el.textContent || "";
      var clean = dedent(raw);
      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(document.createTextNode(clean));
      var b = document.createElement("span");
      b.className = "copy-badge";
      b.setAttribute("aria-hidden", "true");
      b.textContent = "복사";
      el.appendChild(b);
    });
  }

  function getText(el) {
    /* 텍스트 노드만 (badge span 제외) */
    var text = "";
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) text += n.textContent;
    });
    return text.replace(/\u00a0/g, " ").trim();
  }

  function getBadge(el) {
    return el.querySelector(".copy-badge");
  }

  function flash(el, ok) {
    var badge = getBadge(el);
    el.classList.remove("copied", "copy-fail");
    el.classList.add(ok ? "copied" : "copy-fail");
    if (badge) badge.textContent = ok ? "복사됨 ✓" : "실패";
    window.clearTimeout(el._copyT);
    el._copyT = window.setTimeout(function () {
      el.classList.remove("copied", "copy-fail");
      if (badge) badge.textContent = "복사";
    }, 1800);
  }

  function copyFrom(el) {
    var text = getText(el);
    if (!text) return;
    function done(ok) { flash(el, ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
      return;
    }
    done(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { return document.execCommand("copy"); }
    catch (e) { return false; }
    finally { document.body.removeChild(ta); }
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest(".prompt-box");
    if (!el) return;
    copyFrom(el);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest(".prompt-box");
    if (!el) return;
    e.preventDefault();
    copyFrom(el);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBadges);
  } else {
    injectBadges();
  }
})();
