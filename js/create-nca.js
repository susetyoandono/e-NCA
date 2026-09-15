// =========================================================
// e-NCA - Create NCA
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL
// =========================================================

let currentUser = null;
let currentProfile = null;


// =========================================================
// DOM ELEMENTS
// =========================================================

const userName =
    document.getElementById("user-name");

const userRole =
    document.getElementById("user-role");

const ncaNumberInput =
    document.getElementById("nca-number");

const reportedDateInput =
    document.getElementById("reported-date");

const createdByInput =
    document.getElementById("created-by");

const departmentInput =
    document.getElementById("department");

const defectNameInput =
    document.getElementById("defect-name");

const defectCategoryInput =
    document.getElementById("defect-category");

const processStationInput =
    document.getElementById("process-station");

const partNumberInput =
    document.getElementById("part-number");

const partNameInput =
    document.getElementById("part-name");

const lotNumberInput =
    document.getElementById("lot-number");

const reelNumberInput =
    document.getElementById("reel-number");

const machineMoldInput =
    document.getElementById("machine-mold-no");

const detectionSourceInput =
    document.getElementById("detection-source");

const defectDescriptionInput =
    document.getElementById("defect-description");

const affectedQtyInput =
    document.getElementById("affected-qty");

const sampleSizeInput =
    document.getElementById("sample-size");

const defectiveQtyInput =
    document.getElementById("defective-qty");

const defectivePercentInput =
    document.getElementById("defective-percent");

const photoOkInput =
    document.getElementById("photo-ok");

const photoNgInput =
    document.getElementById("photo-ng");

const attachment1Input =
    document.getElementById("attachment-1");

const attachment2Input =
    document.getElementById("attachment-2");

const attachmentDescriptionInput =
    document.getElementById(
        "attachment-description"
    );

const cancelButton =
    document.getElementById("cancel-button");

const saveDraftButton =
    document.getElementById("save-draft-button");

const submitButton =
    document.getElementById("submit-button");

const logoutButton =
    document.getElementById("logout-button");

const scanQRButton =
    document.getElementById(
        "scan-flowsheet-qr"
    );

const formMessage =
    document.getElementById("form-message");


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);


async function initializePage() {

    try {

        await loadCurrentUser();

        generateNcaNumber();

        setReportedDate();

        setupDefectiveCalculation();

        setupButtons();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );

    }

}


// =========================================================
// LOAD CURRENT USER
// =========================================================

async function loadCurrentUser() {

    const {
        data: sessionData,
        error: sessionError
    } = await supabase.auth.getSession();


    if (
        sessionError ||
        !sessionData.session
    ) {

        window.location.href =
            "../index.html";

        return;

    }


    currentUser =
        sessionData.session.user;


    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profiles")
            .select(`
                id,
                badge_id,
                full_name,
                email,
                active,
                department_id,
                departments (
                    department_code,
                    department_name
                ),
                roles (
                    role_code,
                    role_name
                )
            `)
            .eq("id", currentUser.id)
            .single();


    if (
        profileError ||
        !profile
    ) {

        throw new Error(
            "User profile could not be loaded."
        );

    }


    if (!profile.active) {

        await supabase.auth.signOut();

        window.location.href =
            "../index.html";

        return;

    }


    currentProfile =
        profile;


    userName.textContent =
        profile.full_name ||
        profile.badge_id ||
        "-";


    userRole.textContent =
        profile.roles?.role_name ||
        "-";


    createdByInput.value =
        profile.full_name ||
        profile.badge_id ||
        "";


    departmentInput.value =
        profile.departments?.department_name ||
        profile.departments?.department_code ||
        "";

}


// =========================================================
// GENERATE NCA NUMBER
// =========================================================

function generateNcaNumber() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    const seconds =
        String(
            now.getSeconds()
        ).padStart(2, "0");


    const ncaNumber =
        `NCA-${year}${month}${day}-${hours}${minutes}${seconds}`;


    ncaNumberInput.value =
        ncaNumber;

}


// =========================================================
// REPORTED DATE
// =========================================================

function setReportedDate() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    reportedDateInput.value =
        `${year}-${month}-${day}`;

}


// =========================================================
// DEFECTIVE %
// =========================================================

function setupDefectiveCalculation() {

    affectedQtyInput.addEventListener(
        "input",
        calculateDefectivePercent
    );


    sampleSizeInput.addEventListener(
        "input",
        calculateDefectivePercent
    );


    defectiveQtyInput.addEventListener(
        "input",
        calculateDefectivePercent
    );

}


function calculateDefectivePercent() {

    const sampleSize =
        Number(
            sampleSizeInput.value
        );


    const defectiveQty =
        Number(
            defectiveQtyInput.value
        );


    if (
        !sampleSize ||
        sampleSize <= 0
    ) {

        defectivePercentInput.value =
            "0.00 %";

        return;

    }


    const percentage =
        (
            defectiveQty /
            sampleSize
        ) * 100;


    defectivePercentInput.value =
        `${percentage.toFixed(2)} %`;

}


// =========================================================
// QR PARSER
// =========================================================

function parseFlowsheetQR(qrText) {

    if (
        !qrText ||
        !qrText.trim()
    ) {

        throw new Error(
            "QR data is empty."
        );

    }


    const fields =
        qrText
            .trim()
            .split(",");


    if (
        fields.length <= 19
    ) {

        throw new Error(
            "Invalid Flowsheet QR format. " +
            "Expected at least 20 fields."
        );

    }


    return {

        qrIdentifier:
            fields[0]?.trim() || "",

        partNumber:
            fields[1]?.trim() || "",

        lotNumber:
            fields[2]?.trim() || "",

        machineMoldNo:
            fields[10]?.trim() || "",

        reelNumber:
            fields[18]?.trim() || "",

        partName:
            fields[19]?.trim() || ""

    };

}


// =========================================================
// APPLY QR DATA
// =========================================================

function applyQRData(qrData) {

    partNumberInput.value =
        qrData.partNumber;


    partNameInput.value =
        qrData.partName;


    lotNumberInput.value =
        qrData.lotNumber;


    reelNumberInput.value =
        qrData.reelNumber;


    machineMoldInput.value =
        qrData.machineMoldNo;


    showMessage(
        "Flowsheet QR data loaded successfully.",
        "success"
    );

}


// =====================================================
// FLOWSHEET QR SCANNER
// =====================================================

let qrScanner = null;
let qrScannerRunning = false;


// -----------------------------------------------------
// START QR SCANNER
// -----------------------------------------------------

async function startFlowsheetQRScanner() {

    const readerElement =
        document.getElementById("qr-reader");

    const statusElement =
        document.getElementById("qr-scan-status");


    if (!readerElement) return;


    readerElement.style.display = "block";


    if (statusElement) {

        statusElement.textContent =
            "Starting camera...";

    }


    // Stop previous scanner if still running

    if (qrScannerRunning && qrScanner) {

        try {

            await qrScanner.stop();

        } catch (error) {

            console.warn(
                "Previous scanner stop:",
                error
            );

        }

        qrScannerRunning = false;
    }


    qrScanner =
        new Html5Qrcode("qr-reader");


    try {

        await qrScanner.start(

            {
                facingMode: "environment"
            },

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                },

                aspectRatio: 1.0
            },

            async (decodedText) => {

                console.log(
                    "QR detected:",
                    decodedText
                );


                // Stop scanner immediately

                await stopFlowsheetQRScanner();


                // Parse QR

                parseFlowsheetQR(
                    decodedText
                );

            },

            (errorMessage) => {

                // Normal scanning errors.
                // Do not display continuously.

            }
        );


        qrScannerRunning = true;


        if (statusElement) {

            statusElement.textContent =
                "Camera active. Point the camera at the Flowsheet QR.";

        }


    } catch (error) {

        console.error(
            "QR scanner error:",
            error
        );


        readerElement.style.display =
            "none";


        if (statusElement) {

            statusElement.textContent =
                "Unable to access camera. Please allow camera permission and try again.";

        }

    }
}


// -----------------------------------------------------
// STOP QR SCANNER
// -----------------------------------------------------

async function stopFlowsheetQRScanner() {

    const readerElement =
        document.getElementById("qr-reader");

    const statusElement =
        document.getElementById("qr-scan-status");


    if (
        qrScanner &&
        qrScannerRunning
    ) {

        try {

            await qrScanner.stop();

        } catch (error) {

            console.warn(
                "QR scanner stop error:",
                error
            );

        }

        qrScannerRunning = false;
    }


    if (readerElement) {

        readerElement.style.display =
            "none";

        readerElement.innerHTML = "";

    }


    if (statusElement) {

        statusElement.textContent = "";

    }
}


// -----------------------------------------------------
// PARSE FLOWSHEET QR
// -----------------------------------------------------

function parseFlowsheetQR(qrData) {

    if (!qrData) {

        alert(
            "QR code is empty."
        );

        return;
    }


    /*
        Expected example:

        DAI1SEIKO007,
        20982-051E-01-00F0,
        250924B131,
        ...,
        3BN13,
        ...,
        7,
        MINIFLEX3-BFN L-HD TYPE 51P,
        ...
    */


    const values =
        qrData
            .split(",")
            .map(value =>
                value.trim()
            );


    const partNumber =
        values[1] || "";

    const lotNumber =
        values[2] || "";

    const machineMoldNo =
        values[10] || "";

    const reelNumber =
        values[18] || "";

    const partName =
        values[19] || "";


    // Populate fields

    const partNumberInput =
        document.getElementById(
            "part-number"
        );

    const partNameInput =
        document.getElementById(
            "part-name"
        );

    const lotNumberInput =
        document.getElementById(
            "lot-number"
        );

    const reelNumberInput =
        document.getElementById(
            "reel-number"
        );

    const machineMoldInput =
        document.getElementById(
            "machine-mold-no"
        );


    if (partNumberInput) {

        partNumberInput.value =
            partNumber;
    }


    if (partNameInput) {

        partNameInput.value =
            partName;
    }


    if (lotNumberInput) {

        lotNumberInput.value =
            lotNumber;
    }


    if (reelNumberInput) {

        reelNumberInput.value =
            reelNumber;
    }


    if (machineMoldInput) {

        machineMoldInput.value =
            machineMoldNo;
    }


    const statusElement =
        document.getElementById(
            "qr-scan-status"
        );


    if (statusElement) {

        statusElement.textContent =
            "QR scanned successfully.";

        statusElement.classList.add(
            "success"
        );

    }
}


// =====================================================
// QR BUTTON
// =====================================================

document
    .getElementById("scan-flowsheet-qr")
    ?.addEventListener(
        "click",
        startFlowsheetQRScanner
    );



// =========================================================
// VALIDATION
// =========================================================

function validateForm() {

    const requiredFields = [

        {
            element: defectNameInput,
            name: "Defect Name"
        },

        {
            element: defectCategoryInput,
            name: "Defect Category"
        },

        {
            element: processStationInput,
            name: "Process / Station"
        },

        {
            element: detectionSourceInput,
            name: "Detection Source"
        },

        {
            element: defectDescriptionInput,
            name: "Defect Description"
        },

        {
            element: affectedQtyInput,
            name: "Affected Qty"
        },

        {
            element: sampleSizeInput,
            name: "Sample Size"
        },

        {
            element: defectiveQtyInput,
            name: "Defective Qty"
        }

    ];


    for (
        const field
        of requiredFields
    ) {

        if (
            !field.element.value.trim()
        ) {

            field.element.focus();

            throw new Error(
                `${field.name} is required.`
            );

        }

    }


    const affectedQty =
        Number(
            affectedQtyInput.value
        );


    const sampleSize =
        Number(
            sampleSizeInput.value
        );


    const defectiveQty =
        Number(
            defectiveQtyInput.value
        );


    if (
        affectedQty < 0 ||
        sampleSize < 0 ||
        defectiveQty < 0
    ) {

        throw new Error(
            "Quantity cannot be negative."
        );

    }


    if (
        sampleSize === 0
    ) {

        throw new Error(
            "Sample Size must be greater than 0."
        );

    }


    if (
        defectiveQty > sampleSize
    ) {

        throw new Error(
            "Defective Qty cannot be greater than Sample Size."
        );

    }


    if (
        sampleSize > affectedQty
    ) {

        throw new Error(
            "Sample Size cannot be greater than Affected Qty."
        );

    }


    return true;

}


// =========================================================
// GET FORM DATA
// =========================================================

function getFormData() {

    const sampleSize =
        Number(
            sampleSizeInput.value
        );


    const defectiveQty =
        Number(
            defectiveQtyInput.value
        );


    const defectivePercent =
        sampleSize > 0
            ? (
                defectiveQty /
                sampleSize
            ) * 100
            : 0;


    return {

        nca_number:
            ncaNumberInput.value.trim(),

        reported_date:
            reportedDateInput.value,

        created_by:
            currentProfile.id,

        defect_name:
            defectNameInput.value.trim(),

        defect_category:
            defectCategoryInput.value,

        process_station:
            processStationInput.value.trim(),

        part_number:
            partNumberInput.value.trim() ||
            null,

        part_name:
            partNameInput.value.trim() ||
            null,

        lot_number:
            lotNumberInput.value.trim() ||
            null,

        reel_number:
            reelNumberInput.value.trim() ||
            null,

        machine_mold_no:
            machineMoldInput.value.trim() ||
            null,

        detection_source:
            detectionSourceInput.value,

        defect_description:
            defectDescriptionInput.value.trim(),

        affected_qty:
            Number(
                affectedQtyInput.value
            ),

        sample_size:
            sampleSize,

        defective_qty:
            defectiveQty,

        defective_percent:
            Number(
                defectivePercent.toFixed(2)
            )

    };

}


// =========================================================
// FILE HELPERS
// =========================================================

function getFileExtension(
    fileName
) {

    const parts =
        fileName.split(".");


    if (
        parts.length <= 1
    ) {

        return "";

    }


    return (
        "." +
        parts
            .pop()
            .toLowerCase()
    );

}


function sanitizeFileName(
    fileName
) {

    return fileName
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


function generateUniqueFileName(
    prefix,
    originalName
) {

    const extension =
        getFileExtension(
            originalName
        );


    const timestamp =
        Date.now();


    const random =
        Math.random()
            .toString(36)
            .substring(2, 8);


    return (
        `${prefix}_${timestamp}_${random}${extension}`
    );

}


// =========================================================
// UPLOAD ONE FILE
// =========================================================

async function uploadAttachment(
    ncaId,
    ncaNumber,
    file,
    fileType,
    prefix
) {

    if (!file) {

        return null;

    }


    const safeOriginalName =
        sanitizeFileName(
            file.name
        );


    const uniqueFileName =
        generateUniqueFileName(
            prefix,
            safeOriginalName
        );


    const folder =
        ncaNumber;


    const storagePath =
        `${folder}/${uniqueFileName}`;


    // ---------------------------------------------
    // Upload to Storage
    // ---------------------------------------------

    const {
        error: uploadError
    } =
        await supabase
            .storage
            .from("nca-attachments")
            .upload(
                storagePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false
                }
            );


    if (uploadError) {

        throw new Error(
            `Failed to upload ${fileType}: ` +
            uploadError.message
        );

    }


    // ---------------------------------------------
    // Save metadata
    // ---------------------------------------------

    const {
        error: metadataError
    } =
        await supabase
            .from("nca_attachments")
            .insert({

                nca_id:
                    ncaId,

                uploaded_by:
                    currentProfile.id,

                file_type:
                    fileType,

                file_name:
                    file.name,

                storage_path:
                    storagePath,

                attachment_description:
                    attachmentDescriptionInput
                        .value
                        .trim() ||
                    null

            });


    if (metadataError) {

        // Try to remove uploaded file
        await supabase
            .storage
            .from("nca-attachments")
            .remove([
                storagePath
            ]);


        throw new Error(
            `Failed to save ${fileType} metadata: ` +
            metadataError.message
        );

    }


    return {

        storagePath:
            storagePath,

        fileName:
            file.name,

        fileType:
            fileType

    };

}


// =========================================================
// UPLOAD ALL EVIDENCE
// =========================================================

async function uploadAllEvidence(
    nca
) {

    const uploadedFiles = [];


    // ---------------------------------------------
    // Photo OK
    // ---------------------------------------------

    if (
        photoOkInput.files.length > 0
    ) {

        const result =
            await uploadAttachment(

                nca.id,

                nca.nca_number,

                photoOkInput.files[0],

                "PHOTO_OK",

                "photo-ok"

            );


        uploadedFiles.push(
            result
        );

    }


    // ---------------------------------------------
    // Photo NG
    // ---------------------------------------------

    if (
        photoNgInput.files.length > 0
    ) {

        const result =
            await uploadAttachment(

                nca.id,

                nca.nca_number,

                photoNgInput.files[0],

                "PHOTO_NG",

                "photo-ng"

            );


        uploadedFiles.push(
            result
        );

    }


    // ---------------------------------------------
    // Attachment 1
    // ---------------------------------------------

    if (
        attachment1Input.files.length > 0
    ) {

        const result =
            await uploadAttachment(

                nca.id,

                nca.nca_number,

                attachment1Input.files[0],

                "ATTACHMENT_1",

                "attachment-1"

            );


        uploadedFiles.push(
            result
        );

    }


    // ---------------------------------------------
    // Attachment 2
    // ---------------------------------------------

    if (
        attachment2Input.files.length > 0
    ) {

        const result =
            await uploadAttachment(

                nca.id,

                nca.nca_number,

                attachment2Input.files[0],

                "ATTACHMENT_2",

                "attachment-2"

            );


        uploadedFiles.push(
            result
        );

    }


    return uploadedFiles;

}


// =========================================================
// SAVE NCA
// =========================================================

async function saveNCA(
    submitToQC = false
) {

    try {

        validateForm();


        setButtonsDisabled(
            true
        );


        showMessage(
            "Saving NCA...",
            "info"
        );


        const formData =
            getFormData();


        const approvalStatus =
            "WAITING QC SUPERVISOR";


        // ---------------------------------------------
        // INSERT NCA
        // ---------------------------------------------

        const {
            data: nca,
            error: ncaError
        } =
            await supabase
                .from("nca")
                .insert({

                    nca_number:
                        formData.nca_number,

                    reported_date:
                        formData.reported_date,

                    created_by:
                        formData.created_by,

                    nca_status:
                        "DRAFT",

                    approval_status:
                        approvalStatus,

                    defect_name:
                        formData.defect_name,

                    defect_category:
                        formData.defect_category,

                    process_station:
                        formData.process_station,

                    part_number:
                        formData.part_number,

                    part_name:
                        formData.part_name,

                    lot_number:
                        formData.lot_number,

                    reel_number:
                        formData.reel_number,

                    machine_mold_no:
                        formData.machine_mold_no,

                    detection_source:
                        formData.detection_source,

                    defect_description:
                        formData.defect_description,

                    affected_qty:
                        formData.affected_qty,

                    sample_size:
                        formData.sample_size,

                    defective_qty:
                        formData.defective_qty,

                    defective_percent:
                        formData.defective_percent

                })
                .select()
                .single();


        if (ncaError) {

            throw ncaError;

        }


        // ---------------------------------------------
        // UPLOAD EVIDENCE
        // ---------------------------------------------

        showMessage(
            "NCA saved. Uploading evidence...",
            "info"
        );


        await uploadAllEvidence(
            nca
        );


        // ---------------------------------------------
        // WORKFLOW
        // ---------------------------------------------

        const {
            error: workflowError
        } =
            await supabase
                .from("nca_workflow")
                .insert({

                    nca_id:
                        nca.id,

                    from_status:
                        null,

                    to_status:
                        "DRAFT",

                    from_approval_status:
                        null,

                    to_approval_status:
                        approvalStatus,

                    action_by:
                        currentProfile.id,

                    action_type:
                        submitToQC
                            ? "SUBMIT"
                            : "CREATE",

                    comments:
                        submitToQC
                            ? "NCA submitted to QC Supervisor."
                            : "NCA saved as draft."

                });


        if (workflowError) {

            throw workflowError;

        }


        showMessage(
            submitToQC
                ? "NCA submitted successfully."
                : "NCA draft saved successfully.",
            "success"
        );


        setTimeout(
            () => {

                window.location.href =
                    "nca-detail.html?id=" +
                    nca.id;

            },
            1000
        );


    } catch (error) {

        console.error(
            "Save NCA error:",
            error
        );


        showMessage(
            error.message ||
            "Failed to save NCA.",
            "error"
        );


        setButtonsDisabled(
            false
        );

    }

}


// =========================================================
// BUTTONS
// =========================================================

function setupButtons() {


    saveDraftButton.addEventListener(
        "click",
        () => {

            saveNCA(false);

        }
    );


    submitButton.addEventListener(
        "click",
        () => {

            saveNCA(true);

        }
    );


    cancelButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );


    logoutButton.addEventListener(
        "click",
        async () => {

            await supabase.auth.signOut();

            window.location.href =
                "../index.html";

        }
    );


    scanQRButton.addEventListener(
        "click",
        testQRParser
    );

}


// =========================================================
// BUTTON STATE
// =========================================================

function setButtonsDisabled(
    disabled
) {

    saveDraftButton.disabled =
        disabled;

    submitButton.disabled =
        disabled;

    cancelButton.disabled =
        disabled;

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type = "info"
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message ${type}`;

}
