/**
 * ACCESS.JS - Gestione Sicurezza tramite Whitelist Google Sheets
 */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbytxrj0mCSIaNjJ0wkNXzs6aiuDgeR7XLQ5gyozz0osNVE5bwzW-AmUfTy-DwZdSCI5pA/exec";

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnUnlock');
    const input = document.getElementById('passInput');

    // Controllo se l'utente è già loggato (opzionale, dura 1 ora)
    const sessione = localStorage.getItem('cronoprogramma_auth');
    if (sessione && (Date.now() - sessione < 3600000)) {
        document.getElementById('lockScreen').style.display = 'none';
    }

    // Evento click
    btn.addEventListener('click', validaAccesso);

    // Evento tasto Invio
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validaAccesso();
    });
});

async function validaAccesso() {
    const input = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    const pass = input.value;

    if (!pass) return;

    // Stato di caricamento
    input.disabled = true;
    input.placeholder = "Verifica...";

    try {
        const response = await fetch(URL_SCRIPT_GOOGLE, {
            method: 'POST',
            mode: 'no-cors', // Necessario per Apps Script a volte
            body: JSON.stringify({ password: pass })
        });

        // NOTA: Poiché Google Apps Script con 'no-cors' non restituisce il JSON leggibile facilmente,
        // la soluzione più robusta è usare il metodo standard. Se hai errori CORS,
        // useremo una piccola modifica allo script di Google.
        
        // Simuliamo la risposta positiva del server (per test) o integriamo fetch standard:
        const check = await fetch(URL_SCRIPT_GOOGLE + "?pass=" + encodeURIComponent(pass));
        const result = await check.json();

        if (result.status === "autorizzato") {
            sbloccaSito();
        } else {
            mostraErrore();
        }
    } catch (err) {
        console.error("Errore autenticazione:", err);
        // Se il server non risponde, per sicurezza non sblocchiamo
        mostraErrore();
    }
}

function sbloccaSito() {
    const overlay = document.getElementById('lockScreen');
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    localStorage.setItem('cronoprogramma_auth', Date.now());
    setTimeout(() => overlay.style.display = 'none', 500);
}

function mostraErrore() {
    const input = document.getElementById('passInput');
    const errore = document.getElementById('lockError');
    errore.style.display = 'block';
    input.disabled = false;
    input.value = "";
    input.placeholder = "Password errata!";
}
