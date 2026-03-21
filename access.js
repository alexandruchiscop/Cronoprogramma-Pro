/**
 * ACCESS.JS - Gestione Sicurezza Ottimizzata (Versione Pulita)
 */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbxSjRnOkHy6Ht2aOj-h74XUTCCH3Ha8jJV1L3NUTRujJcs66M1dDyhQJvp9o5aYimTj5g/exec";

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnUnlock');
    const inputPass = document.getElementById('passInput');
    const inputUser = document.getElementById('userInput');

    // Controllo sessione esistente (24h)
    const sessione = localStorage.getItem('cronoprogramma_auth');
    if (sessione && (Date.now() - sessione < 86400000)) {
        document.getElementById('lockScreen').style.display = 'none';
    }

    btn.addEventListener('click', validaAccesso);
    
    // Permette di premere Invio in entrambi i campi
    [inputPass, inputUser].forEach(el => {
        if(el) el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validaAccesso();
        });
    });
});

async function validaAccesso() {
    const inputUser = document.getElementById('userInput');
    const inputPass = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    const loading = document.getElementById('loadingAccess');
    
    const user = inputUser.value.trim();
    const pass = inputPass.value.trim();

    if (!user || !pass) {
        alert("Inserisci sia Nome Utente che Password");
        return;
    }

    // UI: Stato di caricamento
    inputUser.disabled = true;
    inputPass.disabled = true;
    errore.style.display = 'none';
    loading.style.display = 'block';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dispositivo = isMobile ? "Smartphone/Tablet" : "Computer (PC/Mac)";

    try {
        const response = await fetch(URL_SCRIPT_GOOGLE, {
            method: 'POST',
            mode: 'cors', 
            headers: {
                // Usiamo text/plain per evitare il blocco CORS dei browser
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify({ 
                action: 'login', 
                user: user, 
                pass: pass, 
                dev: dispositivo 
            })
        });

        // Leggiamo come testo e poi convertiamo in JSON (più sicuro per Google Apps Script)
        const text = await response.text();
        const result = JSON.parse(text);

        if (result.status === "autorizzato") {
            localStorage.setItem('utente_nome', user);
            sbloccaSito();
        } else {
            loading.style.display = 'none';
            inputUser.disabled = false;
            inputPass.disabled = false;
            mostraErrore();
        }
    } catch (err) {
        console.error("Errore connessione:", err);
        loading.style.display = 'none';
        inputUser.disabled = false;
        inputPass.disabled = false;
        mostraErrore();
        alert("Errore di connessione. Assicurati che lo script sia pubblicato come 'Chiunque'.");
    }
}

function sbloccaSito() {
    const overlay = document.getElementById('lockScreen');
    overlay.style.transition = 'opacity 0.4s ease-out';
    overlay.style.opacity = '0';
    
    localStorage.setItem('cronoprogramma_auth', Date.now());
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 400);
}

function mostraErrore() {
    const inputPass = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    
    errore.style.display = 'block';
    inputPass.disabled = false;
    document.getElementById('userInput').disabled = false;
    inputPass.value = "";
    inputPass.placeholder = "Riprova...";
    inputPass.focus();
}
