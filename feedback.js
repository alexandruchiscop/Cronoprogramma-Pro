/**
 * FEEDBACK.JS 
 * Gestione suggerimenti e note dei Project Manager.
 * Invia i dati al foglio Google "Feedback".
 */

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi del DOM
    const btnOpen = document.getElementById('btnFeedback');
    const btnClose = document.getElementById('closeFeedback');
    const btnSend = document.getElementById('sendFeedback');
    const modal = document.getElementById('feedbackModal');
    const textarea = document.getElementById('feedbackText');

    // 1. APERTURA MODAL
    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
            // Piccola animazione di entrata opzionale via JS o CSS
            textarea.focus();
        });
    }

    // 2. CHIUSURA MODAL (al click su Annulla)
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            chiudiModalFeedback();
        });
    }

    // 3. CHIUSURA CLICCANDO FUORI DALLA SCHEDA
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            chiudiModalFeedback();
        }
    });

    // 4. INVIO FEEDBACK A GOOGLE APPS SCRIPT
    if (btnSend) {
        btnSend.addEventListener('click', async () => {
            const messaggio = textarea.value.trim();
            // Recuperiamo la password usata dall'input di access.js per identificare chi scrive
            const passUsata = document.getElementById('passInput')?.value || "Utente_Generico";

            if (!messaggio) {
                alert("Per favore, scrivi un messaggio prima di inviare.");
                return;
            }

            // Stato di caricamento sul bottone
            btnSend.disabled = true;
            btnSend.innerText = "Invio in corso...";

            try {
                /* Utilizziamo URL_SCRIPT_GOOGLE definito in access.js.
                   Il metodo POST attiverà la funzione doPost(e) nello script di Google.
                */
                await fetch(URL_SCRIPT_GOOGLE, {
                    method: 'POST',
                    mode: 'no-cors', // Necessario per evitare blocchi CORS con Google Apps Script in POST
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user: passUsata,
                        message: messaggio,
                        timestamp: new Date().toLocaleString()
                    })
                });

                // Con 'no-cors' non possiamo leggere la risposta, 
                // ma se non va in catch, il browser ha spedito i dati.
                alert("Ottimo! Il tuo suggerimento è stato inviato con successo.");
                textarea.value = "";
                chiudiModalFeedback();

            } catch (error) {
                console.error("Errore invio feedback:", error);
                alert("Si è verificato un errore durante l'invio. Riprova più tardi.");
            } finally {
                btnSend.disabled = false;
                btnSend.innerText = "Invia Nota";
            }
        });
    }

    function chiudiModalFeedback() {
        modal.style.display = 'none';
    }
});
