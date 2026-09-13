// app.js

// Fungsi untuk mengecek autentikasi sebelum memuat data e-NCA
async function requireAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Jika tidak ada sesi login yang valid, lempar kembali ke login.html
    if (!session || error) {
        window.location.href = 'login.html';
        return null;
    }
    
    // Jika ada session, Anda bisa mengambil data user (misal role atau departemen) 
    // sesuai arsitektur "Users" di database untuk mengatur hak akses
    const user = session.user;
    return user;
}

// Jalankan saat aplikasi dimulai
document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth();
    
    if (currentUser) {
        console.log('User terautentikasi:', currentUser.email);
        // Lanjutkan inisialisasi dashboard dan e-NCA di sini...
    }
});



// =========================================================
// e-NCA - Authentication Test
// =========================================================

import { supabase } from "./supabase.js";

const statusElement = document.getElementById("connection-status");

async function testLogin() {

    try {

        // ==========================================
        // 1. LOGIN
        // ==========================================

        const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({
                email: "susetyo.andono@i-pex.com",
                password: "1234"
            });

        if (authError) {
            throw authError;
        }

        const user = authData.user;

        console.log("Auth Login successful:", user);


        // ==========================================
        // 2. GET PROFILE
        // ==========================================

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
                .eq("id", user.id)
                .single();

        if (profileError) {
            throw profileError;
        }

        console.log("Profile:", profile);


        // ==========================================
        // 3. DISPLAY RESULT
        // ==========================================

        statusElement.innerHTML = `
            <strong>LOGIN SUCCESS</strong><br><br>

            User: ${profile.full_name}<br>
            Badge ID: ${profile.badge_id}<br>
            Email: ${profile.email}<br>
            Role: ${profile.roles.role_code}<br>
            Role Name: ${profile.roles.role_name}
        `;

    } catch (error) {

        console.error("Authentication error:", error);

        statusElement.innerHTML = `
            <strong>LOGIN ERROR</strong><br>
            ${error.message}
        `;
    }
}

testLogin();
