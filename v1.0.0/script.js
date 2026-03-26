/* =========================================
   1. CONFIGURAZIONE E STATO
   ========================================= */
const FESTE_FISSE = ["01-01", "06-01", "25-04", "01-05", "02-06", "15-08", "01-11", "08-12", "25-12", "26-12"];
const _cachePasqua = {}; // FIX 5: cache per evitare ricalcoli ripetuti dello stesso anno
let registroGiorni = [];
let sabatoLavorativo = localStorage.getItem('sabatoLavorativo') === 'true';
let currentMode = 'forward';
let patronoAttivo = localStorage.getItem('patronoAttivo') === 'true';

window.onload = () => {
    // --- RECUPERA L'UTENTE LOGGATO ---
    const utente = localStorage.getItem('utenteLoggato') || "Ospite";

    // 1. Gestione Sabato (Personalizzato)
    const btn = document.getElementById('btnSat');
    // Leggiamo la chiave specifica dell'utente
    sabatoLavorativo = localStorage.getItem(utente + '_sabatoLavorativo') === 'true';
    
    if (btn) {
        if (sabatoLavorativo) {
            btn.classList.add('active');
            btn.innerText = "Sabato Lavorativo: SÌ";
        } else {
            btn.classList.remove('active');
            btn.innerText = "Sabato Lavorativo: NO";
        }
    }

    // 2. RECUPERO DATA E DURATA (Personalizzati)
    const ultimaData = localStorage.getItem(utente + '_ultimaDataInizio');
    const ultimiGiorni = localStorage.getItem(utente + '_ultimaDurata');
    const oggi = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = ultimaData || oggi;
    document.getElementById('days').value = ultimiGiorni || "10";

    // --- NUOVO: RECUPERO DATI PATRONO (Personalizzati) ---
    patronoAttivo = localStorage.getItem(utente + '_patronoAttivo') === 'true';
    document.getElementById('patronoGiorno').value = localStorage.getItem(utente + '_patronoGG') || "";
    document.getElementById('patronoMese').value = localStorage.getItem(utente + '_patronoMM') || "";
    
    // 3. Recupero Sospensioni (Personalizzate)
    // Usiamo la chiave con il prefisso utente
    const datiSalvati = JSON.parse(localStorage.getItem(utente + '_sospensioniSalvate') || "[]");
    const container = document.getElementById('listaSospensioni');
    if (container) {
        container.innerHTML = ""; 
        
        if (datiSalvati.length > 0) {
            datiSalvati.forEach(p => {
                // Assicurati che la funzione si chiami aggiungiPeriodo o aggiungiPeriodoSospensione come nel resto del codice
                aggiungiPeriodo(p.start, p.end, p.note);
            });
        } else {
            aggiungiPeriodo();
        }
    }

    // Aggiorniamo l'interfaccia e ricalcoliamo tutto
    aggiornaStatoPatrono();
    eseguiCalcoloCorretto(); 
};

/* =========================================
   2. GESTIONE MODALITÀ E FERIE
   ========================================= */

function toggleFerieMenu() {
    const menu = document.getElementById('ferieMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function aggiungiPeriodo(start = "", end = "", note = "") {
    const container = document.getElementById('listaSospensioni');
    const wrapper = document.createElement('div');
    wrapper.className = "periodo-wrapper";
    
    wrapper.innerHTML = `
        <div class="periodo-header">
            <input type="text" class="f-note" placeholder="Scrivi una nota (es. Ferie Natale)" oninput="eseguiCalcoloCorretto()">
        </div>
        <div class="periodo-item">
            <input type="date" class="f-start" onchange="eseguiCalcoloCorretto()">
            <input type="date" class="f-end" onchange="eseguiCalcoloCorretto()">
            <button type="button" class="btn-remove-periodo" onclick="this.parentElement.parentElement.remove(); eseguiCalcoloCorretto();">×</button>
        </div>
        <div class="error-msg" style="display:none; color: #dc2626; font-size: 0.7rem; font-weight: 700; margin-top: -8px; margin-bottom: 12px; margin-left: 5px;">
            ⚠️ La data di fine deve essere successiva all'inizio
        </div>
    `;
    // FIX 3: valori assegnati via DOM per evitare XSS da input utente in innerHTML
    wrapper.querySelector('.f-note').value = note;
    wrapper.querySelector('.f-start').value = start;
    wrapper.querySelector('.f-end').value = end;
    container.appendChild(wrapper);
}

function switchMode(mode) {
    currentMode = mode;
    
    // Gestione Tab
    document.getElementById('tabForward').classList.toggle('active', mode === 'forward');
    document.getElementById('tabBackward').classList.toggle('active', mode === 'backward');

    const inputGiorni = document.getElementById('days');
    const inputScadenza = document.getElementById('endDateInput');
    const labelDinamica = document.getElementById('dynamicLabel');
    const resultLabel = document.getElementById('resultLabel');
    const mainBtn = document.getElementById('mainBtn');

    if (mode === 'forward') {
        // TRASFORMAZIONE IN "PIANIFICA"
        inputGiorni.style.display = 'block';
        inputScadenza.style.display = 'none';
        labelDinamica.innerText = "Durata Lavorativa (gg)";
        resultLabel.innerText = "CONSEGNA PREVISTA";
        mainBtn.innerText = "Calcola Scadenza";
    } else {
        // TRASFORMAZIONE IN "RETRO-PLANNING"
        inputGiorni.style.display = 'none';
        inputScadenza.style.display = 'block';
        labelDinamica.innerText = "Fine Scadenza";
        resultLabel.innerText = "GIORNI DISPONIBILI";
        mainBtn.innerText = "Calcola Giorni Disponibili";
        
        // Imposta data di oggi se vuota
        if (!inputScadenza.value) {
            inputScadenza.value = new Date().toISOString().split('T')[0];
        }
    }

    eseguiCalcoloCorretto();
}

function animazioneReset() {
    const btn = document.getElementById('btnReset');
    btn.classList.add('spin-animation'); // Assicurati di avere @keyframes rotateReset nel CSS
    
    resetParametri(); // La tua funzione originale di pulizia
    
    setTimeout(() => {
        btn.classList.remove('spin-animation');
    }, 600);
}

function toggleSabato() {
    const btn = document.getElementById('btnSat');
    sabatoLavorativo = !sabatoLavorativo;
    btn.classList.toggle('active', sabatoLavorativo);
    btn.innerText = sabatoLavorativo ? "Sabato Lavorativo: SÌ" : "Sabato Lavorativo: NO";
    localStorage.setItem('sabatoLavorativo', sabatoLavorativo);
    eseguiCalcoloCorretto();
}

function eseguiCalcoloCorretto() {
    const inputG = document.getElementById('patronoGiorno');
    const inputM = document.getElementById('patronoMese');
    const utente = localStorage.getItem('utenteLoggato') || "Ospite";

    // --- NUOVA VALIDAZIONE NON INVASIVA ---
    // Usiamo Number() che ignora gli zeri iniziali senza fare confusione
    if (inputG.value !== "") {
        let valG = Number(inputG.value);
        if (valG > 31) inputG.value = "31";
        if (valG < 0) inputG.value = "1";
    }

    if (inputM.value !== "") {
        let valM = Number(inputM.value);
        if (valM > 12) inputM.value = "12"; // Qui prima scattava l'errore!
        if (valM < 0) inputM.value = "1";
    }
    // ---------------------------------------

    const inputsPatrono = document.getElementById('patronoInputs');
    if (inputsPatrono) {
        inputsPatrono.style.display = patronoAttivo ? 'flex' : 'none';
    }

 if (currentMode === 'forward') { 
        calcolaCronoprogramma(false); // <--- FORZA FALSE: Niente scroll
    } else { 
        calcolaRetroPlanning(false); // <--- FORZA FALSE: Niente scroll
    }
    
// 3. SALVATAGGIO VALORI (MODIFICATO CON PREFISSO UTENTE)
    // Ora salviamo come "Alex_patronoGG" invece di "patronoGG"
    localStorage.setItem(utente + '_ultimaDataInizio', document.getElementById('startDate').value);
    localStorage.setItem(utente + '_ultimaDurata', document.getElementById('days').value);
    
    localStorage.setItem(utente + '_patronoAttivo', patronoAttivo);
    localStorage.setItem(utente + '_patronoGG', inputG.value);
    localStorage.setItem(utente + '_patronoMM', inputM.value);
    localStorage.setItem(utente + '_sabatoLavorativo', sabatoLavorativo);
    
    salvaSospensioni(); 
    aggiornaBadgeFerie();
}
function resetParametri() {
    // 1. Ripristina la data di oggi
    const oggi = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) startDateInput.value = oggi;

    // 2. Svuota la durata
    const daysInput = document.getElementById('days');
    if (daysInput) daysInput.value = "";

    // 3. Svuota e resetta le sospensioni (ferie)
    const listaSosp = document.getElementById('listaSospensioni');
    if (listaSosp) {
        listaSosp.innerHTML = "";
        aggiungiPeriodo(); // Ne aggiunge uno vuoto per default
    }

    // 4. Chiude i menu e nasconde i risultati
    const ferieMenu = document.getElementById('ferieMenu');
    if (ferieMenu) ferieMenu.style.display = 'none';
    
    const resultSection = document.getElementById('result');
    if (resultSection) resultSection.style.display = 'none';

    // 5. Pulisce i log e le viste (Tabella/Calendario)
    const logContainer = document.getElementById('logContainer');
    if (logContainer) logContainer.style.display = 'none';
    
    const logBody = document.getElementById('logBody');
    if (logBody) logBody.innerHTML = "";

    const grid = document.getElementById('calendarGrid');
    if (grid) grid.innerHTML = "";

    const calContainer = document.getElementById('calendarContainer');
    if (calContainer) calContainer.style.display = 'none';

    // 6. Reset tasti vista
    const btnT = document.getElementById('btnViewTable');
    const btnC = document.getElementById('btnViewCal');
    if (btnT) btnT.classList.add('active');
    if (btnC) btnC.classList.remove('active');

    // 7. Focus automatico sul campo giorni per ricominciare subito
    if (daysInput) daysInput.focus();

    // 8. Esegue un ricalcolo "vuoto" per aggiornare i badge/localStorage
    eseguiCalcoloCorretto();
}

/* =========================================
   3. MOTORE DI CALCOLO
   ========================================= */

function calcolaPasqua(anno) {
    // Algoritmo di Meeus/Jones/Butcher (Universale)
    const a = anno % 19;
    const b = Math.floor(anno / 100);
    const c = anno % 100; // FIX: ultime due cifre anno (era erroneamente % 4)
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    
    // Calcolo finale del mese e del giorno
    const n = h + l - 7 * m + 114;
    const mese = Math.floor(n / 31);
    const giorno = (n % 31) + 1;

    // Ritorna la data corretta (Mese è 0-11 in JS, quindi mese - 1)
    return new Date(anno, mese - 1, giorno);
}

function analizzaGiorno(data) {
    // 1. CREIAMO UNA DATA LOCALE PURA
    // Questo trucco (anno, mese, giorno) azzera ore, minuti e fuso orario.
    const dLocale = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
    const tData = dLocale.getTime();

    const anno = dLocale.getFullYear();
    const gg = dLocale.getDate();
    const mm = dLocale.getMonth() + 1;
    const tagFesta = `${String(gg).padStart(2, '0')}-${String(mm).padStart(2, '0')}`;
    const dataFormattata = `${String(gg).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${anno}`;

    // --- CONTROLLO SANTO PATRONO ---
    const pGiorno = parseInt(document.getElementById('patronoGiorno').value);
    const pMese = parseInt(document.getElementById('patronoMese').value);
    if (patronoAttivo && gg === pGiorno && mm === pMese) {
        return { data: dataFormattata, tipo: "PATRONO", classe: "row-festa" };
    }

    // --- CONTROLLO SOSPENSIONI (FERIE) ---
    const periodiSosp = document.querySelectorAll('.periodo-item');
    for (let p of periodiSosp) {
        const sVal = p.querySelector('.f-start').value;
        const eVal = p.querySelector('.f-end').value;
        if (sVal && eVal) {
            // Forziamo la mezzanotte locale con T00:00:00
            const dInizio = new Date(sVal + "T00:00:00").getTime();
            const dFine = new Date(eVal + "T00:00:00").getTime();
            if (tData >= dInizio && tData <= dFine) {
                return { data: dataFormattata, tipo: "SOSP.", classe: "row-festa" };
            }
        }
    }

    // --- CALCOLO PASQUA E PASQUETTA (CON CACHE PER ANNO) ---
    // FIX 5: calcolaPasqua() eseguita al massimo una volta per anno
    if (!_cachePasqua[anno]) _cachePasqua[anno] = calcolaPasqua(anno);
    const pDate = _cachePasqua[anno];
    // Trasformiamo la Pasqua in un timestamp locale puro
    const tPasqua = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate(), 0, 0, 0, 0).getTime();
    const tPasquetta = tPasqua + (24 * 60 * 60 * 1000); 

    // 1. Priorità: Feste Fisse e Pasqua/Pasquetta
    if (tData === tPasqua || tData === tPasquetta || FESTE_FISSE.includes(tagFesta)) {
        return { data: dataFormattata, tipo: "FESTA", classe: "row-festa" };
    }

    // 2. Weekend
    const day = dLocale.getDay();
    if (day === 0 || (day === 6 && !sabatoLavorativo)) {
        return { data: dataFormattata, tipo: "WEEKEND", classe: "row-festa" };
    }
    
    // 3. Lavorativo
    return { data: dataFormattata, tipo: "LAVORATIVO", classe: "row-lavorativo" };
}

// Funzione per il click sul nuovo bottone
function togglePatrono() {
    patronoAttivo = !patronoAttivo;
    aggiornaStatoPatrono();
    eseguiCalcoloCorretto();
}

// Gestisce l'aspetto estetico del bottone e la visibilità degli input
function aggiornaStatoPatrono() {
    const btn = document.getElementById('btnPatrono');
    const inputs = document.getElementById('patronoInputs');
    if(!btn || !inputs) return;

    if (patronoAttivo) {
        btn.classList.add('active');
        // Usiamo innerHTML e lo span per forzare l'andata a capo tramite CSS
        btn.innerHTML = `Festa Santo Patrono: <span>ATTIVA</span>`; 
        inputs.style.display = 'flex';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = `Festa Santo Patrono: <span>NON ATTIVA</span>`;
        inputs.style.display = 'none';
    }
    localStorage.setItem('patronoAttivo', patronoAttivo);
}

function calcolaCronoprogramma(usaEffetti = false) {    
    const startInput = document.getElementById('startDate').value;
    const daysInput = parseInt(document.getElementById('days').value);
    if (!startInput || isNaN(daysInput) || daysInput <= 0) return;

    // Usiamo T00:00:00 per bloccare il fuso orario
    let dataCorrente = new Date(startInput + "T00:00:00");
    let giorniTrovati = 0;
    registroGiorni = []; 

    // Partiamo dal giorno STESSO o dal giorno DOPO? 
    // Di solito il cronoprogramma conta dal giorno successivo all'inizio
    while (giorniTrovati < daysInput) {
        dataCorrente.setDate(dataCorrente.getDate() + 1); // Sposta al giorno da analizzare
        
        // Creiamo una copia pulita per l'analisi
        const dataDaAnalizzare = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth(), dataCorrente.getDate());
        const analisi = analizzaGiorno(dataDaAnalizzare);
        
        if (analisi.tipo === "LAVORATIVO") {
            giorniTrovati++;
            analisi.nrGiorno = giorniTrovati;
        } else {
            analisi.nrGiorno = "-";
        }
        registroGiorni.push(analisi);
    }
    const titolo = dataCorrente.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    mostraRisultato(titolo, giorniTrovati, dataCorrente, usaEffetti);
}

function calcolaRetroPlanning(usaEffetti = false) { // FIX 7: parametro aggiunto
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDateInput').value;
    
    if (!startVal || !endVal) return;
    
    let dataInizio = new Date(startVal + "T00:00:00");
    let dataFine = new Date(endVal + "T00:00:00");
    
    if (dataFine <= dataInizio) { 
        document.getElementById('result').style.display = 'none'; 
        return; 
    }

    let dataCorrente = new Date(dataInizio);
    let ggLavorativi = 0;
    registroGiorni = [];

    while (dataCorrente < dataFine) {
        dataCorrente.setDate(dataCorrente.getDate() + 1);
        
        // Copia pulita dell'oggetto data
        const dataDaAnalizzare = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth(), dataCorrente.getDate());
        const analisi = analizzaGiorno(dataDaAnalizzare);
        
        if (analisi.tipo === "LAVORATIVO") {
            ggLavorativi++;
            analisi.nrGiorno = ggLavorativi;
        } else {
            analisi.nrGiorno = "-";
        }
        registroGiorni.push(analisi);
    }
    
    mostraRisultato(`${ggLavorativi} GIORNI`, ggLavorativi, dataFine, usaEffetti); // FIX 7
}

function aggiornaBadgeFerie() {
    const periodiWrappers = document.querySelectorAll('.periodo-wrapper');
    const badge = document.getElementById('badgeFerie');
    const btnToggle = document.querySelector('.btn-ferie-toggle'); // Il pulsante principale
    const startInput = document.getElementById('startDate').value;
    
    if (!startInput) return;

    const dataInizioLavori = new Date(startInput);
    dataInizioLavori.setHours(0, 0, 0, 0);

    let conteggioAttive = 0;
    let haErrori = false;
    let dataFineProgetto = new Date(dataInizioLavori);

    if (registroGiorni.length > 0) {
        const ultimaDataStr = registroGiorni[registroGiorni.length - 1].data; 
        const parti = ultimaDataStr.split('.');
        dataFineProgetto = new Date(parti[2], parti[1] - 1, parti[0]);
        dataFineProgetto.setHours(0, 0, 0, 0);
    }

    periodiWrappers.forEach(w => {
        const s = w.querySelector('.f-start').value;
        const e = w.querySelector('.f-end').value;
        
        if (s && e) {
            const dSospInizio = new Date(s);
            const dSospFine = new Date(e);
            dSospInizio.setHours(0, 0, 0, 0);
            dSospFine.setHours(0, 0, 0, 0);

            if (dSospFine < dSospInizio) haErrori = true;
            const isAttiva = (dSospInizio <= dataFineProgetto && dSospFine >= dataInizioLavori);

            if (isAttiva) {
                conteggioAttive++;
                w.classList.remove('periodo-fuori-raggio');
            } else {
                w.classList.add('periodo-fuori-raggio');
            }
        } else {
            w.classList.remove('periodo-fuori-raggio');
        }
    });

    // --- LOGICA AGGIUNTA PER PATRONO E STILE ---
    // Il totale è: periodi feriali + 1 (se il patrono è attivo)
    const totaleVociAttive = conteggioAttive + (patronoAttivo ? 1 : 0);

    if (totaleVociAttive > 0) {
        badge.innerText = totaleVociAttive;
        badge.style.display = 'inline-block';
        badge.classList.toggle('badge-error', haErrori);
        
        // Aggiunge una classe al pulsante per farlo risaltare
        if (btnToggle) btnToggle.classList.add('has-data');
    } else {
        badge.style.display = 'none';
        if (btnToggle) btnToggle.classList.remove('has-data');
    }
}

/* =========================================
   4. INTERFACCIA E COPIA
   ========================================= */

function mostraRisultato(titoloH2, ggLavorativi, dataRiferimento, usaEffetti = false) {    
    const resultSection = document.getElementById('result');
    resultSection.style.display = 'block';
    
    // FIX 4: T00:00:00 per evitare scarto di fuso orario nel conteggio giorni solari
    const startInput = new Date(document.getElementById('startDate').value + "T00:00:00");
    const giorniSolari = Math.ceil((dataRiferimento - startInput) / (1000 * 3600 * 24));
    
    document.getElementById('endDate').innerText = titoloH2;
    document.getElementById('stat-lav').innerText = ggLavorativi;
    document.getElementById('stat-sol').innerText = giorniSolari;

    // --- NUOVA LOGICA: RESET VISTE IN MODALITÀ OFF ---
    // Nascondiamo i contenitori della tabella e del calendario
    document.getElementById('logContainer').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'none';

    // Rimuoviamo lo stato "attivo" dai pulsanti in fondo
    document.getElementById('btnViewTable').classList.remove('active');
    document.getElementById('btnViewCal').classList.remove('active');
    // ------------------------------------------------

    // Genera i contenuti in background
    popolaTabellaDettagli();
    disegnaCalendario();

    // --- LOGICA DI SCROLL INTELLIGENTE ---
    if (usaEffetti) {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function popolaTabellaDettagli() {
    const body = document.getElementById('logBody');
    body.innerHTML = ""; 
    registroGiorni.forEach(item => {
        const riga = document.createElement('tr');
        riga.className = item.classe; 
        riga.innerHTML = `<td>${item.nrGiorno}</td><td><span class="data-evidenziata">${item.data}</span></td><td><span class="status-badge">${item.tipo}</span></td>`;
        body.appendChild(riga);
    });
}

function switchView(view) {
    const tableContainer = document.getElementById('logContainer');
    const calendarContainer = document.getElementById('calendarContainer');
    const btnT = document.getElementById('btnViewTable');
    const btnC = document.getElementById('btnViewCal');

    if (view === 'table') {
        // Toggle della Tabella
        const isTableOpen = tableContainer.style.display === 'block';
        
        if (isTableOpen) {
            tableContainer.style.display = 'none';
            btnT.classList.remove('active');
        } else {
            tableContainer.style.display = 'block';
            calendarContainer.style.display = 'none'; // Chiude l'altro per pulizia
            btnT.classList.add('active');
            btnC.classList.remove('active');
        }
    } 
    
    else if (view === 'calendar') {
        // Toggle del Calendario
        const isCalOpen = calendarContainer.style.display === 'block';
        
        if (isCalOpen) {
            calendarContainer.style.display = 'none';
            btnC.classList.remove('active');
        } else {
            calendarContainer.style.display = 'block';
            tableContainer.style.display = 'none'; // Chiude l'altro per pulizia
            btnC.classList.add('active');
            btnT.classList.remove('active');
            disegnaCalendario(); // Renderizza i quadratini
        }
    }
}

function disegnaCalendario() {
    const grid = document.getElementById('calendarGrid');
    if (!grid || registroGiorni.length === 0) return;
    grid.innerHTML = ""; 

    const isMobile = window.innerWidth < 480;
    const nomiMesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                      "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"];
    
    let meseCorrente = -1;

    registroGiorni.forEach((item, index) => {
        // Estraiamo giorno, mese e anno dalla stringa "GG.MM.AAAA"
        const parti = item.data.split('.');
        const d = parseInt(parti[0]);
        const m = parseInt(parti[1]) - 1; // Mese 0-11
        const a = parseInt(parti[2]);
        const dataOggetto = new Date(a, m, d);

        // --- SE IL MESE CAMBIA, AGGIUNGIAMO L'INTESTAZIONE ---
        if (m !== meseCorrente) {
            meseCorrente = m;
            
            // Creiamo un div che occupa tutte e 7 le colonne
            const monthHeader = document.createElement('div');
            monthHeader.className = "cal-month-title";
            monthHeader.innerText = `${nomiMesi[m]} ${a}`;
            grid.appendChild(monthHeader);

            // Dopo il titolo del mese, rimettiamo le iniziali dei giorni L, M, M...
            const giorniSett = isMobile ? ["L", "M", "M", "G", "V", "S", "D"] : ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
            giorniSett.forEach(g => {
                const h = document.createElement('div');
                h.className = "cal-header";
                h.innerText = g;
                grid.appendChild(h);
            });

            // Calcoliamo l'offset per allineare il primo giorno di questo mese specifico
            let offset = dataOggetto.getDay() - 1;
            if (offset === -1) offset = 6;
            for (let i = 0; i < offset; i++) {
                const empty = document.createElement('div');
                empty.className = "cal-day cal-empty";
                grid.appendChild(empty);
            }
        }

        // ---DISEGNO DEL GIORNO (Tuo codice esistente)---
        const dayDiv = document.createElement('div');
        let tipoClasse = "";
        switch(item.tipo) {
            case "LAVORATIVO": tipoClasse = "cal-lavorativo"; break;
            case "WEEKEND":    tipoClasse = "cal-weekend";    break;
            case "FESTA":      tipoClasse = "cal-festa";      break;
            case "SOSP.":      tipoClasse = "cal-sosp";       break;
            case "PATRONO":    tipoClasse = "cal-festa";      break; // FIX 2: era assente, giorno bianco nel calendario
        }
        
        dayDiv.className = `cal-day ${tipoClasse}`;
        // FIX 2: aggiunta gestione etichetta per PATRONO
        let etichetta;
        if (item.tipo === 'LAVORATIVO') {
            etichetta = isMobile ? `G${item.nrGiorno}` : `GG ${item.nrGiorno}`;
        } else if (item.tipo === 'PATRONO') {
            etichetta = isMobile ? "PAT" : "PATRONO";
        } else {
            etichetta = item.tipo;
        }

        dayDiv.innerHTML = `<span class="cal-date">${d}</span><span class="cal-label">${etichetta}</span>`;
        grid.appendChild(dayDiv);
    });
}

function copiaRisultato(e) {
    if(e) e.preventDefault();
    const dataConsegna = document.getElementById('endDate').innerText;
    const ggLav = document.getElementById('stat-lav').innerText;
    const ggSol = document.getElementById('stat-sol').innerText;
    const inizioInput = document.getElementById('startDate').value;
    const inizio = inizioInput ? new Date(inizioInput).toLocaleDateString('it-IT') : "-";
    
    let messaggio = `*CRONOPROGRAMMA LAVORI*\n--------------------------\n📅 *Inizio:* ${inizio}\n✅ *Consegna:* ${dataConsegna}\n--------------------------\n👷 GG Lavorativi: ${ggLav}\n☀️ GG Solari totali: ${ggSol}\n🗓️ Sabato: ${sabatoLavorativo ? 'Lavorativo' : 'Festivo'}\n`;

    const periodiWrappers = document.querySelectorAll('.periodo-wrapper');
    let sospensioniTxt = "";
    periodiWrappers.forEach(w => {
        const n = w.querySelector('.f-note').value;
        const s = w.querySelector('.f-start').value;
        const e = w.querySelector('.f-end').value;
        if(s && e) {
            const dS = s.split('-').reverse().join('-');
            const dE = e.split('-').reverse().join('-');
            sospensioniTxt += `• dal ${dS} al ${dE}${n ? ` (${n})` : ""}\n`;
        }
    });

    if(sospensioniTxt) messaggio += `\n🚫 *Sospensioni feriali:*\n${sospensioniTxt}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(messaggio).then(() => confermaCopia());
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = messaggio; document.body.appendChild(textArea);
        textArea.select(); document.execCommand('copy');
        document.body.removeChild(textArea); confermaCopia();
    }
}

function confermaCopia() {
    const btn = document.querySelector('.btn-copy');
    const tOriginale = btn.innerText;
    btn.innerText = "COPIATO! ✅"; btn.style.backgroundColor = "#d1fae5";
    setTimeout(() => { btn.innerText = tOriginale; btn.style.backgroundColor = ""; }, 2000);
}

function apriPrintModal() {
    document.getElementById('printModal').style.display = 'flex';
}

function chiudiPrintModal() {
    document.getElementById('printModal').style.display = 'none';
}

function eseguiStampa(tipo) {
    const modal = document.getElementById('printModal');

    // 1. Rigeneriamo i dati e l'HTML per essere sicuri che i contenitori siano pieni
    if (typeof eseguiCalcoloCorretto === "function") {
        eseguiCalcoloCorretto();
    }
    popolaTabellaDettagli();
    disegnaCalendario();

    // 2. Pulizia e applicazione classi
    document.body.classList.remove('print-only-list', 'print-only-cal');
    
    if (tipo === 'solo-lista') {
        document.body.classList.add('print-only-list');
    } else if (tipo === 'solo-cal') {
        document.body.classList.add('print-only-cal');
    }

    // 3. Chiudiamo il modal prima della stampa
    if (modal) modal.style.display = 'none';

    // 4. FIX PER iOS/SAFARI: Usiamo un piccolo timeout (150ms) 
    // per dare tempo al sistema di "digerire" le classi CSS prima di generare il PDF.
    setTimeout(() => {
        requestAnimationFrame(() => {
            window.print();
            
            // 5. Ripristino (con un leggero ritardo dopo la chiusura della finestra di stampa)
            setTimeout(() => {
                document.body.classList.remove('print-only-list', 'print-only-cal');
            }, 500);
        });
    }, 150); 
}

/* =========================================
   5. LISTENERS PER AGGIORNAMENTO AUTOMATICO
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Chiude la sidebar se si clicca fuori (sull'area scura/sfocata)
    document.addEventListener('mousedown', (e) => {
        const sidebar = document.getElementById('profileSidebar');
        // Se la sidebar è aperta E il click NON è dentro la sidebar 
        // E il click NON è sul pulsante che serve ad aprirla...
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !e.target.closest('.user-pill')) {
                toggleProfile(); // La chiude
            }
        }
    });
    const inputs = ['startDate', 'days', 'endDateInput'];
    
    // Gestione ridimensionamento per il calendario
    window.addEventListener('resize', () => {
        if (document.getElementById('calendarContainer').style.display === 'block') {
            disegnaCalendario();
        }
    });

    const patronoIds = ['patronoGiorno', 'patronoMese'];

    patronoIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { 
            eseguiCalcoloCorretto(); 
            el.blur(); // Chiude la tastiera su smartphone e toglie il focus su PC
        }
    });
});

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => eseguiCalcoloCorretto());
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { eseguiCalcoloCorretto(); el.blur(); }
        });
    });
});

function salvaSospensioni() {
    // 1. Identifichiamo l'utente loggato
    const utente = localStorage.getItem('utenteLoggato') || "Ospite";
    
    const periodi = [];
    document.querySelectorAll('.periodo-wrapper').forEach(w => {
        const note = w.querySelector('.f-note').value;
        const s = w.querySelector('.f-start').value;
        const e = w.querySelector('.f-end').value;
        if(s || e || note) periodi.push({start: s, end: e, note: note});
    });

    // 2. CORREZIONE: Salviamo usando il prefisso dell'utente
    // Così diventerà ad esempio: "Alex_sospensioniSalvate"
    localStorage.setItem(utente + '_sospensioniSalvate', JSON.stringify(periodi));
}

/* =========================================
   6. GESTIONE DASHBOARD PROFILO E PROGETTI
   ========================================= */

/**
 * Inizializza la visualizzazione del profilo
 * Chiamata da access.js sia al login che al caricamento pagina
 */
function inizializzaProfilo(nomeUtente) {
    // 1. Aggiorna Nome e Iniziale Avatar nella Sidebar
    const displayNome = document.getElementById('displayUserName');
    const displayAvatar = document.getElementById('userAvatar');
    if(displayNome) displayNome.innerText = nomeUtente;
    if(displayAvatar) displayAvatar.innerText = nomeUtente.charAt(0).toUpperCase();

    // 2. Gestione Log Accessi (ne tiene 3)
    gestisciLogAccessi();

    // 3. Mostra la lista dei progetti salvati nel browser
    renderizzaProgettiSalvati();
}

function gestisciLogAccessi() {
    let accessi = JSON.parse(localStorage.getItem('logs_accesso') || "[]");
    const oraAttuale = new Date().toLocaleString('it-IT', { 
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' 
    });

    // Registra l'accesso solo se diverso dall'ultimo (evita spam al refresh)
    if (accessi[0] !== oraAttuale) {
        accessi.unshift(oraAttuale);
        accessi = accessi.slice(0, 3);
        localStorage.setItem('logs_accesso', JSON.stringify(accessi));
    }

    const logList = document.getElementById('accessLog');
    if(logList) {
        logList.innerHTML = accessi.map(a => `<li><span style="color:var(--primary); font-size:10px;">●</span> ${a}</li>`).join('');
    }
}

function toggleProfile() {
    const sidebar = document.getElementById('profileSidebar');
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
        renderizzaProgettiSalvati();
        renderizzaUltimiAccessi();
    }
}
/**
 * Salva lo stato attuale del calcolatore nel localStorage del browser
 */
/**
 * Salva lo stato attuale nel localStorage (per l'utente) 
 * e invia una copia al database Google Sheets (per la tua analisi).
 */
async function salvaInBrowser() {
    // 1. Identificazione Utente
    const utenteCorrente = localStorage.getItem('utenteLoggato') || "Ospite";
    
    // 2. Chiediamo il nome del progetto
    const nome = prompt("Nome cantiere:", "Cantiere " + (document.getElementById('startDate').value || "Nuovo"));
    if (!nome) return;

    // 3. Raccogliamo i dati delle sospensioni (ferie)
    const periodi = [];
    document.querySelectorAll('.periodo-wrapper').forEach(w => {
        const note = w.querySelector('.f-note').value;
        const s = w.querySelector('.f-start').value;
        const e = w.querySelector('.f-end').value;
        if(s || e) periodi.push({start: s, end: e, note: note});
    });

    // 4. Creiamo l'oggetto Progetto Completo
    const progetto = {
        action: 'salva_progetto', // <--- Fondamentale per il Caso C del tuo Apps Script
        id: Date.now(),
        nomeProgetto: nome,
        user: utenteCorrente,
        inizio: document.getElementById('startDate').value,
        durata: document.getElementById('days').value,
        sabato: sabatoLavorativo,
        patrono: {
            attivo: patronoAttivo,
            gg: document.getElementById('patronoGiorno').value,
            mm: document.getElementById('patronoMese').value
        },
        sospensioni: periodi,
        dev: navigator.userAgent // Info tecnica per la tua analisi
    };

    // --- A. SALVATAGGIO LOCALE (Per la Sidebar dell'utente) ---
    const chiaveUser = "progetti_" + utenteCorrente;
    let progettiLocali = JSON.parse(localStorage.getItem(chiaveUser) || "[]");
    
    // Aggiungiamo il nuovo progetto in cima alla lista
    progettiLocali.unshift(progetto);
    
    // Limitiamo magari a 20 progetti per non intasare il browser
    if(progettiLocali.length > 20) progettiLocali.pop();
    
    localStorage.setItem(chiaveUser, JSON.stringify(progettiLocali));
    
    // Aggiorniamo subito la grafica della sidebar
    renderizzaProgettiSalvati();

    // --- B. SINCRONIZZAZIONE CLOUD (Google Sheets) ---
    // Sostituisci questo URL con quello che ottieni dal "Deploy" di Apps Script
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbztjv1DOyOieKN5qT4meY1nPlqMnOTwjHH4_vTUc7YmPbAOUjiM6Ne1OHuBX6Kmw9bI8A/exec";
    
    try {
        // Invio silenzioso (no-cors) per non bloccare l'utente se la connessione è lenta
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify(progetto)
        });
        console.log("Sincronizzazione Cloud completata.");
    } catch (e) {
        console.error("Errore Sincronizzazione Cloud:", e);
    }

    // 5. Feedback Visivo all'utente
    mostraFeedbackSalvataggio();
}

function mostraFeedbackSalvataggio() {
    const btnSave = document.querySelector('.btn-save-local');
    if(!btnSave) return;
    
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = "✅ Salvato!";
    btnSave.style.backgroundColor = "#059669"; // Verde smeraldo
    
    setTimeout(() => {
        btnSave.innerHTML = originalText;
        btnSave.style.backgroundColor = "";
    }, 2000);
}

function renderizzaProgettiSalvati() {
    const utenteCorrente = localStorage.getItem('utenteLoggato') || "Ospite";
    const chiaveUser = "progetti_" + utenteCorrente;
    const progetti = JSON.parse(localStorage.getItem(chiaveUser) || "[]");
    const listaUI = document.getElementById('savedProjectsList');
    
    if(!listaUI) return;
    listaUI.innerHTML = "";

    progetti.forEach(p => {
        const card = document.createElement('div');
        card.className = "project-card-mini";
        card.onclick = () => caricaProgetto(p.id);

        // --- CORREZIONE QUI: Usa p.nomeProgetto ---
        card.innerHTML = `
            <div class="project-info">
                <strong>${p.nomeProgetto || "Senza Nome"}</strong>
                <small>Inizio: ${p.inizio || "-"}</small>
            </div>
            <button class="btn-del-project" onclick="event.stopPropagation(); eliminaProgetto(${p.id})">&times;</button>
        `;
        listaUI.appendChild(card);
    });
}

function caricaProgetto(id) {
    // 1. Identifichiamo l'utente attivo e la sua scatola specifica
    const utenteCorrente = localStorage.getItem('utenteLoggato') || "Ospite";
    const chiaveUser = "progetti_" + utenteCorrente;
    
    // 2. Leggiamo i progetti solo di questo utente
    const progetti = JSON.parse(localStorage.getItem(chiaveUser) || "[]");
    
    // 3. TROVIAMO IL PROGETTO PER ID (non più per indice numerico 0,1,2...)
    const p = progetti.find(item => item.id === id);

    if (!p) {
        console.error("Progetto non trovato per l'ID:", id);
        return;
    }

    // --- DA QUI IN POI IL TUO CODICE ORIGINALE (con piccole correzioni) ---

    // 1. Ripristina input base
    document.getElementById('startDate').value = p.inizio;
    document.getElementById('days').value = p.durata;
    
    // 2. Ripristina Sabato
    sabatoLavorativo = p.sabato;
    const btnSat = document.getElementById('btnSat');
    if(btnSat) {
        btnSat.classList.toggle('active', sabatoLavorativo);
        btnSat.innerText = "Sabato Lavorativo: " + (sabatoLavorativo ? "SÌ" : "NO");
    }

    // 3. Ripristina Patrono
    patronoAttivo = p.patrono.attivo;
    document.getElementById('patronoGiorno').value = p.patrono.gg || "";
    document.getElementById('patronoMese').value = p.patrono.mm || "";
    
    // Assicurati che questa funzione esista, altrimenti usa la logica manuale
    if (typeof aggiornaStatoPatrono === "function") {
        aggiornaStatoPatrono();
    }

    // 4. Ripristina Sospensioni (Ferie)
    const container = document.getElementById('listaSospensioni');
    container.innerHTML = ""; // Svuota la lista attuale
    
    if (p.sospensioni && p.sospensioni.length > 0) {
        // Cicla e ricrea ogni riga salvata
        p.sospensioni.forEach(s => {
            if (typeof aggiungiPeriodo === "function") {
                aggiungiPeriodo(s.start, s.end, s.note);
            }
        });
    }

    // 5. Chiudi Sidebar e Ricalcola tutto
    toggleProfile();
    
    if (typeof eseguiCalcoloCorretto === "function") {
        eseguiCalcoloCorretto();
    }
}

function eliminaProgetto(id) {
    // 1. Identifichiamo l'utente e la sua "scatola" specifica
    const utenteCorrente = localStorage.getItem('utenteLoggato') || "Ospite";
    const chiaveUser = "progetti_" + utenteCorrente;

    if (!confirm("Sei sicuro di voler eliminare questo progetto?")) return;

    // 2. Leggiamo i progetti solo di quell'utente
    let progetti = JSON.parse(localStorage.getItem(chiaveUser) || "[]");

    // 3. Teniamo tutti i progetti TRANNE quello con l'ID che vogliamo eliminare
    progetti = progetti.filter(p => p.id !== id);

    // 4. Salviamo la lista pulita nella scatola dell'utente
    localStorage.setItem(chiaveUser, JSON.stringify(progetti));

    // 5. Aggiorniamo la sidebar
    renderizzaProgettiSalvati();
}

function logout() {
    // Rimuoviamo sia il token di autorizzazione che il nome utente
    localStorage.removeItem('cronoprogramma_auth');
    localStorage.removeItem('utenteLoggato'); 
    
    // Ricarichiamo la pagina per resettare tutto e mostrare il LockScreen
    location.reload();
}

// Funzione per aggiornare l'interfaccia dopo il login
function aggiornaInterfacciaUtente(nome) {
    const iniziale = nome.charAt(0).toUpperCase();
    
    // Aggiorna l'avatar nella sidebar
    document.getElementById('userAvatar').innerText = iniziale;
    document.getElementById('displayUserName').innerText = nome;
    
    // Aggiorna l'avatar nella "Pillola" dell'header
    const headerInit = document.getElementById('headerInitials');
    if(headerInit) headerInit.innerText = iniziale;
}
function renderizzaUltimiAccessi() {
    const utenteCorrente = localStorage.getItem('utenteLoggato') || "Ospite";
    const chiaveAccessi = "accessi_" + utenteCorrente;
    const accessi = JSON.parse(localStorage.getItem(chiaveAccessi) || "[]");
    
    const listaUI = document.getElementById('recentAccessList'); 
    if (!listaUI) return;

    if (accessi.length === 0) {
        listaUI.innerHTML = '<p style="font-size:0.75rem; color:grey; padding:10px; text-align:center;">Nessun accesso registrato.</p>';
        return;
    }

    listaUI.innerHTML = accessi.map(acc => `
        <div style="display:flex; justify-content:space-between; padding:8px 5px; border-bottom:1px solid #f1f5f9; font-size:0.8rem;">
            <span style="color:var(--text-main)">📅 ${acc.data}</span>
            <span style="color:var(--primary); font-weight:600;">${acc.dispositivo}</span>
        </div>
    `).join('');
}