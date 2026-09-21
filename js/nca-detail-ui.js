// =========================================================
// e-NCA - NCA Detail (UI helpers)
//
// Presentation only. nca-detail.js keeps loading the data;
// this file formats what it renders (status pills, workflow
// labels), fills the header avatar and drives the user menu.
// =========================================================

const ACRONYMS = new Set(["QC", "QA", "PE", "NCA", "PIC"]);

const $ = id => document.getElementById(id);


// ---------------------------------------------------------
// FORMAT HELPERS
// ---------------------------------------------------------

function norm(value) {

    return String(value ?? "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}


function labelOf(value) {

    const key = norm(value);

    if (!key || key === "-") return "-";

    return key
        .split(" ")
        .map(word =>
            ACRONYMS.has(word)
                ? word
                : word.charAt(0) + word.slice(1).toLowerCase()
        )
        .join(" ");
}


function toneOf(value) {

    const key = norm(value);

    if (!key || key === "-") return "neutral";
    if (/REJECT|CANCEL|FAIL/.test(key)) return "danger";
    if (/WAIT|PENDING|REVIEW|PROGRESS|SUBMIT/.test(key)) return "info";
    if (/CLOSE|COMPLETE|APPROVED|DONE/.test(key)) return "ok";
    if (/HOLD/.test(key)) return "warn";
    if (/DRAFT/.test(key)) return "muted";

    return "neutral";
}


function initials(name) {

    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "–";

    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[1][0]).toUpperCase();
}


function observe(element, callback) {

    if (!element) return;

    new MutationObserver(callback).observe(element, {
        childList: true,
        characterData: true,
        subtree: true
    });

    callback();
}


// ---------------------------------------------------------
// STATUS PILLS
// ---------------------------------------------------------

function stylePill(id) {

    const element = $(id);

    if (!element) return;

    const raw = element.textContent;

    const text = labelOf(raw);

    const className = `pill tone-${toneOf(raw)}`;

    if (element.className !== className) element.className = className;

    if (element.textContent !== text) element.textContent = text;
}


observe($("nca-status"), () => stylePill("nca-status"));

observe($("approval-status"), () => stylePill("approval-status"));


// ---------------------------------------------------------
// HEADER USER (avatar + menu header)
// ---------------------------------------------------------

observe($("user-name"), () => {

    const name = $("user-name").textContent.trim();

    $("user-avatar").textContent = initials(name);

    $("menu-user-name").textContent = name;
});

observe($("user-role"), () => {

    $("menu-user-badge").textContent = $("user-role").textContent.trim();
});


// ---------------------------------------------------------
// WORKFLOW LABELS
// ---------------------------------------------------------

function transition(text, prefix) {

    const cleaned = text.replace(prefix, "");

    const parts = cleaned.split("→").map(part => labelOf(part));

    return parts.join(" → ");
}


observe($("workflow-container"), () => {

    document
        .querySelectorAll("#workflow-container .workflow-item")
        .forEach(item => {

            if (item.dataset.formatted) return;

            item.dataset.formatted = "1";

            const action = item.querySelector(".workflow-header strong");

            if (action) action.textContent = labelOf(action.textContent);

            const status = item.querySelector(".workflow-status");

            if (status) {

                status.textContent =
                    "Status: " + transition(status.textContent, "");
            }

            const approval = item.querySelector(".workflow-approval");

            if (approval) {

                approval.textContent =
                    "Approval: " + transition(approval.textContent, "Approval:");
            }
        });
});


// ---------------------------------------------------------
// USER MENU
// ---------------------------------------------------------

function closeMenu() {

    $("user-menu").classList.remove("open");

    $("user-menu-button").setAttribute("aria-expanded", "false");
}


$("user-menu-button").addEventListener("click", event => {

    event.stopPropagation();

    const menu = $("user-menu");

    const open = !menu.classList.contains("open");

    menu.classList.toggle("open", open);

    $("user-menu-button").setAttribute("aria-expanded", String(open));
});


$("go-dashboard").addEventListener("click", () => {

    window.location.href = "dashboard.html";
});


document.addEventListener("click", closeMenu);

document.addEventListener("keydown", event => {

    if (event.key === "Escape") closeMenu();
});
