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

    // UI: Feedback immediato di caricamento
    input.disabled = true;
    input.placeholder = "Verifica in corso...";
    errore.style.display = 'none';

    try {
        /* OTTIMIZZAZIONE: 
           Inviamo una singola richiesta GET. Le GET su Google Apps Script 
           sono generalmente più veloci e gestiscono meglio il reindirizzamento
           necessario per leggere la risposta JSON.
        */
        const response = await fetch(`${URL_SCRIPT_GOOGLE}?pass=${encodeURIComponent(pass)}`);
        
        if (!response.ok) throw new Error("Errore di rete");

        const result = await response.json();

        if (result.status === "autorizzato") {
            sbloccaSito();
        } else {
            mostraErrore();
        }
    } catch (err) {
        console.error("Errore autenticazione:", err);
        // Se il server è offline o c'è un errore, resettiamo l'input per riprovare
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
