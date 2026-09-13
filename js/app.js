// =========================================================
// e-NCA - Database CRUD Test
// =========================================================

import { supabase } from "./supabase.js";

const statusElement = document.getElementById("connection-status");

async function testCRUD() {

    try {

        // ==========================================
        // 1. READ
        // ==========================================

        const { data: records, error: readError } = await supabase
            .from("nca")
            .select("*")
            .eq("nca_number", "TEST-001")
            .limit(1);

        if (readError) throw readError;

        if (!records || records.length === 0) {
            throw new Error("TEST-001 record not found.");
        }

        const ncaId = records[0].id;

        console.log("READ successful:", records[0]);


        // ==========================================
        // 2. UPDATE
        // ==========================================

        const { data: updatedRecord, error: updateError } = await supabase
            .from("nca")
            .update({
                nca_status: "ON HOLD"
            })
            .eq("id", ncaId)
            .select()
            .single();

        if (updateError) throw updateError;

        console.log("UPDATE successful:", updatedRecord);


        // ==========================================
        // 3. DELETE
        // ==========================================

        const { error: deleteError } = await supabase
            .from("nca")
            .delete()
            .eq("id", ncaId);

        if (deleteError) throw deleteError;

        console.log("DELETE successful.");


        // ==========================================
        // RESULT
        // ==========================================

        statusElement.innerHTML = `
            <strong>Supabase CRUD: SUCCESS</strong><br>
            READ ✓<br>
            UPDATE ✓<br>
            DELETE ✓<br>
            Test record TEST-001 has been removed.
        `;

    } catch (error) {

        console.error("CRUD error:", error);

        statusElement.innerHTML = `
            <strong>Supabase CRUD: ERROR</strong><br>
            ${error.message}
        `;
    }
}

testCRUD();
