import { supabase } from "./supabase.js";


// =====================================================
// GLOBAL
// =====================================================

let currentUser = null;
let currentProfile = null;

let users = [];
let roles = [];
let departments = [];
let jobPositions = [];


// =====================================================
// DOM
// =====================================================

const tableBody =
    document.getElementById("user-table-body");

const modal =
    document.getElementById("user-modal");

const userForm =
    document.getElementById("user-form");


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", init);


async function init() {

    try {

        await loadRoles();
        
        await loadDepartments();
        
        await loadJobPositions();
        
        await loadUsers();

        setupEvents();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load User Management."
        );

    }

}


// =====================================================
// ADMIN CHECK
// =====================================================

async function checkAdmin() {

    const {
        data: {
            user
        },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href =
            "../index.html";

        return;

    }


    currentUser = user;


    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select(`
            *,
            roles (
                role_code,
                role_name
            )
        `)
        .eq("id", user.id)
        .single();


    if (profileError) {
        throw profileError;
    }


    currentProfile = profile;


    if (
        !profile.roles ||
        profile.roles.role_code !== "ADMIN"
    ) {

        alert(
            "Access denied. Administrator access required."
        );

        window.location.href =
            "dashboard.html";

        return;

    }


    document.getElementById(
        "header-user-name"
    ).textContent =
        profile.full_name || profile.badge_id;


    document.getElementById(
        "header-user-role"
    ).textContent =
        profile.roles.role_name;

}


// =====================================================
// LOAD ROLES
// =====================================================

async function loadRoles() {

    const {
        data,
        error
    } = await supabase
        .from("roles")
        .select("*")
        .order("id");


    if (error) {
        throw error;
    }


    roles = data || [];


    const filter =
        document.getElementById(
            "filter-role"
        );

    const select =
        document.getElementById(
            "role-id"
        );


    roles.forEach(role => {

        filter.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${role.id}">
                ${escapeHtml(role.role_name)}
            </option>
            `
        );


        select.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${role.id}">
                ${escapeHtml(role.role_name)}
            </option>
            `
        );

    });

}


// =====================================================
// LOAD DEPARTMENTS
// =====================================================

async function loadDepartments() {

    const {
        data,
        error
    } = await supabase
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("department_name");


    if (error) {
        throw error;
    }


    departments = data || [];


    const filter =
        document.getElementById(
            "filter-department"
        );

    const select =
        document.getElementById(
            "department-id"
        );


    departments.forEach(department => {

        const label =
            `${department.department_code} - ${department.department_name}`;


        filter.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${department.id}">
                ${escapeHtml(label)}
            </option>
            `
        );


        select.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${department.id}">
                ${escapeHtml(label)}
            </option>
            `
        );

    });

}

// =====================================================
// LOAD JOB POSITIONS
// =====================================================

async function loadJobPositions() {

    const {
        data,
        error
    } = await supabase
        .from("job_positions")
        .select("*")
        .eq("active", true)
        .order("position_name");


    if (error) {
        throw error;
    }


    jobPositions = data || [];


    const filter =
        document.getElementById(
            "filter-job-position"
        );

    const select =
        document.getElementById(
            "job-position-id"
        );


    jobPositions.forEach(position => {

        if (filter) {

            filter.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${position.id}">
                    ${escapeHtml(position.position_name)}
                </option>
                `
            );

        }


        if (select) {

            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${position.id}">
                    ${escapeHtml(position.position_name)}
                </option>
                `
            );

        }

    });

}


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="10" class="table-loading">
                Loading users...
            </td>
        </tr>
    `;


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            *,
            roles (
                id,
                role_code,
                role_name
            ),
            departments (
                id,
                department_code,
                department_name
            ),
            job_positions (
                id,
                position_code,
                position_name
            )
        `)
        .order("full_name");


    if (error) {
        throw error;
    }


    users = data || [];

    renderUsers();

}


// =====================================================
// RENDER USERS
// =====================================================

function renderUsers() {

    const search =
        document.getElementById(
            "user-search"
        ).value
        .trim()
        .toLowerCase();


    const department =
        document.getElementById(
            "filter-department"
        ).value;

    const jobPosition =
    document.getElementById(
        "filter-job-position"
    ).value;

    const role =
        document.getElementById(
            "filter-role"
        ).value;


    const area =
        document.getElementById(
            "filter-area"
        ).value;


    const status =
        document.getElementById(
            "filter-status"
        ).value;


    const filtered =
        users.filter(user => {

            const searchable =
                [
                    user.badge_id,
                    user.full_name,
                    user.email
                ]
                .join(" ")
                .toLowerCase();

            if (
                search &&
                !searchable.includes(search)
            ) {
                return false;
            }


            if (
                department &&
                String(user.department_id) !==
                String(department)
            ) {
                return false;
            }

            if (
                jobPosition &&
                String(user.job_position_id) !==
                String(jobPosition)
            ) {
                return false;
            }

            if (
                role &&
                String(user.role_id) !==
                String(role)
            ) {
                return false;
            }


            if (
                area &&
                user.area !== area
            ) {
                return false;
            }


            if (
                status !== "" &&
                String(user.active) !== status
            ) {
                return false;
            }


            return true;

        });


    if (!filtered.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="table-empty">
                    No users found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filtered
            .map((user, index) => {

                const departmentName =
                    user.departments
                        ? `${user.departments.department_code} - ${user.departments.department_name}`
                        : "-";


                const jobPositionName =
                    user.job_positions
                        ? user.job_positions.position_name
                        : "-";

                const roleName =
                    user.roles
                        ? user.roles.role_name
                        : "-";


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    user.badge_id || "-"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                user.full_name || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.email || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                departmentName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                jobPositionName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                roleName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.area || "General"
                            )}
                        </td>

                        <td>

                            <span class="
                                user-status
                                ${user.active
                                    ? "active"
                                    : "inactive"}
                            ">
                                ${user.active
                                    ? "Active"
                                    : "Inactive"}
                            </span>

                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    class="btn btn-small btn-secondary"
                                    data-edit-user="${user.id}">
                                    Edit
                                </button>

                                <button
                                    class="btn btn-small btn-danger"
                                    data-delete-user="${user.id}">
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            })
            .join("");

}


// =====================================================
// OPEN ADD USER
// =====================================================

function openAddUser() {

    userForm.reset();

    document.getElementById(
        "user-id"
    ).value = "";


    document.getElementById(
        "active"
    ).checked = true;


    document.getElementById(
        "modal-title"
    ).textContent =
        "Add User";


    document.getElementById(
        "user-form-message"
    ).textContent = "";


    modal.style.display = "flex";

}


// =====================================================
// OPEN EDIT USER
// =====================================================

function openEditUser(id) {

    const user =
        users.find(
            item => item.id === id
        );


    if (!user) return;


    document.getElementById(
        "user-id"
    ).value =
        user.id;


    document.getElementById(
        "badge-id"
    ).value =
        user.badge_id || "";


    document.getElementById(
        "full-name"
    ).value =
        user.full_name || "";


    document.getElementById(
        "email"
    ).value =
        user.email || "";


    document.getElementById(
        "department-id"
    ).value =
        user.department_id || "";

    document.getElementById(
        "job-position-id"
    ).value =
        user.job_position_id || "";


    document.getElementById(
        "role-id"
    ).value =
        user.role_id || "";


    document.getElementById(
        "area"
    ).value =
        user.area || "General";


    document.getElementById(
        "active"
    ).checked =
        user.active !== false;


    document.getElementById(
        "modal-title"
    ).textContent =
        "Edit User";


    document.getElementById(
        "user-form-message"
    ).textContent = "";


    modal.style.display = "flex";

}


// =====================================================
// SAVE PROFILE
// =====================================================

async function saveUser(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "user-form-message"
        );


    message.textContent =
        "Saving...";


    const id =
        document.getElementById(
            "user-id"
        ).value;


    const payload = {

        badge_id:
            document.getElementById(
                "badge-id"
            ).value.trim(),

        full_name:
            document.getElementById(
                "full-name"
            ).value.trim(),

        email:
            document.getElementById(
                "email"
            ).value.trim(),

        department_id:
            document.getElementById(
                "department-id"
            ).value || null,

        job_position_id:
            document.getElementById(
                "job-position-id"
            ).value || null,

        role_id:
            document.getElementById(
                "role-id"
            ).value || null,

        area:
            document.getElementById(
                "area"
            ).value || "General",

        active:
            document.getElementById(
                "active"
            ).checked,

        updated_at:
            new Date().toISOString()

    };


    let result;


    if (id) {

        result =
            await supabase
                .from("profiles")
                .update(payload)
                .eq("id", id);

    } else {

        /*
         * IMPORTANT:
         * New Auth account creation will be
         * connected later through Supabase
         * Edge Function.
         *
         * We don't insert a fake profile ID here.
         */

        message.textContent =
            "New user account creation will be connected to Supabase Auth in the next step.";

        return;

    }


    if (result.error) {

        console.error(
            result.error
        );

        message.textContent =
            result.error.message;

        return;

    }


    modal.style.display = "none";

    await loadUsers();

}


// =====================================================
// DELETE / DEACTIVATE
// =====================================================

async function deleteUser(id) {

    const user =
        users.find(
            item => item.id === id
        );


    if (!user) return;


    if (id === currentUser.id) {

        alert(
            "You cannot delete your own account."
        );

        return;

    }


    const confirmed =
        confirm(
            `Deactivate user "${user.full_name}"?`
        );


    if (!confirmed) return;


    const {
        error
    } = await supabase
        .from("profiles")
        .update({
            active: false,
            updated_at:
                new Date().toISOString()
        })
        .eq("id", id);


    if (error) {

        alert(
            "Failed to deactivate user: " +
            error.message
        );

        return;

    }


    await loadUsers();

}


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

    document
        .getElementById("add-user-button")
        .addEventListener(
            "click",
            openAddUser
        );


    document
        .getElementById("modal-close")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("cancel-user")
        .addEventListener(
            "click",
            closeModal
        );


    userForm.addEventListener(
        "submit",
        saveUser
    );


    document
        .getElementById("user-search")
        .addEventListener(
            "input",
            renderUsers
        );


    document
        .getElementById("filter-department")
        .addEventListener(
            "change",
            renderUsers
        );

    document
    .getElementById("filter-job-position")
    .addEventListener(
        "change",
        renderUsers
    );

    document
        .getElementById("filter-role")
        .addEventListener(
            "change",
            renderUsers
        );


    document
        .getElementById("filter-area")
        .addEventListener(
            "change",
            renderUsers
        );


    document
        .getElementById("filter-status")
        .addEventListener(
            "change",
            renderUsers
        );


    tableBody.addEventListener(
        "click",
        event => {

            const editButton =
                event.target.closest(
                    "[data-edit-user]"
                );


            const deleteButton =
                event.target.closest(
                    "[data-delete-user]"
                );


            if (editButton) {

                openEditUser(
                    editButton.dataset.editUser
                );

            }


            if (deleteButton) {

                deleteUser(
                    deleteButton.dataset.deleteUser
                );

            }

        }
    );


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
        .getElementById("logout-button")
        .addEventListener(
            "click",
            logout
        );

}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeModal() {

    modal.style.display = "none";

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await supabase.auth.signOut();

    window.location.href =
        "../index.html";

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
