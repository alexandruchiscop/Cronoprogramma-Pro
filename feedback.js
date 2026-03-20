document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('btnFeedback');
    const btnClose = document.getElementById('closeFeedback');
    const btnSend = document.getElementById('sendFeedback');
    const modal = document.getElementById('feedbackModal');
    const textarea = document.getElementById('feedbackText');

    // Apre il modal
    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // <--- BLOCCA LO SCROLL
        textarea.focus();
    });

    // Chiude il modal
    btnClose.addEventListener('click', () => { chiudiModalFeedback(); });

    // Invia i dati a Google
    btnSend.addEventListener('click', async () => {
        const msg = textarea.value.trim();
        const userPass = document.getElementById('passInput')?.value || "Utente_Loggato";

        if (!msg) return alert("Scrivi un messaggio!");

        btnSend.disabled = true;
        btnSend.innerText = "Invio...";

        try {
            // URL_SCRIPT_GOOGLE deve essere definita in access.js
            await fetch(URL_SCRIPT_GOOGLE, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ user: userPass, message: msg })
            });

            // Mostra schermata successo
            document.getElementById('feedbackForm').style.display = 'none';
            document.getElementById('feedbackSuccess').style.display = 'block';
            textarea.value = "";
        } catch (e) {
            alert("Errore nell'invio. Riprova.");
            btnSend.disabled = false;
            btnSend.innerText = "Invia Nota";
        }
    });
});

// Funzione per chiudere e resettare
function chiudiModalFeedback() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.body.style.overflow = ''; // <--- RIPRISTINA LO SCROLL
    document.getElementById('feedbackForm').style.display = 'block';
    document.getElementById('feedbackSuccess').style.display = 'none';
}
