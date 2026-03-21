/**
 * ACCESS.JS - Gestione Sicurezza Ottimizzata
 */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbwAskL3ggJ3zsWAyCFyZEJku8j4uaV1zHRC-MbMjZiC1kFzEPdz20KhRtnzV9zZRtTlMQ/exec";

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
    const input = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    const pass = input.value;

    if (!pass) return;

    input.disabled = true;
    input.placeholder = "Verifica...";
    errore.style.display = 'none';

    // Rilevamento semplice del dispositivo
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dispositivo = isMobile ? "Smartphone/Tablet" : "Computer (PC/Mac)";

    try {
        // Inviamo anche il parametro &dev
        const response = await fetch(`${URL_SCRIPT_GOOGLE}?pass=${encodeURIComponent(pass)}&dev=${encodeURIComponent(dispositivo)}`);
        const result = await response.json();

        if (result.status === "autorizzato") {
            sbloccaSito();
        } else {
            mostraErrore();
        }
    } catch (err) {
        console.error("Errore autenticazione:", err);
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
