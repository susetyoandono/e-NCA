import { supabase } from "./supabase.js";


// =====================================================
// ELEMENT HELPER
// =====================================================

function el(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = el(id);

    if (!element) return;

    element.textContent =
        value !== null &&
        value !== undefined &&
        value !== ""
            ? value
            : "-";
}


// =====================================================
// FORMAT
// =====================================================

function formatDate(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function formatDateTime(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =====================================================
// CURRENT USER
// =====================================================

async function loadCurrentUser() {

    const {
        data: {
            session
        }
    } = await supabase.auth.getSession();


    if (!session) {

        window.location.href =
            "../index.html";

        return null;
    }


    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .select(`
            *,
            departments (
                department_code,
                department_name
            ),
            roles (
                role_code,
                role_name
            )
        `)
        .eq("id", session.user.id)
        .single();


    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return null;
    }


    setText(
        "user-name",
        profile.full_name ||
        profile.email
    );


    setText(
        "user-role",
        profile.roles?.role_name || "-"
    );


    return profile;
}


// =====================================================
// GET NCA ID
// =====================================================

function getNcaId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// =====================================================
// LOAD NCA
// =====================================================

async function loadNCA(ncaId) {

    const {
        data: nca,
        error
    } = await supabase
        .from("nca")
        .select("*")
        .eq("id", ncaId)
        .single();


    if (error) {

        console.error(
            "NCA error:",
            error
        );

        alert(
            "Failed to load NCA."
        );

        return null;
    }


    return nca;
}


// =====================================================
// PROFILE
// =====================================================

async function getProfile(userId) {

    if (!userId) return null;


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            *,
            departments (
                department_code,
                department_name
            ),
            roles (
                role_code,
                role_name
            )
        `)
        .eq("id", userId)
        .single();


    if (error) {

        console.error(
            "Profile lookup error:",
            error
        );

        return null;
    }


    return data;
}


// =====================================================
// NCA DETAIL
// =====================================================

async function displayNCA(nca) {

    document.title =
        `e-NCA - ${nca.nca_number || "NCA Detail"}`;


    setText(
        "nca-number-title",
        nca.nca_number
    );


    // STATUS

    setText(
        "nca-status",
        nca.nca_status
    );


    setText(
        "approval-status",
        nca.approval_status
    );


    setText(
        "created-date",
        formatDateTime(
            nca.created_at
        )
    );


    // CREATED BY

    const creator =
        await getProfile(
            nca.created_by
        );


    if (creator) {

        setText(
            "created-by",
            creator.full_name ||
            creator.badge_id ||
            creator.email
        );


        setText(
            "department",
            creator.departments?.department_name ||
            creator.departments?.department_code ||
            "-"
        );

    }


    // ASSIGNEE

    const assignee =
        await getProfile(
            nca.current_assignee
        );


    if (assignee) {

        setText(
            "current-assignee",
            assignee.full_name ||
            assignee.badge_id ||
            assignee.email
        );

    }


    // INFORMATION

    setText(
        "nca-number",
        nca.nca_number
    );

    setText(
        "reported-date",
        formatDate(
            nca.reported_date
        )
    );

    setText(
        "defect-name",
        nca.defect_name
    );

    setText(
        "defect-category",
        nca.defect_category
    );

    setText(
        "process-station",
        nca.process_station
    );

    setText(
        "detection-source",
        nca.detection_source
    );

    setText(
        "part-number",
        nca.part_number
    );

    setText(
        "part-name",
        nca.part_name
    );

    setText(
        "lot-number",
        nca.lot_number
    );

    setText(
        "reel-number",
        nca.reel_number
    );

    setText(
        "machine-mold-no",
        nca.machine_mold_no
    );

    setText(
        "defect-description",
        nca.defect_description
    );


    // QUANTITY

    setText(
        "affected-qty",
        nca.affected_qty
    );

    setText(
        "sample-size",
        nca.sample_size
    );

    setText(
        "defective-qty",
        nca.defective_qty
    );


    if (
        nca.defective_percent !== null &&
        nca.defective_percent !== undefined
    ) {

        setText(
            "defective-percent",
            `${Number(
                nca.defective_percent
            ).toFixed(2)} %`
        );

    }


    // PRINT DATA

    setText(
        "print-nca-number",
        nca.nca_number
    );

    setText(
        "print-part-number",
        nca.part_number
    );

    setText(
        "print-part-name",
        nca.part_name
    );

    setText(
        "print-defect-name",
        nca.defect_name
    );

    setText(
        "print-defect-description",
        nca.defect_description
    );


    generateQRCode(nca.id);
}


// =====================================================
// GENERATE UNIQUE QR
// =====================================================

function generateQRCode(ncaId) {

    const container =
        el("print-qrcode");


    if (!container) return;


    container.innerHTML = "";


    /*
       Example URL:

       https://yourgithub.github.io/e-NCA/pages/nca-detail.html?id=UUID
    */

    const ncaUrl =
        new URL(
            `nca-detail.html?id=${encodeURIComponent(ncaId)}`,
            window.location.href
        ).href;


    new QRCode(
        container,
        {
            text: ncaUrl,
            width: 110,
            height: 110,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel:
                QRCode.CorrectLevel.M
        }
    );
}


// =====================================================
// LOAD ATTACHMENTS
// =====================================================

async function loadAttachments(nca) {

    const container =
        el("evidence-container");


    container.innerHTML = `
        <div class="empty-message">
            Loading evidence...
        </div>
    `;


    const {
        data: attachments,
        error
    } = await supabase
        .from("nca_attachments")
        .select("*")
        .eq("nca_id", nca.id)
        .order("created_at", {
            ascending: true
        });


    if (error) {

        console.error(
            "Attachment error:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">
                Failed to load attachments.
            </div>
        `;

        return;
    }


    if (
        !attachments ||
        attachments.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No evidence or attachment uploaded.
            </div>
        `;

        return;
    }


    const photoOK =
        attachments.find(
            item =>
                item.file_type === "PHOTO_OK"
        );


    const photoNG =
        attachments.find(
            item =>
                item.file_type === "PHOTO_NG"
        );


    const attachment1 =
        attachments.find(
            item =>
                item.file_type === "ATTACHMENT_1"
        );


    const attachment2 =
        attachments.find(
            item =>
                item.file_type === "ATTACHMENT_2"
        );


    container.innerHTML = "";


    // PHOTOS

    if (photoOK || photoNG) {

        const photoSection =
            document.createElement("div");

        photoSection.className =
            "evidence-photo-grid";


        if (photoOK) {

            const card =
                await createPhotoCard(
                    "Photo OK",
                    photoOK
                );

            photoSection.appendChild(
                card
            );
        }


        if (photoNG) {

            const card =
                await createPhotoCard(
                    "Photo NG",
                    photoNG
                );

            photoSection.appendChild(
                card
            );
        }


        container.appendChild(
            photoSection
        );
    }


    // ATTACHMENTS

    if (attachment1 || attachment2) {

        const list =
            document.createElement("div");

        list.className =
            "attachment-list";


        if (attachment1) {

            list.appendChild(
                await createAttachmentLink(
                    "Attachment 1",
                    attachment1
                )
            );
        }


        if (attachment2) {

            list.appendChild(
                await createAttachmentLink(
                    "Attachment 2",
                    attachment2
                )
            );
        }


        container.appendChild(
            list
        );
    }


    // DESCRIPTION

    const description =
        attachments.find(
            item =>
                item.attachment_description
        );


    if (
        description &&
        description.attachment_description
    ) {

        const box =
            document.createElement("div");

        box.className =
            "attachment-description";


        box.innerHTML = `
            <strong>
                Attachment Description
            </strong>

            <div>
                ${escapeHtml(
                    description.attachment_description
                )}
            </div>
        `;


        container.appendChild(box);
    }


    // PRINT PHOTOS

    if (photoOK) {

        await loadPrintPhoto(
            photoOK,
            "print-photo-ok"
        );
    }


    if (photoNG) {

        await loadPrintPhoto(
            photoNG,
            "print-photo-ng"
        );
    }
}


// =====================================================
// SIGNED URL
// =====================================================

async function getSignedUrl(
    storagePath
) {

    const {
        data,
        error
    } = await supabase
        .storage
        .from("nca-attachments")
        .createSignedUrl(
            storagePath,
            3600
        );


    if (error) {

        console.error(
            "Signed URL error:",
            error
        );

        return null;
    }


    return data.signedUrl;
}


// =====================================================
// PHOTO CARD
// =====================================================

async function createPhotoCard(
    title,
    attachment
) {

    const card =
        document.createElement("div");

    card.className =
        "evidence-photo-card";


    const url =
        await getSignedUrl(
            attachment.storage_path
        );


    if (!url) {

        card.innerHTML = `
            <h3>${title}</h3>

            <div class="empty-message">
                Unable to load image.
            </div>
        `;

        return card;
    }


    card.innerHTML = `

        <h3>
            ${title}
        </h3>

        <a
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
        >

            <img
                src="${url}"
                alt="${title}"
                class="evidence-photo"
            >

        </a>

        <div class="file-name">

            ${escapeHtml(
                attachment.file_name
            )}

        </div>
    `;


    return card;
}


// =====================================================
// PRINT PHOTO
// =====================================================

async function loadPrintPhoto(
    attachment,
    elementId
) {

    const container =
        el(elementId);


    if (!container) return;


    const url =
        await getSignedUrl(
            attachment.storage_path
        );


    if (!url) {

        container.textContent =
            "Image unavailable";

        return;
    }


    container.innerHTML = `

        <img
            src="${url}"
            class="print-photo"
            alt="NCA evidence"
        >
    `;
}


// =====================================================
// ATTACHMENT LINK
// =====================================================

async function createAttachmentLink(
    title,
    attachment
) {

    const item =
        document.createElement("div");

    item.className =
        "attachment-item";


    const url =
        await getSignedUrl(
            attachment.storage_path
        );


    if (!url) {

        item.innerHTML = `
            <strong>
                ${title}
            </strong>

            <span>
                Unable to generate file link.
            </span>
        `;

        return item;
    }


    item.innerHTML = `

        <div>

            <strong>
                ${title}
            </strong>

            <div class="file-name">

                ${escapeHtml(
                    attachment.file_name
                )}

            </div>

        </div>


        <a
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary"
        >
            Open File
        </a>
    `;


    return item;
}


// =====================================================
// WORKFLOW
// =====================================================

async function loadWorkflow(ncaId) {

    const container =
        el("workflow-container");


    const {
        data: workflow,
        error
    } = await supabase
        .from("nca_workflow")
        .select(`
            *,
            profiles (
                full_name,
                badge_id
            )
        `)
        .eq("nca_id", ncaId)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Workflow error:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">
                Failed to load workflow history.
            </div>
        `;

        return;
    }


    if (
        !workflow ||
        workflow.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No workflow history.
            </div>
        `;

        return;
    }


    container.innerHTML =
        workflow.map(item => {

            const user =
                item.profiles?.full_name ||
                item.profiles?.badge_id ||
                "-";


            return `

                <div class="workflow-item">

                    <div class="workflow-header">

                        <strong>

                            ${escapeHtml(
                                item.action_type || "-"
                            )}

                        </strong>


                        <span>

                            ${formatDateTime(
                                item.created_at
                            )}

                        </span>

                    </div>


                    <div class="workflow-status">

                        ${escapeHtml(
                            item.from_status || "-"
                        )}

                        →

                        ${escapeHtml(
                            item.to_status || "-"
                        )}

                    </div>


                    <div class="workflow-approval">

                        Approval:

                        ${escapeHtml(
                            item.from_approval_status || "-"
                        )}

                        →

                        ${escapeHtml(
                            item.to_approval_status || "-"
                        )}

                    </div>


                    <div class="workflow-user">

                        By:

                        ${escapeHtml(
                            user
                        )}

                    </div>


                    ${
                        item.comments
                        ?
                        `
                        <div class="workflow-comment">

                            ${escapeHtml(
                                item.comments
                            )}

                        </div>
                        `
                        :
                        ""
                    }

                </div>

            `;

        }).join("");
}


// =====================================================
// PRINT
// =====================================================

function printNCA() {

    window.print();
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// LOGOUT
// =====================================================

el("logout-button")
    ?.addEventListener(
        "click",
        async () => {

            await supabase.auth.signOut();

            window.location.href =
                "../index.html";
        }
    );


// =====================================================
// PRINT BUTTON
// =====================================================

el("print-nca-button")
    ?.addEventListener(
        "click",
        printNCA
    );


// =====================================================
// INIT
// =====================================================

async function init() {

    const profile =
        await loadCurrentUser();


    if (!profile) return;


    const ncaId =
        getNcaId();


    if (!ncaId) {

        alert(
            "NCA ID is missing."
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    const nca =
        await loadNCA(ncaId);


    if (!nca) return;


    await displayNCA(nca);

    await loadAttachments(nca);

    await loadWorkflow(nca.id);
}


init();
