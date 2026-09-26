(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  var canSpeak = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  var say = function (text) {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text + ".");
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  var tilesEl = document.getElementById("tiles");
  if (tilesEl) {
    var word = (tilesEl.getAttribute("data-word") || "").toLowerCase();
    var tiles = Array.prototype.slice.call(tilesEl.querySelectorAll(".tile"));
    var status = document.getElementById("tiles-status");
    var blank = document.getElementById("example-blank");
    var btnReveal = document.getElementById("btn-reveal");
    var btnHint = document.getElementById("btn-hint");
    var btnHear = document.getElementById("btn-hear");
    var form = document.getElementById("try-form");
    var input = document.getElementById("try-input");
    var feedback = document.getElementById("try-feedback");

    var shown = function () {
      return tiles.filter(function (t) { return !t.classList.contains("is-hidden"); }).length;
    };

    var describe = function () {
      var letters = tiles.map(function (t, i) {
        return t.classList.contains("is-hidden") ? "blank" : word.charAt(i);
      });
      var n = shown();
      if (n === tiles.length) return "Letters shown: " + word.split("").join(", ") + ".";
      if (n === 0) return "Letters hidden. The word has " + word.length + " letters.";
      return "Letters so far: " + letters.join(", ") + ".";
    };

    var sync = function () {
      var all = shown() === tiles.length;
      btnReveal.textContent = all ? "Hide letters" : "Reveal letters";
      btnReveal.setAttribute("aria-pressed", all ? "true" : "false");
      btnHint.disabled = all;
      if (blank) {
        blank.classList.toggle("is-blank", !all);
        blank.setAttribute("aria-label", all ? word : "blank");
      }
      if (status) status.textContent = describe();
    };

    var clearMarks = function () {
      tilesEl.classList.remove("is-solved");
      tiles.forEach(function (t) { t.classList.remove("is-match", "is-miss"); });
    };

    var setAll = function (reveal, stagger) {
      tiles.forEach(function (t, i) {
        var apply = function () { t.classList.toggle("is-hidden", !reveal); };
        if (stagger) setTimeout(apply, i * 70); else apply();
      });
      setTimeout(sync, stagger ? tiles.length * 70 : 0);
      sync();
    };

    setAll(false, false);

    btnReveal.addEventListener("click", function () {
      var revealAll = shown() !== tiles.length;
      clearMarks();
      feedback.textContent = "";
      feedback.className = "wc-feedback";
      setAll(revealAll, true);
    });

    btnHint.addEventListener("click", function () {
      var next = tiles.filter(function (t) { return t.classList.contains("is-hidden"); })[0];
      if (!next) return;
      next.classList.remove("is-hidden", "is-miss");
      sync();
      var left = tiles.length - shown();
      feedback.className = "wc-feedback";
      feedback.textContent = left
        ? "Here's a letter. " + left + " still hidden."
        : "That's every letter — now try typing it from memory.";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var guess = (input.value || "").toLowerCase().replace(/[^a-z]/g, "");
      clearMarks();

      if (!guess) {
        feedback.className = "wc-feedback is-bad";
        feedback.textContent = "Type your best guess first — no pressure.";
        input.focus();
        return;
      }

      if (guess === word) {
        tilesEl.classList.add("is-solved");
        setAll(true, true);
        feedback.className = "wc-feedback is-good";
        feedback.textContent = "Spot on. Two r's, two s's — you've got it.";
        return;
      }

      var hits = 0;
      tiles.forEach(function (t, i) {
        if (guess.charAt(i) === word.charAt(i)) {
          hits++;
          t.classList.remove("is-hidden");
          t.classList.add("is-match");
        } else {
          t.classList.add("is-hidden");

          void t.offsetWidth;
          t.classList.add("is-miss");
        }
      });
      sync();

      var msg = "Not quite — " + hits + " of " + word.length + " letters are in the right spot.";
      if (guess.length !== word.length) {
        msg += " (The word has " + word.length + " letters; you typed " + guess.length + ".)";
      } else {
        msg += " Look closely at the doubles.";
      }
      feedback.className = "wc-feedback is-bad";
      feedback.textContent = msg;
    });

    if (btnHear && canSpeak) {
      btnHear.hidden = false;
      btnHear.addEventListener("click", function () { say(word); });
    }
  }

  var testForm = document.getElementById("test-form");
  if (testForm) {
    var rows = Array.prototype.slice.call(testForm.querySelectorAll(".test-row"));
    var score = document.getElementById("test-score");

    if (canSpeak) {
      Array.prototype.forEach.call(testForm.querySelectorAll(".speak"), function (b) {
        b.hidden = false;
        b.addEventListener("click", function () { say(b.getAttribute("data-say")); });
      });
    }

    var clearRow = function (row) {
      row.classList.remove("is-right", "is-wrong");
      row.querySelector(".test-fix").textContent = "";
    };

    testForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var right = 0, answered = 0;
      rows.forEach(function (row) {
        var inp = row.querySelector("input");
        var answer = inp.getAttribute("data-answer");
        var guess = (inp.value || "").trim().toLowerCase();
        var fix = row.querySelector(".test-fix");
        clearRow(row);
        if (guess) answered++;
        if (guess === answer) {
          right++;
          row.classList.add("is-right");
        } else {
          row.classList.add("is-wrong");
          fix.innerHTML = (guess ? "Nearly! It's spelled " : "Correct spelling: ") + "<b>" + answer + "</b>";
        }
      });

      if (!answered) {
        rows.forEach(clearRow);
        score.innerHTML = '<span class="score-msg">Have a go at a few words first, then mark your test.</span>';
        rows[0].querySelector("input").focus();
        return;
      }

      var msg;
      if (right === rows.length) msg = "Full marks! Every word spelled right.";
      else if (right >= rows.length - 2) msg = "Great work. Check the red corrections and try again.";
      else if (right >= 3) msg = "Good start. Read the corrections, then have another go.";
      else msg = "Tricky week! Look at the archive tips, then try again.";
      score.innerHTML = '<span class="score-ring">' + right + "/" + rows.length + '</span><span class="score-msg">' + msg + "</span>";
    });

    testForm.addEventListener("reset", function () {
      rows.forEach(clearRow);
      score.innerHTML = "";
    });

    rows.forEach(function (row) {
      row.querySelector("input").addEventListener("input", function () { clearRow(row); });
    });
  }

  var signup = document.getElementById("signup-form");
  if (signup) {
    var email = document.getElementById("signup-email");
    var note = document.getElementById("signup-note");
    var original = note ? note.innerHTML : "";
    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = (email.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!ok) {
        email.setAttribute("aria-invalid", "true");
        note.className = "form-note is-error";
        note.textContent = "That email address doesn't look quite right — mind checking the spelling?";
        email.focus();
        return;
      }
      email.removeAttribute("aria-invalid");
      note.className = "form-note is-thanks";
      note.textContent = "Thanks, you're on the list. Your first email arrives tomorrow morning.";
      signup.reset();
    });
    email.addEventListener("input", function () {
      if (email.getAttribute("aria-invalid")) {
        email.removeAttribute("aria-invalid");
        note.className = "form-note";
        note.innerHTML = original;
      }
    });
  }
})();
