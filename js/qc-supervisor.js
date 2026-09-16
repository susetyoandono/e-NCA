import { supabase } from "./supabase.js";


// =====================================================
// GLOBAL
// =====================================================

let currentUser = null;
let currentProfile = null;
let currentNCA = null;

let assignmentUsers = [];


// =====================================================
// HELPERS
// =====================================================

function el(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = el(id);

    if (element) {
        element.textContent =
            value ?? "-";
    }

}


function getNcaId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// =====================================================
// CURRENT USER
// =====================================================

async function loadCurrentUser() {

    const {
        data: { user },
        error
    } =
        await supabase.auth.getUser();


    if (error || !user) {

        window.location.href =
            "../index.html";

        return false;
    }


    currentUser = user;


    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profiles")
            .select(`
                *,
                departments (
                    department_code,
                    department_name
                ),
                job_positions (
                    position_name
                )
            `)
            .eq("id", user.id)
            .single();


    if (
        profileError ||
        !profile
    ) {

        console.error(
            profileError
        );

        return false;
    }


    currentProfile =
        profile;


    setText(
        "header-user",
        profile.full_name
    );


    return true;
}


// =====================================================
// LOAD NCA
// =====================================================

async function loadNCA() {

    const ncaId =
        getNcaId();


    if (!ncaId) {

        alert(
            "NCA ID is missing."
        );

        return false;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("nca")
            .select("*")
            .eq("id", ncaId)
            .single();


    if (error || !data) {

        console.error(
            error
        );

        alert(
            "NCA could not be loaded."
        );

        return false;
    }


    currentNCA =
        data;


    return true;
}


// =====================================================
// ACCESS VALIDATION
// =====================================================

function validateAccess() {

    if (
        !currentNCA ||
        !currentUser
    ) {
        return false;
    }


    if (
        currentNCA.current_assignee !==
        currentUser.id
    ) {

        alert(
            "This NCA is not assigned to you."
        );

        window.location.href =
            "./dashboard.html";

        return false;
    }


    if (
        String(
            currentNCA.approval_status
        ).toUpperCase() !==
        "WAITING_QC_REVIEW"
    ) {

        alert(
            "This NCA is no longer waiting for QC review."
        );

        window.location.href =
            "./nca-detail.html?id=" +
            currentNCA.id;

        return false;
    }


    return true;
}


// =====================================================
// DISPLAY NCA
// =====================================================

function displayNCA() {

    setText(
        "nca-number",
        currentNCA.nca_number
    );

    setText(
        "nca-status",
        currentNCA.nca_status
    );

    setText(
        "approval-status",
        currentNCA.approval_status
    );

    setText(
        "part-number",
        currentNCA.part_number
    );

    setText(
        "part-name",
        currentNCA.part_name
    );

    setText(
        "lot-number",
        currentNCA.lot_number
    );

    setText(
        "machine-mold-no",
        currentNCA.machine_mold_no
    );

    setText(
        "defect-name",
        currentNCA.defect_name
    );

    setText(
        "process-name",
        currentNCA.process_name
    );

    setText(
        "defect-description",
        currentNCA.defect_description
    );
}


// =====================================================
// LOAD USERS
// =====================================================

async function loadAssignmentUsers() {

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select(`
                id,
                badge_id,
                full_name,
                area,
                active,

                departments (
                    department_code,
                    department_name
                ),

                job_positions (
                    position_name
                )
            `)
            .eq("active", true)
            .order("full_name");


    if (error) {

        console.error(
            "Assignment users error:",
            error
        );

        return;
    }


    assignmentUsers =
        data || [];


    renderAssignmentDropdowns();
}


// =====================================================
// USER FILTER HELPERS
// =====================================================

function departmentCode(user) {

    return String(
        user.departments
            ?.department_code || ""
    ).toUpperCase();

}


function positionName(user) {

    return String(
        user.job_positions
            ?.position_name || ""
    ).toUpperCase();

}


function sortByArea(users) {

    const selectedArea =
        el("assignment-area").value;


    if (!selectedArea) {
        return users;
    }


    // IMPORTANT:
    // AREA DOES NOT REMOVE USERS.
    // Matching area only appears first.

    return [...users].sort(
        (a, b) => {

            const aMatch =
                a.area === selectedArea
                    ? 0
                    : 1;

            const bMatch =
                b.area === selectedArea
                    ? 0
                    : 1;


            if (aMatch !== bMatch) {
                return aMatch - bMatch;
            }


            return String(
                a.full_name
            ).localeCompare(
                String(b.full_name)
            );

        }
    );
}


// =====================================================
// POPULATE SELECT
// =====================================================

function populateSelect(
    id,
    users,
    placeholder
) {

    const select =
        el(id);


    if (!select) return;


    const previousValue =
        select.value;


    select.innerHTML = "";


    const first =
        document.createElement(
            "option"
        );

    first.value = "";

    first.textContent =
        placeholder;

    select.appendChild(first);


    sortByArea(users)
        .forEach(user => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                user.id;


            const area =
                user.area
                    ? ` • ${user.area}`
                    : "";


            option.textContent =
                `${user.full_name} (${user.badge_id})${area}`;


            select.appendChild(
                option
            );

        });


    if (
        [...select.options]
            .some(
                option =>
                    option.value ===
                    previousValue
            )
    ) {

        select.value =
            previousValue;
    }
}


// =====================================================
// RENDER ASSIGNMENT DROPDOWNS
// =====================================================

function renderAssignmentDropdowns() {

    /*
     * Responsible PIC:
     *
     * Intentionally broad.
     * QC Supervisor can select any
     * active user when necessary.
     */

    populateSelect(
        "responsible-pic",
        assignmentUsers,
        "Select Responsible PIC"
    );


    const peEngineers =
        assignmentUsers.filter(
            user =>
                departmentCode(user) ===
                    "PE" &&
                positionName(user) ===
                    "ENGINEER"
        );


    populateSelect(
        "pe-engineer",
        peEngineers,
        "Select PE Engineer"
    );


    const productionSupervisors =
        assignmentUsers.filter(
            user =>
                departmentCode(user) ===
                    "PRODUCTION" &&
                positionName(user) ===
                    "SUPERVISOR"
        );


    populateSelect(
        "production-supervisor",
        productionSupervisors,
        "Select Production Supervisor"
    );


    const qaEngineers =
        assignmentUsers.filter(
            user =>
                departmentCode(user) ===
                    "QA" &&
                positionName(user) ===
                    "ENGINEER"
        );


    populateSelect(
        "qa-engineer",
        qaEngineers,
        "Select QA Engineer"
    );

}


// =====================================================
// EVENTS
// =====================================================

el("assignment-area")
    ?.addEventListener(
        "change",
        renderAssignmentDropdowns
    );


el("view-nca-detail")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./nca-detail.html?id=" +
                currentNCA.id;

        }
    );


el("back-dashboard")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./dashboard.html";

        }
    );


// =====================================================
// INIT
// =====================================================

async function init() {

    const userOK =
        await loadCurrentUser();


    if (!userOK) {
        return;
    }


    const ncaOK =
        await loadNCA();


    if (!ncaOK) {
        return;
    }


    if (!validateAccess()) {
        return;
    }


    displayNCA();


    await loadAssignmentUsers();

}


init();
