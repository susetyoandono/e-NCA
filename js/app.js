// =========================================================
// e-NCA - Login
// =========================================================

import { supabase } from "./supabase.js";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const badgeId = document
        .getElementById("badge-id")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    loginMessage.textContent = "";

    try {

        // -----------------------------------------
        // 1. Find email from Badge ID
        // -----------------------------------------

        const { data: profile, error: profileError } =
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
                .eq("badge_id", badgeId)
                .single();

        if (profileError) {
            throw new Error("Badge ID or password is incorrect.");
        }

        // -----------------------------------------
        // 2. Check account status
        // -----------------------------------------

        if (!profile.active) {
            throw new Error("This account is inactive.");
        }

        if (!profile.email) {
            throw new Error("User email is not configured.");
        }

        // -----------------------------------------
        // 3. Login using Supabase Auth
        // -----------------------------------------

        const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password
            });

        if (authError) {
            throw new Error("Badge ID or password is incorrect.");
        }

        console.log("Login successful:", authData.user);
        console.log("Profile:", profile);

        // -----------------------------------------
        // 4. Temporary success screen
        // -----------------------------------------

        loginForm.innerHTML = `
            <div class="login-success">

                <h2>Login Successful</h2>

                <p>
                    Welcome, <strong>${profile.full_name}</strong>
                </p>

                <p>
                    Badge ID: ${profile.badge_id}
                </p>

                <p>
                    Role: ${profile.roles.role_name}
                </p>

                <br>

                <button id="logout-button">
                    Logout
                </button>

            </div>
        `;

        document
            .getElementById("logout-button")
            .addEventListener("click", logout);

    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent = error.message;

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }

});


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    await supabase.auth.signOut();

    location.reload();
}
