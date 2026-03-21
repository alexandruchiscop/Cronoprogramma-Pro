document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('btnFeedback');
    const btnClose = document.getElementById('closeFeedback');
    const btnSend = document.getElementById('sendFeedback');
    const modal = document.getElementById('feedbackModal');
    const textarea = document.getElementById('feedbackText');

    // Apre il modal
    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
        textarea.focus();
    });

    btnClose.addEventListener('click', () => { chiudiModalFeedback(); });

    // Invia i dati a Google
    btnSend.addEventListener('click', async () => {
        const msg = textarea.value.trim();
        
        // RECUPERIAMO IL NOME SALVATO DURANTE IL LOGIN (da access.js)
        const activeUser = localStorage.getItem('utente_nome') || "Utente_Ignoto";
        
        if (!msg) return alert("Scrivi un messaggio!");

        btnSend.disabled = true;
        btnSend.innerText = "Invio...";

        try {
            // NOTA: Abbiamo rimosso 'mode: no-cors' per poter leggere la risposta se serve
            // e ora inviamo 'action' e 'user' (il nome utente)
            await fetch(URL_SCRIPT_GOOGLE, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'feedback', // Comunica allo script cosa stiamo facendo
                    user: activeUser,   // Invia il NOME UTENTE, non la password
                    message: msg 
                })
            });

            // Mostra schermata successo
            document.getElementById('feedbackForm').style.display = 'none';
            document.getElementById('feedbackSuccess').style.display = 'block';
            textarea.value = "";
        } catch (e) {
            console.error("Errore invio:", e);
            alert("Errore nell'invio. Riprova.");
        } finally {
            btnSend.disabled = false;
            btnSend.innerText = "Invia Nota";
        }
    });
});

function chiudiModalFeedback() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.body.style.overflow = ''; 
    document.getElementById('feedbackForm').style.display = 'block';
    document.getElementById('feedbackSuccess').style.display = 'none';
}
