// =========================================================
// e-NCA - Application
// =========================================================

import { supabase } from "./supabase.js";

async function testSupabaseConnection() {

    const statusElement = document.getElementById("connection-status");

    try {

        const { error } = await supabase
            .from("system_test")
            .select("*")
            .limit(1);

        // Untuk sementara table system_test belum ada.
        // Error "relation does not exist" berarti connection
        // ke Supabase sudah berhasil tetapi table belum dibuat.

        if (error && !error.message.includes("does not exist")) {
            throw error;
        }

        statusElement.textContent =
            "Supabase connection: CONNECTED";

    } catch (error) {

        console.error("Supabase connection error:", error);

        statusElement.textContent =
            "Supabase connection: ERROR - Check console";
    }
}

testSupabaseConnection();
