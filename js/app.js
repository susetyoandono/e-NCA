// =========================================================
// e-NCA - Application
// =========================================================

import { supabase } from "./supabase.js";

async function testSupabaseConnection() {

    const statusElement = document.getElementById("connection-status");

    try {

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        console.log("Supabase connected.");
        console.log("Session:", data.session);

        statusElement.textContent =
            "Supabase connection: CONNECTED";

    } catch (error) {

        console.error("Supabase connection error:", error);

        statusElement.textContent =
            "Supabase connection: ERROR";
    }
}

testSupabaseConnection();
