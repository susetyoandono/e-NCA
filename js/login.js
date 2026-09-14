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

        // Find user profile by Badge ID
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

        if (profileError || !profile) {
            throw new Error(
                "Badge ID or password is incorrect."
            );
        }


        // Check active
        if (!profile.active) {
            throw new Error(
                "This account is inactive."
            );
        }


        // Login Supabase Auth
        const { error: authError } =
            await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password
            });

        if (authError) {
            throw new Error(
                "Badge ID or password is incorrect."
            );
        }


        // Login success
        console.log("Login successful:", profile);

        window.location.href =
            "pages/dashboard.html";


    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            error.message;

        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }

});
