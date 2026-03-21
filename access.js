/**
 * ACCESS.JS - Gestione Sicurezza Ottimizzata
 */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbxSjRnOkHy6Ht2aOj-h74XUTCCH3Ha8jJV1L3NUTRujJcs66M1dDyhQJvp9o5aYimTj5g/exec";

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnUnlock');
    const input = document.getElementById('passInput');

    // Estendiamo la sessione a 24 ore (86400000 ms) per non dover loggare continuamente
    const sessione = localStorage.getItem('cronoprogramma_auth');
    if (sessione && (Date.now() - sessione < 86400000)) {
        document.getElementById('lockScreen').style.display = 'none';
    }

    btn.addEventListener('click', validaAccesso);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validaAccesso();
    });
});

async function validaAccesso() {
    const inputUser = document.getElementById('userInput'); // Nuovo campo
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
            headers: { 'Content-Type': 'application/json' },
            // Inviamo sia 'user' che 'pass' e indichiamo l'azione 'login'
            body: JSON.stringify({ 
                action: 'login',
                user: user, 
                pass: pass, 
                dev: dispositivo 
            })
        });
        const result = await response.json();

        if (result.status === "autorizzato") {
            // SALVIAMO IL NOME UTENTE LOCALMENTE PER USARLO NEI FEEDBACK
            localStorage.setItem('utente_nome', user);
            sbloccaSito();
        } else {
            loading.style.display = 'none';
            inputUser.disabled = false;
            inputPass.disabled = false;
            mostraErrore();
        }
    } catch (err) {
        console.error("Errore:", err);
        loading.style.display = 'none';
        inputUser.disabled = false;
        inputPass.disabled = false;
        mostraErrore();
    }
}

function sbloccaSito() {
    const overlay = document.getElementById('lockScreen');
    overlay.style.transition = 'opacity 0.4s ease-out';
    overlay.style.opacity = '0';
    
    // Salviamo il timestamp del login
    localStorage.setItem('cronoprogramma_auth', Date.now());
    
    // Rimuoviamo l'elemento dal DOM dopo l'animazione
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 400);
}

function mostraErrore() {
    const input = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    
    errore.style.display = 'block';
    input.disabled = false;
    input.value = "";
    input.placeholder = "Riprova...";
    input.focus(); // Riporta il focus per scrivere subito
}
