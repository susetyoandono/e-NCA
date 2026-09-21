// =========================================================
// e-NCA - Dashboard
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL
// =========================================================

const PAGE_SIZE = 15;

const ACRONYMS = new Set(["QC", "QA", "PE", "NCA", "PIC"]);

let currentUser = null;
let currentProfile = null;

let allNcaRecords = [];
let filteredRecords = [];
let dashboardNotifications = [];

let activeStatus = "";
let currentPage = 1;

const $ = id => document.getElementById(id);


// =========================================================
// HELPERS
// =========================================================

function esc(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// "WAITING_QC_REVIEW" and "WAITING QC REVIEW" become the same key
function norm(value) {

    return String(value ?? "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}


function labelOf(value) {

    const key = norm(value);

    if (!key) return "-";

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

    if (/REJECT|CANCEL|FAIL/.test(key)) return "danger";
    if (/WAIT|PENDING|REVIEW|PROGRESS|SUBMIT/.test(key)) return "info";
    if (/CLOSE|COMPLETE|APPROVED|DONE/.test(key)) return "ok";
    if (/HOLD/.test(key)) return "warn";
    if (/DRAFT/.test(key)) return "muted";

    return "neutral";
}


function pill(value) {

    if (!norm(value)) return "-";

    return `<span class="pill tone-${toneOf(value)}">${esc(labelOf(value))}</span>`;
}


function formatDate(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function initials(name) {

    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "?";

    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[1][0]).toUpperCase();
}


// =========================================================
// INITIALIZE
// =========================================================

async function initializeDashboard() {

    try {

        // 1. Session

        const { data: { session } } =
            await supabase.auth.getSession();

        if (!session) {

            window.location.href = "../index.html";

            return;
        }

        currentUser = session.user;


        // 2. Profile

        const { data: profile, error } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    badge_id,
                    full_name,
                    email,
                    active,
                    roles (
                        role_code,
                        role_name
                    )
                `)
                .eq("id", currentUser.id)
                .single();

        if (error || !profile) {

            console.error("Profile error:", error);

            await supabase.auth.signOut();

            window.location.href = "../index.html";

            return;
        }


        // 3. Active check

        if (!profile.active) {

            await supabase.auth.signOut();

            alert("This account is inactive.");

            window.location.href = "../index.html";

            return;
        }

        currentProfile = profile;


        // 4. UI

        displayUser();

        if (profile.roles?.role_code === "ADMIN") {

            $("user-management-button").style.display = "flex";
        }


        // 5. Data

        await loadNcaData();

        await loadNotificationCount();

    } catch (error) {

        console.error("Dashboard initialization error:", error);

        renderEmpty("Could not load the dashboard.", "Refresh the page and try again.");
    }
}


// =========================================================
// DISPLAY USER
// =========================================================

function displayUser() {

    const name =
        currentProfile.full_name ||
        currentProfile.badge_id ||
        "User";

    const role =
        currentProfile.roles?.role_name || "User";

    $("user-name").textContent = name;
    $("user-role").textContent = role;
    $("user-avatar").textContent = initials(name);

    $("menu-user-name").textContent = name;
    $("menu-user-badge").textContent =
        currentProfile.badge_id
            ? `${currentProfile.badge_id} · ${role}`
            : role;
}


// =========================================================
// LOAD NCA DATA
// =========================================================

async function loadNcaData() {

    const { data, error } =
        await supabase
            .from("nca")
            .select(`
                id,
                nca_number,
                nca_status,
                approval_status,
                created_at,
                created_by,
                part_number,
                part_name,
                defect_name
            `)
            .order("created_at", { ascending: false });

    if (error) {

        console.error("NCA loading error:", error);

        renderEmpty("Could not load NCA records.", error.message);

        return;
    }

    const records = data || [];


    // Creator names (separate query, no dependency on FK naming)

    const creatorIds = [
        ...new Set(records.map(r => r.created_by).filter(Boolean))
    ];

    const creatorMap = {};

    if (creatorIds.length > 0) {

        const { data: creators, error: creatorError } =
            await supabase
                .from("profiles")
                .select("id, full_name, badge_id")
                .in("id", creatorIds);

        if (creatorError) {

            console.error("Creator loading error:", creatorError);

        } else {

            (creators || []).forEach(p => {

                creatorMap[p.id] = p.full_name || p.badge_id || "-";
            });
        }
    }


    allNcaRecords = records.map(r => {

        const creator = creatorMap[r.created_by] || "-";

        return {
            ...r,

            creator_name: creator,

            _search: [
                r.nca_number,
                r.part_number,
                r.part_name,
                r.defect_name,
                creator,
                labelOf(r.nca_status),
                labelOf(r.approval_status)
            ].join(" ").toLowerCase()
        };
    });

    buildApprovalFilter();

    refresh(true);
}


// =========================================================
// FILTERS
// =========================================================

function buildApprovalFilter() {

    const select = $("approval-filter");

    const previous = select.value;

    const keys = [
        ...new Set(
            allNcaRecords
                .map(r => norm(r.approval_status))
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    select.innerHTML =
        `<option value="">All approval status</option>` +
        keys.map(key =>
            `<option value="${esc(key)}">${esc(labelOf(key))}</option>`
        ).join("");

    if (keys.includes(previous)) {

        select.value = previous;
    }
}


function getFilters() {

    return {

        terms: $("search-nca").value
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean),

        approval: $("approval-filter").value
    };
}


function matches(record, filters, skipStatus) {

    if (
        !skipStatus &&
        activeStatus &&
        norm(record.nca_status) !== activeStatus
    ) {
        return false;
    }

    if (
        filters.approval &&
        norm(record.approval_status) !== filters.approval
    ) {
        return false;
    }

    return filters.terms.every(
        term => record._search.includes(term)
    );
}


function refresh(resetPage) {

    const filters = getFilters();

    if (resetPage) currentPage = 1;

    filteredRecords =
        allNcaRecords.filter(r => matches(r, filters, false));

    renderStatusTabs(filters);

    renderTable();

    renderPagination();

    const hasFilter =
        activeStatus !== "" ||
        filters.approval !== "" ||
        filters.terms.length > 0;

    $("clear-filter").classList.toggle("hidden", !hasFilter);

    $("result-count").textContent =
        `${filteredRecords.length} of ${allNcaRecords.length} NCA`;
}


// =========================================================
// STATUS TABS
// =========================================================

function renderStatusTabs(filters) {

    // Counts respect search + approval filter, so the numbers match the list

    const counts = new Map();

    let total = 0;

    allNcaRecords.forEach(record => {

        if (!matches(record, filters, true)) return;

        total++;

        const key = norm(record.nca_status);

        if (!key) return;

        counts.set(key, (counts.get(key) || 0) + 1);
    });


    // Keep the active tab visible even when its count is 0

    if (activeStatus && !counts.has(activeStatus)) {

        counts.set(activeStatus, 0);
    }

    const keys = [...counts.keys()].sort(
        (a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b)
    );

    const tab = (key, label, count) => `
        <button
            type="button"
            role="tab"
            class="dx-tab ${activeStatus === key ? "active" : ""}"
            aria-selected="${activeStatus === key}"
            data-status="${esc(key)}"
        >
            ${esc(label)}
            <span class="dx-tab-count">${count}</span>
        </button>
    `;

    $("status-tabs").innerHTML =
        tab("", "All", total) +
        keys.map(key => tab(key, labelOf(key), counts.get(key))).join("");
}


$("status-tabs").addEventListener("click", event => {

    const button = event.target.closest("[data-status]");

    if (!button) return;

    activeStatus = button.dataset.status;

    refresh(true);
});


// =========================================================
// TABLE
// =========================================================

function renderEmpty(title, description) {

    $("nca-table-body").innerHTML = `
        <tr>
            <td colspan="8" class="dx-cell-empty">
                <strong>${esc(title)}</strong>
                ${esc(description || "")}
            </td>
        </tr>
    `;
}


function renderTable() {

    if (filteredRecords.length === 0) {

        if (allNcaRecords.length === 0) {

            renderEmpty(
                "No NCA records yet",
                "Select Create NCA to add the first one."
            );

        } else {

            renderEmpty(
                "No NCA matches these filters",
                "Change or clear the filters to see more records."
            );
        }

        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;

    const rows = filteredRecords.slice(start, start + PAGE_SIZE);

    $("nca-table-body").innerHTML = rows.map(nca => `
        <tr data-id="${esc(nca.id)}">

            <td>
                <a
                    class="nca-link"
                    href="nca-detail.html?id=${encodeURIComponent(nca.id)}"
                >
                    ${esc(nca.nca_number || "-")}
                </a>
            </td>

            <td class="nowrap">${esc(nca.part_number || "-")}</td>

            <td class="wrap">${esc(nca.part_name || "-")}</td>

            <td class="wrap">${esc(nca.defect_name || "-")}</td>

            <td class="nowrap">${esc(nca.creator_name)}</td>

            <td>${pill(nca.nca_status)}</td>

            <td>${pill(nca.approval_status)}</td>

            <td class="nowrap muted">${esc(formatDate(nca.created_at))}</td>

        </tr>
    `).join("");
}


$("nca-table-body").addEventListener("click", event => {

    if (event.target.closest("a")) return;

    const row = event.target.closest("tr[data-id]");

    if (!row) return;

    window.location.href =
        "nca-detail.html?id=" + encodeURIComponent(row.dataset.id);
});


// =========================================================
// PAGINATION
// =========================================================

function renderPagination() {

    const total = filteredRecords.length;

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (currentPage > pages) currentPage = pages;

    const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

    const to = Math.min(currentPage * PAGE_SIZE, total);

    $("page-info").textContent =
        total === 0
            ? "No records"
            : `Showing ${from}–${to} of ${total}`;

    $("page-indicator").textContent =
        `Page ${currentPage} of ${pages}`;

    $("prev-page").disabled = currentPage <= 1;

    $("next-page").disabled = currentPage >= pages;
}


$("prev-page").addEventListener("click", () => {

    if (currentPage > 1) {

        currentPage--;

        renderTable();

        renderPagination();
    }
});


$("next-page").addEventListener("click", () => {

    const pages = Math.ceil(filteredRecords.length / PAGE_SIZE);

    if (currentPage < pages) {

        currentPage++;

        renderTable();

        renderPagination();
    }
});


// =========================================================
// SEARCH + FILTER EVENTS
// =========================================================

$("search-nca").addEventListener("input", () => refresh(true));

$("approval-filter").addEventListener("change", () => refresh(true));

$("clear-filter").addEventListener("click", () => {

    $("search-nca").value = "";

    $("approval-filter").value = "";

    activeStatus = "";

    refresh(true);
});


// =========================================================
// USER MENU
// =========================================================

function closeUserMenu() {

    $("user-menu").classList.remove("open");

    $("user-menu-button").setAttribute("aria-expanded", "false");
}


$("user-menu-button").addEventListener("click", event => {

    event.stopPropagation();

    closeNotificationPanel();

    const menu = $("user-menu");

    const open = !menu.classList.contains("open");

    menu.classList.toggle("open", open);

    $("user-menu-button").setAttribute("aria-expanded", String(open));
});


$("user-management-button").addEventListener("click", () => {

    window.location.href = "user-management.html";
});


$("new-nca-button").addEventListener("click", () => {

    window.location.href = "create-nca.html";
});


$("logout-button").addEventListener("click", async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        return;
    }

    window.location.href = "../index.html";
});


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeUserMenu();

        closeNotificationPanel();

        closePasswordModal();
    }
});


// =========================================================
// NOTIFICATIONS
// =========================================================

async function loadNotificationCount() {

    if (!currentProfile) return;

    const { data, error } =
        await supabase
            .from("notifications")
            .select(`
                id,
                nca_id,
                notification_type,
                title,
                message,
                target_page,
                is_read,
                is_action_required,
                created_at
            `)
            .eq("user_id", currentProfile.id)
            .order("created_at", { ascending: false })
            .limit(50);

    if (error) {

        console.error("Notification loading error:", error);

        return;
    }

    dashboardNotifications = data || [];

    updateNotificationCount();

    renderNotifications();
}


function updateNotificationCount() {

    const countElement = $("notification-count");

    if (!countElement) return;

    const unread =
        dashboardNotifications.filter(n => n.is_read === false).length;

    countElement.textContent = unread > 99 ? "99+" : unread;

    countElement.style.display =
        unread > 0 ? "inline-flex" : "none";
}


function renderNotifications() {

    const list = $("notification-list");

    if (!list) return;

    if (dashboardNotifications.length === 0) {

        list.innerHTML = `
            <div class="notification-empty">
                No notifications.
            </div>
        `;

        return;
    }

    list.innerHTML = dashboardNotifications.map(notification => {

        const createdDate =
            notification.created_at
                ? new Date(notification.created_at).toLocaleString()
                : "";

        return `
            <button
                type="button"
                class="notification-item ${notification.is_read ? "" : "unread"}"
                data-notification-id="${esc(notification.id)}"
            >

                <div class="notification-item-header">

                    <strong>${esc(notification.title || "Notification")}</strong>

                    ${
                        notification.is_read
                            ? ""
                            : `<span class="notification-unread-dot"></span>`
                    }

                </div>

                <div class="notification-message">
                    ${esc(notification.message || "")}
                </div>

                <div class="notification-meta">

                    <span>${esc(createdDate)}</span>

                    ${
                        notification.is_action_required
                            ? `<span class="notification-action-label">Action required</span>`
                            : ""
                    }

                </div>

            </button>
        `;

    }).join("");
}


function closeNotificationPanel() {

    const panel = $("notification-panel");

    if (panel) panel.style.display = "none";
}


function toggleNotificationPanel() {

    const panel = $("notification-panel");

    if (!panel) return;

    panel.style.display =
        panel.style.display === "block" ? "none" : "block";
}


async function openNotification(notification) {

    if (!notification) return;

    // Mark as read

    if (!notification.is_read) {

        const { error } =
            await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq("id", notification.id)
                .eq("user_id", currentProfile.id);

        if (error) {

            console.error("Mark notification read error:", error);

            return;
        }

        notification.is_read = true;

        updateNotificationCount();
    }

    // Target page (dashboard is already inside /pages/)

    if (notification.target_page) {

        const target = String(notification.target_page).trim();

        window.location.href =
            target.startsWith("./") ||
            target.startsWith("../") ||
            target.startsWith("/")
                ? target
                : "./" + target;

        return;
    }

    // Fallback

    if (notification.nca_id) {

        window.location.href =
            "nca-detail.html?id=" +
            encodeURIComponent(notification.nca_id);
    }
}


$("notification-button").addEventListener("click", event => {

    event.stopPropagation();

    closeUserMenu();

    toggleNotificationPanel();
});


$("notification-close")?.addEventListener("click", event => {

    event.stopPropagation();

    closeNotificationPanel();
});


$("notification-list")?.addEventListener("click", event => {

    const item = event.target.closest("[data-notification-id]");

    if (!item) return;

    const notification =
        dashboardNotifications.find(
            row => String(row.id) === item.dataset.notificationId
        );

    openNotification(notification);
});


$("notification-panel")?.addEventListener("click", event => {

    event.stopPropagation();
});


document.addEventListener("click", () => {

    closeNotificationPanel();

    closeUserMenu();
});


// =========================================================
// CHANGE PASSWORD
// =========================================================

const changePasswordModal = $("change-password-modal");

const changePasswordForm = $("change-password-form");


function setPasswordMessage(text, type) {

    const message = $("password-message");

    message.textContent = text;

    message.className = type ? `form-message ${type}` : "form-message";
}


function closePasswordModal() {

    changePasswordModal.style.display = "none";

    changePasswordForm.reset();
}


$("change-password-button").addEventListener("click", () => {

    closeUserMenu();

    changePasswordForm.reset();

    setPasswordMessage("", "");

    changePasswordModal.style.display = "flex";

    $("new-password").focus();
});


$("password-modal-close").addEventListener("click", closePasswordModal);

$("cancel-password").addEventListener("click", closePasswordModal);

changePasswordModal.addEventListener("click", event => {

    if (event.target === changePasswordModal) closePasswordModal();
});


changePasswordForm.addEventListener("submit", async event => {

    event.preventDefault();

    const saveButton = $("save-password-button");

    const newPassword = $("new-password").value;

    const confirmPassword = $("confirm-password").value;

    if (newPassword.length < 8) {

        setPasswordMessage(
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }

    if (newPassword !== confirmPassword) {

        setPasswordMessage(
            "Password confirmation does not match.",
            "error"
        );

        return;
    }

    setPasswordMessage("Updating password...", "");

    saveButton.disabled = true;

    const { error } =
        await supabase.auth.updateUser({ password: newPassword });

    saveButton.disabled = false;

    if (error) {

        console.error("Password update error:", error);

        setPasswordMessage(
            "Failed to update password: " + error.message,
            "error"
        );

        return;
    }

    setPasswordMessage("Password updated successfully.", "success");

    setTimeout(closePasswordModal, 1000);
});


// =========================================================
// START
// =========================================================

initializeDashboard();
