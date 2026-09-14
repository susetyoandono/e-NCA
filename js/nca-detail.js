// =========================================================
// e-NCA - NCA Detail
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL
// =========================================================

let currentUser = null;
let currentProfile = null;
let currentNca = null;


// =========================================================
// GET NCA ID FROM URL
// =========================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const ncaId =
    urlParams.get("id");


// =========================================================
// INITIALIZE
// =========================================================

async function initializePage() {

    try {

        // -----------------------------------------
        // Check NCA ID
        // -----------------------------------------

        if (!ncaId) {

            alert("NCA record not specified.");

            window.location.href =
                "dashboard.html";

            return;
        }


        // -----------------------------------------
        // Check Session
        // -----------------------------------------

        const {
            data: { session }
        } = await supabase.auth.getSession();


        if (!session) {

            window.location.href =
                "../index.html";

            return;
        }


        currentUser =
            session.user;


        // -----------------------------------------
        // Get Profile
        // -----------------------------------------

        const {
            data: profile,
            error: profileError
        } = await supabase
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
            .eq(
                "id",
                currentUser.id
            )
            .single();


        if (profileError || !profile) {

            await supabase.auth.signOut();

            window.location.href =
                "../index.html";

            return;
        }


        currentProfile =
            profile;


        // -----------------------------------------
        // Display User
        // -----------------------------------------

        document.getElementById(
            "user-name"
        ).textContent =
            profile.full_name ||
            profile.badge_id;


        document.getElementById(
            "user-role"
        ).textContent =
            profile.roles?.role_name ||
            "User";


        // -----------------------------------------
        // Load NCA
        // -----------------------------------------

        await loadNca();


        // -----------------------------------------
        // Load Workflow
        // -----------------------------------------

        await loadWorkflow();


    } catch (error) {

        console.error(
            "Page initialization error:",
            error
        );

    }

}


// =========================================================
// LOAD NCA
// =========================================================

async function loadNca() {

    const {
        data,
        error
    } = await supabase
        .from("nca")
        .select(`
            id,
            nca_number,
            nca_status,
            approval_status,
            created_at,
            created_by,
            current_assignee
        `)
        .eq(
            "id",
            ncaId
        )
        .single();


    if (error || !data) {

        console.error(
            "NCA loading error:",
            error
        );

        alert(
            "NCA record could not be found."
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    currentNca =
        data;


    // -----------------------------------------
    // Display
    // -----------------------------------------

    document.getElementById(
        "nca-number"
    ).textContent =
        data.nca_number || "-";


    document.getElementById(
        "nca-status"
    ).textContent =
        data.nca_status || "-";


    document.getElementById(
        "approval-status"
    ).textContent =
        data.approval_status || "-";


    document.getElementById(
        "created-date"
    ).textContent =
        formatDate(data.created_at);


    // -----------------------------------------
    // Get Created By
    // -----------------------------------------

    if (data.created_by) {

        const {
            data: creator
        } = await supabase
            .from("profiles")
            .select(`
                full_name,
                badge_id
            `)
            .eq(
                "id",
                data.created_by
            )
            .single();


        if (creator) {

            document.getElementById(
                "created-by"
            ).textContent =
                `${creator.full_name} (${creator.badge_id})`;

        }

    }


    // -----------------------------------------
    // Get Current Assignee
    // -----------------------------------------

    if (data.current_assignee) {

        const {
            data: assignee
        } = await supabase
            .from("profiles")
            .select(`
                full_name,
                badge_id
            `)
            .eq(
                "id",
                data.current_assignee
            )
            .single();


        if (assignee) {

            document.getElementById(
                "current-assignee"
            ).textContent =
                `${assignee.full_name} (${assignee.badge_id})`;

        }

    }

}


// =========================================================
// LOAD WORKFLOW
// =========================================================

async function loadWorkflow() {

    const {
        data,
        error
    } = await supabase
        .from("nca_workflow")
        .select(`
            id,
            from_status,
            to_status,
            from_approval_status,
            to_approval_status,
            action_type,
            comments,
            created_at,
            action_by
        `)
        .eq(
            "nca_id",
            ncaId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Workflow loading error:",
            error
        );

        return;
    }


    const container =
        document.getElementById(
            "workflow-history"
        );


    if (!data || !data.length) {

        container.innerHTML = `
            <div class="empty-state">
                No workflow history yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        data.map(item => {

            return `
                <div class="workflow-item">

                    <div class="workflow-date">
                        ${formatDate(item.created_at)}
                    </div>

                    <div class="workflow-action">
                        ${item.action_type || "-"}
                    </div>

                    <div class="workflow-status">
                        ${item.from_approval_status || "-"}
                        →
                        ${item.to_approval_status || "-"}
                    </div>

                    ${
                        item.comments
                            ? `
                                <div class="workflow-comment">
                                    ${item.comments}
                                </div>
                              `
                            : ""
                    }

                </div>
            `;

        }).join("");
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }


    return new Date(
        dateString
    ).toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =========================================================
// BACK
// =========================================================

document
    .getElementById("back-button")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

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

            await supabase.auth.signOut();

            window.location.href =
                "../index.html";

        }
    );


// =========================================================
// START
// =========================================================

initializePage();
