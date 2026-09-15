// =========================================================
// e-NCA - Dashboard
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL
// =========================================================

let currentUser = null;
let currentProfile = null;
let allNcaRecords = [];


// =========================================================
// INITIALIZE
// =========================================================

async function initializeDashboard() {

    try {

        // -----------------------------------------
        // 1. Check Login Session
        // -----------------------------------------

        const {
            data: { session }
        } = await supabase.auth.getSession();


        if (!session) {

            window.location.href = "../index.html";

            return;
        }


        currentUser = session.user;


        // -----------------------------------------
        // 2. Get User Profile
        // -----------------------------------------

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

            console.error(
                "Profile error:",
                error
            );

            await supabase.auth.signOut();

            window.location.href = "../index.html";

            return;
        }


        // -----------------------------------------
        // 3. Check Active
        // -----------------------------------------

        if (!profile.active) {

            await supabase.auth.signOut();

            alert("This account is inactive.");

            window.location.href =
                "../index.html";

            return;
        }


        currentProfile = profile;


        console.log(
            "Current Profile:",
            currentProfile
        );


        // -----------------------------------------
        // 4. Display User
        // -----------------------------------------

        displayUser();


        // -----------------------------------------
        // 5. Load NCA
        // -----------------------------------------

        await loadNcaData();


        // -----------------------------------------
        // 6. Load Notifications
        // -----------------------------------------

        await loadNotificationCount();
        const userManagementButton =
            document.getElementById("user-management-button");

        if (
            userManagementButton &&
            profile.roles &&
            profile.roles.role_code === "ADMIN"
        ) {
            userManagementButton.style.display = "inline-block";

            userManagementButton.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "user-management.html";
                }
            );
        }

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

    }

}


// =========================================================
// DISPLAY USER
// =========================================================

function displayUser() {

    document.getElementById("user-name")
        .textContent =
        currentProfile.full_name ||
        currentProfile.badge_id ||
        "User";


    document.getElementById("user-role")
        .textContent =
        currentProfile.roles?.role_name ||
        "User";
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
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "NCA loading error:",
            error
        );

        return;
    }


    allNcaRecords = data || [];


    updateKpi();

    displayNcaTable(
        allNcaRecords
    );
}


// =========================================================
// UPDATE KPI
// =========================================================

function updateKpi() {

    const total =
        allNcaRecords.length;


    const draft =
        allNcaRecords.filter(
            nca =>
                nca.nca_status === "DRAFT"
        ).length;


    const hold =
        allNcaRecords.filter(
            nca =>
                nca.nca_status === "ON HOLD"
        ).length;


    const closed =
        allNcaRecords.filter(
            nca =>
                nca.nca_status === "CLOSED"
        ).length;


    document.getElementById(
        "kpi-total"
    ).textContent = total;


    document.getElementById(
        "kpi-draft"
    ).textContent = draft;


    document.getElementById(
        "kpi-hold"
    ).textContent = hold;


    document.getElementById(
        "kpi-closed"
    ).textContent = closed;
}


// =========================================================
// DISPLAY NCA TABLE
// =========================================================

function displayNcaTable(records) {

    const tbody =
        document.getElementById(
            "nca-table-body"
        );


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    No NCA records found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        records.map(nca => {

            const createdDate =
                new Date(
                    nca.created_at
                ).toLocaleDateString();


            return `
                <tr>

                    <td>
                        <a
                            href="nca-detail.html?id=${nca.id}"
                            class="nca-link"
                        >
                            ${nca.nca_number || "-"}
                        </a>
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
// SEARCH + FILTER
// =========================================================

document
    .getElementById("search-nca")
    .addEventListener(
        "input",
        applyFilter
    );


document
    .getElementById("status-filter")
    .addEventListener(
        "change",
        applyFilter
    );


function applyFilter() {

    const search =
        document.getElementById(
            "search-nca"
        ).value
        .trim()
        .toLowerCase();


    const status =
        document.getElementById(
            "status-filter"
        ).value;


    const filtered =
        allNcaRecords.filter(nca => {

            const ncaNumber =
                (
                    nca.nca_number || ""
                ).toLowerCase();


            const matchSearch =
                !search ||
                ncaNumber.includes(
                    search
                );


            const matchStatus =
                !status ||
                nca.nca_status === status;


            return (
                matchSearch &&
                matchStatus
            );
        });


    displayNcaTable(
        filtered
    );
}


// =========================================================
// CLEAR FILTER
// =========================================================

document
    .getElementById("clear-filter")
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "search-nca"
            ).value = "";


            document.getElementById(
                "status-filter"
            ).value = "";


            displayNcaTable(
                allNcaRecords
            );
        }
    );


// =========================================================
// LOGOUT
// =========================================================

document
    .getElementById("logout-button")
    .addEventListener(
        "click",
        async () => {

            const {
                error
            } = await supabase.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                return;
            }


            // IMPORTANT:
            // Dashboard is inside /pages/
            // Login page is in root.

            window.location.href =
                "../index.html";
        }
    );


// =========================================================
// NOTIFICATION
// =========================================================

async function loadNotificationCount() {

    if (!currentProfile) {
        return;
    }


    const { count, error } =
        await supabase
            .from("notifications")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "user_id",
                currentProfile.id
            )
            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(
            "Notification error:",
            error
        );

        return;
    }


    document.getElementById(
        "notification-count"
    ).textContent =
        count || 0;
}


// =========================================================
// NOTIFICATION BUTTON
// =========================================================

document
    .getElementById(
        "notification-button"
    )
    .addEventListener(
        "click",
        () => {

            alert(
                "Notification center will be implemented next."
            );

        }
    );


// =========================================================
// CREATE NEW NCA
// =========================================================

document
    .getElementById("new-nca-button")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "create-nca.html";

        }
    );

// =========================================================
// CHANGE PASSWORD
// =========================================================

const changePasswordButton =
    document.getElementById(
        "change-password-button"
    );

const changePasswordModal =
    document.getElementById(
        "change-password-modal"
    );

const changePasswordForm =
    document.getElementById(
        "change-password-form"
    );

const passwordModalClose =
    document.getElementById(
        "password-modal-close"
    );

const cancelPasswordButton =
    document.getElementById(
        "cancel-password"
    );


// ---------------------------------------------------------
// OPEN MODAL
// ---------------------------------------------------------

changePasswordButton.addEventListener(
    "click",
    () => {

        changePasswordForm.reset();

        document.getElementById(
            "password-message"
        ).textContent = "";

        changePasswordModal.style.display =
            "flex";

    }
);


// ---------------------------------------------------------
// CLOSE MODAL
// ---------------------------------------------------------

function closePasswordModal() {

    changePasswordModal.style.display =
        "none";

    changePasswordForm.reset();

}


passwordModalClose.addEventListener(
    "click",
    closePasswordModal
);


cancelPasswordButton.addEventListener(
    "click",
    closePasswordModal
);


// ---------------------------------------------------------
// UPDATE PASSWORD
// ---------------------------------------------------------

changePasswordForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const message =
            document.getElementById(
                "password-message"
            );


        const saveButton =
            document.getElementById(
                "save-password-button"
            );


        const newPassword =
            document.getElementById(
                "new-password"
            ).value;


        const confirmPassword =
            document.getElementById(
                "confirm-password"
            ).value;


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (newPassword.length < 8) {

            message.textContent =
                "Password must contain at least 8 characters.";

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            message.textContent =
                "Password confirmation does not match.";

            return;
        }


        // ---------------------------------------------
        // UPDATE SUPABASE AUTH
        // ---------------------------------------------

        message.textContent =
            "Updating password...";

        saveButton.disabled = true;


        const {
            error
        } = await supabase.auth.updateUser({
            password: newPassword
        });


        saveButton.disabled = false;


        if (error) {

            console.error(
                "Password update error:",
                error
            );

            message.textContent =
                "Failed to update password: " +
                error.message;

            return;
        }


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        message.textContent =
            "Password updated successfully.";


        setTimeout(
            () => {

                closePasswordModal();

            },
            1000
        );

    }
);

// =========================================================
// START
// =========================================================

initializeDashboard();
