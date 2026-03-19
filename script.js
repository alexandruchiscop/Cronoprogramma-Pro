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
    const tabF = document.getElementById('tabForward'), tabB = document.getElementById('tabBackward');
    const daysInput = document.getElementById('days'), endDateInput = document.getElementById('endDateInput');
    const label = document.getElementById('dynamicLabel'), mainBtn = document.getElementById('mainBtn');
    const resultLabel = document.getElementById('resultLabel');

    tabF.classList.toggle('active', mode === 'forward');
    tabB.classList.toggle('active', mode === 'backward');

    if (mode === 'forward') {
        daysInput.style.display = 'block'; 
        endDateInput.style.display = 'none';
        label.innerText = "Durata Lavorativa (gg)"; 
        mainBtn.innerText = "Calcola Scadenza";
        resultLabel.innerText = "CONSEGNA PREVISTA";
    } else {
        daysInput.style.display = 'none'; 
        endDateInput.style.display = 'block';
        label.innerText = "Fine Lavori (Scadenza)"; 
        mainBtn.innerText = "Calcola Giorni Disponibili";
        resultLabel.innerText = "GIORNI DISPONIBILI";
    }

    // --- RESET DELLE VISTE IN FONDO (Novità) ---
    // Nascondiamo i contenitori della lista e del calendario
    const logContainer = document.getElementById('logContainer');
    const calendarContainer = document.getElementById('calendarContainer');
    if (logContainer) logContainer.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'none';

    // Rimuoviamo lo stato "attivo" dai due tasti in fondo
    const btnT = document.getElementById('btnViewTable');
    const btnC = document.getElementById('btnViewCal');
    if (btnT) btnT.classList.remove('active');
    if (btnC) btnC.classList.remove('active');
    // --------------------------------------------

    eseguiCalcoloCorretto();
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

    // 2. ESECUZIONE CALCOLO
    if (currentMode === 'forward') { 
        calcolaCronoprogramma(); 
    } else { 
        calcolaRetroPlanning(); 
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
    const oggi = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = oggi;
    document.getElementById('days').value = "";
    document.getElementById('endDateInput').value = "";
    document.getElementById('listaSospensioni').innerHTML = "";
    aggiungiPeriodo();
    document.getElementById('ferieMenu').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    const logContainer = document.getElementById('logContainer');
    if(logContainer) logContainer.style.display = 'none';
    document.getElementById('logBody').innerHTML = "";
    
    if (currentMode === 'forward') { document.getElementById('days').focus(); } 
    else { document.getElementById('endDateInput').focus(); }
    
    const grid = document.getElementById('calendarGrid');
    if(grid) grid.innerHTML = "";
    document.getElementById('calendarContainer').style.display = 'none';
    document.getElementById('btnViewTable').classList.add('active');
    document.getElementById('btnViewCal').classList.remove('active');
}

/* =========================================
   3. MOTORE DI CALCOLO
   ========================================= */

function calcolaPasqua(anno) {
    const a = anno % 19, b = Math.floor(anno / 100), c = anno % 4, d = Math.floor(b / 4),
          e = Math.floor((b + 8) / 25), f = Math.floor((b - d + 1) / 3),
          g = (19 * a + b - d - e + f + 15) % 30, h = anno % 7,
          i = Math.floor((a + 11 * g) / 319), j = (2 * c + 4 * d + 6 * g + h - i + 32) % 7;
    const mese = Math.floor((g - i + j + 114) / 31), giorno = ((g - i + j + 114) % 31) + 1;
    return new Date(anno, mese - 1, giorno);
}

function analizzaGiorno(data) {
    const anno = data.getFullYear();
    const gg = data.getDate();
    const mm = data.getMonth() + 1;
    const tagFesta = `${String(gg).padStart(2, '0')}-${String(mm).padStart(2, '0')}`;
    const dataFormattata = `${String(gg).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${anno}`;

    // --- CONTROLLO SANTO PATRONO ---
    const pGiorno = parseInt(document.getElementById('patronoGiorno').value);
    const pMese = parseInt(document.getElementById('patronoMese').value);

   if (patronoAttivo && gg === pGiorno && mm === pMese) {
        return { data: dataFormattata, tipo: "PATRONO", classe: "row-festa" };
    }

    const periodiSosp = document.querySelectorAll('.periodo-item');
    const dataControllo = new Date(data);
    dataControllo.setHours(0, 0, 0, 0);

    for (let p of periodiSosp) {
        const startInput = p.querySelector('.f-start');
        const endInput = p.querySelector('.f-end');
        const wrapper = p.closest('.periodo-wrapper');
        const errorMsg = wrapper ? wrapper.querySelector('.error-msg') : null;
        
        const sVal = startInput.value;
        const eVal = endInput.value;
        
        if (sVal && eVal) {
            const dInizio = new Date(sVal);
            const dFine = new Date(eVal);
            dInizio.setHours(0, 0, 0, 0);
            dFine.setHours(0, 0, 0, 0);

            if (dFine < dInizio) {
                startInput.classList.add('input-error');
                endInput.classList.add('input-error');
                if (errorMsg) errorMsg.style.display = 'block';
                continue; 
            } else {
                startInput.classList.remove('input-error');
                endInput.classList.remove('input-error');
                if (errorMsg) errorMsg.style.display = 'none';
            }

            if (dataControllo >= dInizio && dataControllo <= dFine) {
                return { data: dataFormattata, tipo: "SOSP.", classe: "row-festa" };
            }
        }
    }

   const pasqua = calcolaPasqua(anno);
    const pasquetta = new Date(pasqua);
    pasquetta.setDate(pasqua.getDate() + 1);
    
    const dIso = data.toISOString().split('T')[0];
    const pIso = pasqua.toISOString().split('T')[0];
    const pqIso = pasquetta.toISOString().split('T')[0];

    // 1. Priorità assoluta: Feste (Pasqua, Pasquetta e Feste Fisse)
    if (dIso === pIso || dIso === pqIso || FESTE_FISSE.includes(tagFesta)) {
        return { data: dataFormattata, tipo: "FESTA", classe: "row-festa" };
    }

    // 2. Weekend (assegniamo "row-festa" per avere il colore rosso)
    if (data.getDay() === 0) { // Domenica
        return { data: dataFormattata, tipo: "WEEKEND", classe: "row-festa" };
    }
    if (data.getDay() === 6 && !sabatoLavorativo) { // Sabato (se non lavorativo)
        return { data: dataFormattata, tipo: "WEEKEND", classe: "row-festa" };
    }
    
    // 3. Altrimenti è lavorativo
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

function calcolaCronoprogramma() {
    const startInput = document.getElementById('startDate').value;
    const daysInput = parseInt(document.getElementById('days').value);
    if (!startInput || isNaN(daysInput) || daysInput <= 0) return;

    let dataCorrente = new Date(startInput);
    let giorniTrovati = 0;
    registroGiorni = []; 

    while (giorniTrovati < daysInput) {
        dataCorrente.setDate(dataCorrente.getDate() + 1);
        const analisi = analizzaGiorno(new Date(dataCorrente));
        
        if (analisi.tipo === "LAVORATIVO") {
            giorniTrovati++;
            analisi.nrGiorno = giorniTrovati;
        } else {
            analisi.nrGiorno = "-";
        }
        registroGiorni.push(analisi);
    }
    const titolo = dataCorrente.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    mostraRisultato(titolo, giorniTrovati, dataCorrente);
}

function calcolaRetroPlanning() {
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDateInput').value;
    if (!startVal || !endVal) return;
    let dataInizio = new Date(startVal), dataFine = new Date(endVal);
    if (dataFine <= dataInizio) { document.getElementById('result').style.display = 'none'; return; }

    let dataCorrente = new Date(dataInizio);
    let ggLavorativi = 0;
    registroGiorni = [];

    while (dataCorrente < dataFine) {
        dataCorrente.setDate(dataCorrente.getDate() + 1);
        const analisi = analizzaGiorno(new Date(dataCorrente));
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

function mostraRisultato(titoloH2, ggLavorativi, dataRiferimento) {
    // 1. Mostra la sezione risultati
    const resultSection = document.getElementById('result');
    resultSection.style.display = 'block';
    
    const startInput = new Date(document.getElementById('startDate').value);
    const giorniSolari = Math.ceil((dataRiferimento - startInput) / (1000 * 3600 * 24));
    
    // 2. Inserisce i testi nelle card
    document.getElementById('endDate').innerText = titoloH2;
    document.getElementById('stat-lav').innerText = ggLavorativi;
    document.getElementById('stat-sol').innerText = giorniSolari;

    // --- RESET STATO VISTE DETTAGLIATE (Novità) ---
    // Nascondiamo i contenitori per evitare che rimangano aperti al cambio dati
    document.getElementById('logContainer').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'none';

    // Rimuoviamo la classe 'active' da entrambi i tasti
    document.getElementById('btnViewTable').classList.remove('active');
    document.getElementById('btnViewCal').classList.remove('active');
    // ----------------------------------------------

    // 3. Genera i contenuti (Liste e Calendario vengono creati in background)
    popolaTabellaDettagli();
    disegnaCalendario();

    // --- EFFETTO ATTENZIONE CON RITARDO DI 500ms ---
    const switcher = document.querySelector('.scelta-vista-switcher');
    if (switcher) {
        // Rimuoviamo subito la classe per resettare lo stato dell'animazione
        switcher.classList.remove('shake-now');
        
        // Impostiamo il timer per la vibrazione
        setTimeout(() => {
            // Forza il ricalcolo per far ripartire l'animazione
            void switcher.offsetWidth; 
            
            // Fa partire la vibrazione
            switcher.classList.add('shake-now');
            
            // Accompagna la vista verso i tasti se sono fuori schermo
            switcher.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 500); // 500ms di attesa come richiesto
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