// =========================================================
// e-NCA - Main Dashboard
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL USER
// =========================================================

let currentUser = null;
let currentProfile = null;
let allNcaRecords = [];


// =========================================================
// INITIALIZE
// =========================================================

async function initializeApp() {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    // -----------------------------------------
    // No login session
    // -----------------------------------------

    if (!session) {

        showLoginPage();

        return;
    }

    currentUser = session.user;


    // -----------------------------------------
    // Get profile
    // -----------------------------------------

    const { data: profile, error } = await supabase
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

        await supabase.auth.signOut();

        alert("User profile not found.");

        showLoginPage();

        return;
    }


    // -----------------------------------------
    // Check active
    // -----------------------------------------

    if (!profile.active) {

        await supabase.auth.signOut();

        alert("This account is inactive.");

        showLoginPage();

        return;
    }


    currentProfile = profile;

    console.log("Current User:", currentProfile);


    // -----------------------------------------
    // Load dashboard
    // -----------------------------------------

    displayUser();

    await loadNcaData();

}


// =========================================================
// DISPLAY USER
// =========================================================

function displayUser() {

    document.getElementById("user-name").textContent =
        currentProfile.full_name || currentProfile.badge_id;

    document.getElementById("user-role").textContent =
        currentProfile.roles?.role_name || "User";
}


// =========================================================
// LOAD NCA
// =========================================================

async function loadNcaData() {

    const { data, error } = await supabase
        .from("nca")
        .select(`
            id,
            nca_number,
            nca_status,
            approval_status,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("NCA loading error:", error);

        return;
    }

    allNcaRecords = data || [];

    updateKpi();

    displayNcaTable(allNcaRecords);
}


// =========================================================
// KPI
// =========================================================

function updateKpi() {

    document.getElementById("kpi-total").textContent =
        allNcaRecords.length;

    document.getElementById("kpi-draft").textContent =
        allNcaRecords.filter(
            x => x.nca_status === "DRAFT"
        ).length;

    document.getElementById("kpi-hold").textContent =
        allNcaRecords.filter(
            x => x.nca_status === "ON HOLD"
        ).length;

    document.getElementById("kpi-closed").textContent =
        allNcaRecords.filter(
            x => x.nca_status === "CLOSED"
        ).length;
}


// =========================================================
// DISPLAY TABLE
// =========================================================

function displayNcaTable(records) {

    const tbody =
        document.getElementById("nca-table-body");

    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    No NCA records found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = records.map(nca => {

        const createdDate =
            new Date(nca.created_at)
                .toLocaleDateString();

        return `
            <tr>

                <td>
                    <strong>${nca.nca_number || "-"}</strong>
                </td>

                <td>
                    ${nca.nca_status || "-"}
                </td>

                <td>
                    ${nca.approval_status || "-"}
                </td>

                <td>
                    ${createdDate}
                </td>

            </tr>
        `;

    }).join("");
}


// =========================================================
// SEARCH
// =========================================================

document
    .getElementById("search-nca")
    .addEventListener("input", applyFilter);

document
    .getElementById("status-filter")
    .addEventListener("change", applyFilter);


function applyFilter() {

    const search =
        document
            .getElementById("search-nca")
            .value
            .toLowerCase();

    const status =
        document
            .getElementById("status-filter")
            .value;


    const filtered =
        allNcaRecords.filter(nca => {

            const matchSearch =
                !search ||
                (nca.nca_number || "")
                    .toLowerCase()
                    .includes(search);

            const matchStatus =
                !status ||
                nca.nca_status === status;

            return matchSearch && matchStatus;
        });


    displayNcaTable(filtered);
}


// =========================================================
// CLEAR FILTER
// =========================================================

document
    .getElementById("clear-filter")
    .addEventListener("click", () => {

        document.getElementById("search-nca").value = "";
        document.getElementById("status-filter").value = "";

        displayNcaTable(allNcaRecords);

    });


// =========================================================
// LOGOUT
// =========================================================

document
    .getElementById("logout-button")
    .addEventListener("click", async () => {

        await supabase.auth.signOut();

        location.reload();

    });


// =========================================================
// NOTIFICATION
// =========================================================

document
    .getElementById("notification-button")
    .addEventListener("click", () => {

        alert("Notification center will be implemented next.");

    });


// =========================================================
// CREATE NCA
// =========================================================

document
    .getElementById("new-nca-button")
    .addEventListener("click", () => {

        alert("NCA creation page will be implemented next.");

    });


// =========================================================
// LOGIN PAGE FALLBACK
// =========================================================

function showLoginPage() {

    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:Arial;
        ">
            <div style="text-align:center">

                <h2>e-NCA</h2>

                <p>
                    You are not logged in.
                </p>

                <br>

                <button
                    onclick="location.reload()"
                    style="
                        padding:10px 20px;
                        cursor:pointer;
                    "
                >
                    Return to Login
                </button>

            </div>
        </div>
    `;
}


// =========================================================
// START
// =========================================================

initializeApp();
