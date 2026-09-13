// =========================================================
// e-NCA - Database CREATE Test
// =========================================================

import { supabase } from "./supabase.js";

const statusElement = document.getElementById("connection-status");

async function testDatabase() {

    try {

        // TEST — Create NCA record
        const { data, error } = await supabase
            .from("nca")
            .insert([
                {
                    nca_number: "TEST-001",
                    nca_status: "DRAFT",
                    approval_status: "WAITING QC SUPERVISOR"
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log("CREATE successful.");
        console.log("Created NCA:", data);

        statusElement.innerHTML = `
            <strong>Supabase: CREATE SUCCESS</strong><br>
            NCA Number: ${data.nca_number}<br>
            Status: ${data.nca_status}
        `;

    } catch (error) {

        console.error("Database error:", error);

        statusElement.innerHTML = `
            <strong>Supabase: CREATE ERROR</strong><br>
            ${error.message}
        `;
    }
}

testDatabase();
