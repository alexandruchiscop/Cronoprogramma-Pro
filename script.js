/* =========================================
   1. CONFIGURAZIONE E STATO
   ========================================= */
const FESTE_FISSE = ["01-01", "06-01", "25-04", "01-05", "02-06", "15-08", "01-11", "08-12", "25-12", "26-12"];
let registroGiorni = [];
let sabatoLavorativo = localStorage.getItem('sabatoLavorativo') === 'true';
let currentMode = 'forward';
let patronoAttivo = localStorage.getItem('patronoAttivo') === 'true';

window.onload = () => {
    // 1. Gestione Sabato
    const btn = document.getElementById('btnSat');
    if (sabatoLavorativo) {
        btn.classList.add('active');
        btn.innerText = "Sabato Lavorativo: SÌ";
    }

    // 2. RECUPERO DATA E DURATA
    const ultimaData = localStorage.getItem('ultimaDataInizio');
    const ultimiGiorni = localStorage.getItem('ultimaDurata');
    const oggi = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = ultimaData || oggi;
    document.getElementById('days').value = ultimiGiorni || "10";

    // --- NUOVO: RECUPERO DATI PATRONO ---
    patronoAttivo = localStorage.getItem('patronoAttivo') === 'true';
    document.getElementById('patronoGiorno').value = localStorage.getItem('patronoGG') || "";
    document.getElementById('patronoMese').value = localStorage.getItem('patronoMM') || "";
    aggiornaStatoPatrono(); // Questa funzione imposterà il colore del tasto e mostrerà i campi

    // 3. Recupero Sospensioni
    const datiSalvati = JSON.parse(localStorage.getItem('sospensioniSalvate') || "[]");
    const container = document.getElementById('listaSospensioni');
    container.innerHTML = ""; 
    
    if (datiSalvati.length > 0) {
        datiSalvati.forEach(p => {
            aggiungiPeriodo(p.start, p.end, p.note);
        });
    } else {
        aggiungiPeriodo();
    }
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
            <input type="text" class="f-note" placeholder="Descrizione (es. Ferie Natale)" value="${note}" oninput="eseguiCalcoloCorretto()">
        </div>
        <div class="periodo-item">
            <input type="date" class="f-start" value="${start}" onchange="eseguiCalcoloCorretto()">
            <input type="date" class="f-end" value="${end}" onchange="eseguiCalcoloCorretto()">
            <button type="button" class="btn-remove-periodo" onclick="this.parentElement.parentElement.remove(); eseguiCalcoloCorretto();">×</button>
        </div>
        <div class="error-msg" style="display:none; color: #dc2626; font-size: 0.7rem; font-weight: 700; margin-top: -8px; margin-bottom: 12px; margin-left: 5px;">
            ⚠️ La data di fine deve essere successiva all'inizio
        </div>
    `;
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
    
    // 3. SALVATAGGIO VALORI
    localStorage.setItem('ultimaDataInizio', document.getElementById('startDate').value);
    localStorage.setItem('ultimaDurata', document.getElementById('days').value);
    
    localStorage.setItem('patronoAttivo', patronoAttivo);
    localStorage.setItem('patronoGG', inputG.value);
    localStorage.setItem('patronoMM', inputM.value);
    
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
    const a = anno % 19;
    const b = Math.floor(anno / 100);
    const c = anno % 4;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    
    // Il calcolo finale che determina mese e giorno
    const n = h + l - 7 * m + 114;
    const mese = Math.floor(n / 31);
    const giorno = (n % 31) + 1;

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

    // --- CALCOLO PASQUA E PASQUETTA (MATEMATICO) ---
    const pDate = calcolaPasqua(anno);
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
        btn.innerText = "Festa Santo Patrono: ATTIVA"; // Più tecnico di "SÌ"
        inputs.style.display = 'flex';
    } else {
        btn.classList.remove('active');
        btn.innerText = "Festa Santo Patrono: NON ATTIVA";
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

function calcolaRetroPlanning() {
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
    
    mostraRisultato(`${ggLavorativi} GIORNI`, ggLavorativi, dataFine);
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
    
    const startInput = new Date(document.getElementById('startDate').value);
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
            case "WEEKEND": tipoClasse = "cal-weekend"; break;
            case "FESTA": tipoClasse = "cal-festa"; break;
            case "SOSP.": tipoClasse = "cal-sosp"; break;
        }
        
        dayDiv.className = `cal-day ${tipoClasse}`;
        const etichetta = (isMobile && item.tipo === 'LAVORATIVO') ? `G${item.nrGiorno}` : (item.tipo === 'LAVORATIVO' ? `GG ${item.nrGiorno}` : item.tipo);

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

/* =========================================
   5. LISTENERS PER AGGIORNAMENTO AUTOMATICO
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
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
    const periodi = [];
    document.querySelectorAll('.periodo-wrapper').forEach(w => {
        const note = w.querySelector('.f-note').value;
        const s = w.querySelector('.f-start').value;
        const e = w.querySelector('.f-end').value;
        if(s || e || note) periodi.push({start: s, end: e, note: note});
    });
    localStorage.setItem('sospensioniSalvate', JSON.stringify(periodi));
}
