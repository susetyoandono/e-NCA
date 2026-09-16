import { supabase } from "./supabase.js";


// =====================================================
// GLOBAL
// =====================================================

let currentUser = null;
let currentProfile = null;
let currentNCA = null;

let assignmentUsers = [];

let traceabilityRows = [];

let traceabilityInputMethod =
    "MANUAL";

let traceabilityStream =
    null;

let traceabilityScanActive =
    false;


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
// TRACEABILITY QR PARSER
// =====================================================

function parseTraceabilityQR(text) {

    const values =
        String(text)
            .split(",")
            .map(value =>
                value.trim()
            );


    /*
     * FLOWSHEET QR MAPPING
     *
     * [1]  Part Number
     * [2]  Lot Number
     * [11] Lot Qty
     * [18] Reel Number
     * [19] Part Name
     */

    if (values.length < 20) {

        throw new Error(
            "Invalid flowsheet QR format."
        );
    }


    return {

        part_number:
            values[1] || "",

        lot_number:
            values[2] || "",

        lot_qty:
            values[11] || "",

        reel_number:
            values[18] || "",

        part_name:
            values[19] || ""

    };
}


// =====================================================
// APPLY QR RESULT
// =====================================================

function applyTraceabilityQR(
    result
) {

    el("trace-part-number").value =
        result.part_number;

    el("trace-part-name").value =
        result.part_name;

    el("trace-lot-number").value =
        result.lot_number;

    el("trace-reel-number").value =
        result.reel_number;

    el("trace-lot-qty").value =
        result.lot_qty;


    traceabilityInputMethod =
        "QR";


    const message =
        el("traceability-message");


    if (message) {

        message.textContent =
            "Flowsheet QR read successfully. Verify the data, then click Add Affected Lot.";

    }
}


// =====================================================
// CLEAR TRACEABILITY INPUT
// =====================================================

function clearTraceabilityInput() {

    el("trace-part-number").value =
        "";

    el("trace-part-name").value =
        "";

    el("trace-lot-number").value =
        "";

    el("trace-reel-number").value =
        "";

    el("trace-lot-qty").value =
        "";


    traceabilityInputMethod =
        "MANUAL";
}


// =====================================================
// ADD TRACEABILITY ROW
// =====================================================

function addTraceabilityRow() {

    const partNumber =
        el("trace-part-number")
            .value
            .trim();

    const partName =
        el("trace-part-name")
            .value
            .trim();

    const lotNumber =
        el("trace-lot-number")
            .value
            .trim();

    const reelNumber =
        el("trace-reel-number")
            .value
            .trim();

    const lotQty =
        Number(
            el("trace-lot-qty")
                .value
        );


    const message =
        el("traceability-message");


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
        !partNumber ||
        !partName ||
        !lotNumber
    ) {

        message.textContent =
            "Part Number, Part Name and Lot Number are required.";

        return;
    }


    if (
        !Number.isFinite(lotQty) ||
        lotQty <= 0
    ) {

        message.textContent =
            "Lot Qty must be greater than 0.";

        return;
    }


    // -------------------------------------------------
    // DUPLICATE CHECK
    // -------------------------------------------------

    const duplicate =
        traceabilityRows.some(
            row =>
                row.part_number ===
                    partNumber &&

                row.lot_number ===
                    lotNumber &&

                row.reel_number ===
                    reelNumber
        );


    if (duplicate) {

        message.textContent =
            "This Lot / Reel has already been added.";

        return;
    }


    // -------------------------------------------------
    // ADD
    // -------------------------------------------------

    traceabilityRows.push({

        temp_id:
            crypto.randomUUID(),

        part_number:
            partNumber,

        part_name:
            partName,

        lot_number:
            lotNumber,

        reel_number:
            reelNumber,

        lot_qty:
            lotQty,

        input_method:
            traceabilityInputMethod

    });


    renderTraceabilityRows();


    clearTraceabilityInput();


    message.textContent =
        "Affected lot added.";

}


// =====================================================
// REMOVE TRACEABILITY ROW
// =====================================================

function removeTraceabilityRow(
    tempId
) {

    traceabilityRows =
        traceabilityRows.filter(
            row =>
                row.temp_id !==
                tempId
        );


    renderTraceabilityRows();
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeTraceHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// RENDER TRACEABILITY
// =====================================================

function renderTraceabilityRows() {

    const tbody =
        el("traceability-list");

    const totalElement =
        el("traceability-total");


    if (!tbody) {
        return;
    }


    if (
        traceabilityRows.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty"
                >
                    No affected lots added.
                </td>
            </tr>
        `;


        if (totalElement) {
            totalElement.textContent = "0";
        }


        return;
    }


    tbody.innerHTML =
        traceabilityRows
            .map(
                (row, index) => `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeTraceHtml(
                                row.part_number
                            )}
                        </td>

                        <td>
                            ${escapeTraceHtml(
                                row.part_name
                            )}
                        </td>

                        <td>
                            ${escapeTraceHtml(
                                row.lot_number
                            )}
                        </td>

                        <td>
                            ${escapeTraceHtml(
                                row.reel_number ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${
                                Number(
                                    row.lot_qty
                                ).toLocaleString()
                            }
                        </td>

                        <td>
                            ${escapeTraceHtml(
                                row.input_method
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="
                                    btn
                                    btn-secondary
                                    trace-delete-btn
                                "
                                data-trace-id="${
                                    row.temp_id
                                }"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>
                `
            )
            .join("");


    const total =
        traceabilityRows.reduce(
            (sum, row) =>
                sum +
                Number(
                    row.lot_qty || 0
                ),
            0
        );


    if (totalElement) {

        totalElement.textContent =
            total.toLocaleString();

    }
}

// =====================================================
// START TRACEABILITY QR SCANNER
// =====================================================

async function startTraceabilityScanner() {

    const message =
        el("traceability-message");


    if (
        !("BarcodeDetector" in window)
    ) {

        message.textContent =
            "QR scanning is not supported by this browser.";

        return;
    }


    try {

        const detector =
            new BarcodeDetector({
                formats: ["qr_code"]
            });


        traceabilityStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },

                    audio: false

                });


        const video =
            el("traceability-qr-video");


        video.srcObject =
            traceabilityStream;


        el(
            "traceability-scanner-container"
        ).style.display =
            "block";


        traceabilityScanActive =
            true;


        await video.play();


        async function detectQR() {

            if (
                !traceabilityScanActive
            ) {
                return;
            }


            try {

                const codes =
                    await detector.detect(
                        video
                    );


                if (
                    codes.length > 0
                ) {

                    const rawValue =
                        codes[0]
                            .rawValue;


                    const parsed =
                        parseTraceabilityQR(
                            rawValue
                        );


                    applyTraceabilityQR(
                        parsed
                    );


                    stopTraceabilityScanner();

                    return;
                }

            } catch (error) {

                console.warn(
                    "QR detection:",
                    error
                );

            }


            requestAnimationFrame(
                detectQR
            );
        }


        detectQR();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        message.textContent =
            "Unable to access camera.";

    }
}


// =====================================================
// STOP TRACEABILITY QR SCANNER
// =====================================================

function stopTraceabilityScanner() {

    traceabilityScanActive =
        false;


    if (traceabilityStream) {

        traceabilityStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        traceabilityStream =
            null;
    }


    const video =
        el("traceability-qr-video");


    if (video) {

        video.srcObject =
            null;

    }


    const container =
        el(
            "traceability-scanner-container"
        );


    if (container) {

        container.style.display =
            "none";

    }
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
// CONFIRM WORKFLOW ASSIGNMENT
// =====================================================

el("confirm-assignment")
    ?.addEventListener(
        "click",
        async () => {

            const responsiblePic =
                el("responsible-pic").value;

            const peEngineer =
                el("pe-engineer").value;

            const productionSupervisor =
                el(
                    "production-supervisor"
                ).value;

            const qaEngineer =
                el("qa-engineer").value;

            const comments =
                el("qc-comment")
                    .value
                    .trim();

            const message =
                el("assignment-message");

            const button =
                el("confirm-assignment");


            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                !responsiblePic ||
                !peEngineer ||
                !productionSupervisor ||
                !qaEngineer
            ) {

                message.textContent =
                    "Please complete all workflow assignments.";

                return;
            }


            if (!currentNCA?.id) {

                message.textContent =
                    "NCA data is not available.";

                return;
            }


            // ==========================================
            // CONFIRM
            // ==========================================

            const confirmed =
                window.confirm(
                    "Confirm workflow assignment for this NCA?"
                );


            if (!confirmed) {
                return;
            }


            // ==========================================
            // PROCESSING
            // ==========================================

            button.disabled =
                true;

            message.textContent =
                "Creating workflow assignments...";


            const {
                data,
                error
            } =
                await supabase.rpc(
                    "confirm_qc_assignment",
                    {

                        p_nca_id:
                            currentNCA.id,

                        p_responsible_pic:
                            responsiblePic,

                        p_pe_engineer:
                            peEngineer,

                        p_production_supervisor:
                            productionSupervisor,

                        p_qa_engineer:
                            qaEngineer,

                        p_comments:
                            comments || null

                    }
                );


            button.disabled =
                false;


            // ==========================================
            // ERROR
            // ==========================================

            if (error) {

                console.error(
                    "Confirm assignment error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Failed to create assignments.";

                return;
            }


            if (!data?.success) {

                message.textContent =
                    "Assignment failed.";

                return;
            }


            // ==========================================
            // SUCCESS
            // ==========================================

            message.textContent =
                "Workflow assignment completed successfully.";


            setTimeout(
                () => {

                    window.location.href =
                        "./nca-detail.html?id=" +
                        currentNCA.id;

                },
                800
            );

        }
    );

// =====================================================
// TRACEABILITY EVENTS
// =====================================================

el("add-traceability")
    ?.addEventListener(
        "click",
        addTraceabilityRow
    );


el("clear-traceability")
    ?.addEventListener(
        "click",
        () => {

            clearTraceabilityInput();

            el(
                "traceability-message"
            ).textContent = "";

        }
    );


el("scan-traceability-qr")
    ?.addEventListener(
        "click",
        startTraceabilityScanner
    );


el("stop-traceability-scan")
    ?.addEventListener(
        "click",
        stopTraceabilityScanner
    );


el("traceability-list")
    ?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-trace-id]"
                );


            if (!button) {
                return;
            }


            removeTraceabilityRow(
                button.dataset.traceId
            );

        }
    );


// Stop camera if user leaves page

window.addEventListener(
    "beforeunload",
    stopTraceabilityScanner
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
