// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    // Cek jika user sudah login, langsung arahkan ke index/dashboard
    async function checkCurrentSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    }
    
    checkCurrentSession();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        errorMessage.textContent = '';
        loginBtn.textContent = 'Memproses...';
        loginBtn.disabled = true;

        try {
            // Melakukan proses autentikasi ke Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Jika sukses, arahkan ke dashboard/index
            window.location.href = 'index.html';
            
        } catch (error) {
            errorMessage.textContent = 'Login gagal: ' + error.message;
            loginBtn.textContent = 'Masuk';
            loginBtn.disabled = false;
        }
    });
});
