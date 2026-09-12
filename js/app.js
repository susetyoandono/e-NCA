// =========================================================
// e-NCA - Database Connection Test
// =========================================================

import { supabase } from "./supabase.js";

const statusElement = document.getElementById("connection-status");

async function testDatabase() {

    try {

        // TEST 1 — Read database
        const { data, error } = await supabase
            .from("nca")
            .select("id, nca_number, nca_status, approval_status, created_at")
            .limit(10);

        if (error) {
            throw error;
        }

        console.log("Database connection successful.");
        console.log("NCA records:", data);

        statusElement.innerHTML = `
            <strong>Supabase: CONNECTED</strong><br>
            NCA records found: ${data.length}
        `;

    } catch (error) {

        console.error("Database error:", error);

        statusElement.innerHTML = `
            <strong>Supabase: ERROR</strong><br>
            ${error.message}
        `;
    }
}

async function testInsertDepartment() {
    try {
        const { data, error } = await supabase
            .from("departments")
            .insert([
                { 
                    department_code: "QA-01", 
                    department_name: "Quality Assurance" 
                }
            ])
            .select(); 

        if (error) {
            throw error;
        }

        console.log("Insert berhasil. Data baru:", data);
        
        // Opsional: Update UI untuk memastikan jalan
        const statusElement = document.getElementById("connection-status");
        statusElement.innerHTML += `<br><br><strong>Insert Test:</strong> Berhasil menambahkan departemen ${data[0].department_code}`;

    } catch (error) {
        console.error("Gagal insert data:", error);
    }
}

// Panggil fungsinya
testInsertDepartment();

testDatabase();

// =========================================================
// Create NCA Record dari Form
// =========================================================

document.getElementById("form-nca")?.addEventListener("submit", async function(e) {
    e.preventDefault(); // Mencegah page reload
    
    const ncaNumberInput = document.getElementById("nca-number").value;
    const dummyUserId = "PAe6fcd3e4-e1a5-4a92-bbf0-ff1fb99de13e"; // Wajib ganti dengan UID dari Step 1
    
    try {
        const { data, error } = await supabase
            .from("nca")
            .insert([{ 
                nca_number: ncaNumberInput,
                created_by: dummyUserId
                // nca_status dan approval_status otomatis 'DRAFT' dan 'WAITING QC SUPERVISOR' dari default database
            }])
            .select();

        if (error) throw error;
        
        alert(`Berhasil! NCA ID: ${data[0].nca_number} dibuat.`);
        document.getElementById("form-nca").reset();
        
        // Opsional: Panggil ulang testDatabase() untuk refresh counter di layar
        testDatabase(); 
        
    } catch (error) {
        console.error("Gagal membuat NCA:", error);
        alert("Error: " + error.message);
    }
});
