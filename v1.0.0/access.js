/**
 * ACCESS.JS - Gestione Sicurezza Ottimizzata (Versione Pulita)
 */
const URL_SCRIPT_GOOGLE = "https://script.google.com/macros/s/AKfycbztjv1DOyOieKN5qT4meY1nPlqMnOTwjHH4_vTUc7YmPbAOUjiM6Ne1OHuBX6Kmw9bI8A/exec";

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnUnlock');
    const inputPass = document.getElementById('passInput');
    const inputUser = document.getElementById('userInput');

    // 1. Controllo sessione esistente (24h)
    const sessione = localStorage.getItem('cronoprogramma_auth');
    if (sessione && (Date.now() - sessione < 86400000)) {
        document.getElementById('lockScreen').style.display = 'none';
        
        // RECUPERA NOME E INIZIALIZZA PROFILO AL CARICAMENTO
        const userSalvato = localStorage.getItem('utente_nome') || "Utente";
        if (typeof inizializzaProfilo === "function") inizializzaProfilo(userSalvato);
    }

    // 2. Event Listeners
    if (btn) btn.addEventListener('click', validaAccesso);
    
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
    // 1. Salviamo il nome utente
    localStorage.setItem('utenteLoggato', user); 
    
    // 2. REGISTRAZIONE ACCESSO (Aggiungi questa riga qui)
    registraAccessoLocale(user); 
    
    // 3. Inizializziamo il profilo
    if (typeof inizializzaProfilo === "function") {
        inizializzaProfilo(user);
    }
    
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
    const user = document.getElementById('userInput').value.trim();
    
    // 1. Registra l'accesso per questo specifico utente
    registraAccessoLocale(user);
    
    overlay.style.transition = 'opacity 0.4s ease-out';
    overlay.style.opacity = '0';
    
    localStorage.setItem('cronoprogramma_auth', Date.now());
    
    // --- QUESTE DUE RIGHE DEVONO ESSERE PRESENTI ENTRAMBE ---
    localStorage.setItem('utente_nome', user);    // Per feedback.js
    localStorage.setItem('utenteLoggato', user); // Per script.js e Sidebar
    // -------------------------------------------------------

    // INIZIALIZZA PROFILO DOPO IL LOGIN
    inizializzaProfilo(user);
    
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

function registraAccessoLocale(nomeUtente) {
    const chiaveAccessi = "accessi_" + nomeUtente;
    let accessi = JSON.parse(localStorage.getItem(chiaveAccessi) || "[]");

    const nuovo = {
        data: new Date().toLocaleString('it-IT', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        }),
        dispositivo: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Smartphone" : "Computer"
    };

    // Aggiunge in alto e tiene solo i 5 più recenti
    accessi.unshift(nuovo);
    accessi = accessi.slice(0, 5);

    localStorage.setItem(chiaveAccessi, JSON.stringify(accessi));
}