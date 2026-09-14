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
// GENERATE NCA NUMBER
// =========================================================

function generateNcaNumber() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    const hour =
        String(now.getHours())
            .padStart(2, "0");

    const minute =
        String(now.getMinutes())
            .padStart(2, "0");

    const second =
        String(now.getSeconds())
            .padStart(2, "0");


    return `NCA-${year}${month}${day}-${hour}${minute}${second}`;
}


// =========================================================
// INITIALIZE
// =========================================================

async function initializePage() {

    try {

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
            error
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


        if (error || !profile) {

            await supabase.auth.signOut();

            window.location.href =
                "../index.html";

            return;
        }


        // -----------------------------------------
        // Check Active
        // -----------------------------------------

        if (!profile.active) {

            await supabase.auth.signOut();

            alert(
                "This account is inactive."
            );

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


        document.getElementById(
            "created-by"
        ).value =
            `${profile.full_name} (${profile.badge_id})`;


        // -----------------------------------------
        // Generate NCA Number
        // -----------------------------------------

        document.getElementById(
            "nca-number"
        ).value =
            generateNcaNumber();


    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

    }

}


// =========================================================
// SAVE NCA
// =========================================================

document
    .getElementById("save-button")
    .addEventListener(
        "click",
        saveNca
    );


async function saveNca() {

    const defectName =
        document.getElementById(
            "defect-name"
        ).value.trim();


    const description =
        document.getElementById(
            "description"
        ).value.trim();


    const ncaNumber =
        document.getElementById(
            "nca-number"
        ).value;


    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!defectName) {

        showMessage(
            "Please enter Defect Name.",
            "error"
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "save-button"
        );


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    try {

        // -----------------------------------------
        // INSERT NCA
        // -----------------------------------------

        const {
            data,
            error
        } = await supabase
            .from("nca")
            .insert([
                {
                    nca_number:
                        ncaNumber,

                    created_by:
                        currentProfile.id,

                    nca_status:
                        "DRAFT",

                    approval_status:
                        "WAITING QC SUPERVISOR"
                }
            ])
            .select()
            .single();


        if (error) {

            throw error;
        }


        console.log(
            "NCA created:",
            data
        );


        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        showMessage(
            `NCA ${data.nca_number} created successfully.`,
            "success"
        );


        saveButton.textContent =
            "Saved";


        // Go back after short delay

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1000);


    } catch (error) {

        console.error(
            "Save NCA error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );


        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save NCA";
    }

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "form-message"
        );


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;
}


// =========================================================
// BACK / CANCEL
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


document
    .getElementById("cancel-button")
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
