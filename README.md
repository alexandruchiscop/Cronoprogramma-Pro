# 📅 Cronoprogramma Pro

Calcolatore deterministico per la pianificazione di scadenze e cronoprogrammi basati su giorni lavorativi effettivi. 🚀

## 🛠 Funzionalità principali

Il software permette di gestire tempistiche di progetto complesse attraverso due modalità operative:

* **Pianificazione Diretta (Forward):** Calcola la data di fine lavori partendo dalla data di inizio e dalla durata in giorni lavorativi. ⏱️
* **Retro-Planning (Backward):** Determina i giorni lavorativi disponibili data una scadenza improrogabile. 🏁

## 🏖️ Gestione Calendario e Sospensioni

L'algoritmo di calcolo integra filtri personalizzabili per riflettere le reali condizioni operative:

* **Sospensioni Feriali:** Possibilità di inserire multipli intervalli di date (es. chiusure estive o natalizie) da escludere dal conteggio. ❄️
* **Santo Patrono:** Modulo specifico per la festività locale, con validazione automatica dei campi mese/giorno. 🏛️
* **Weekend:** Gestione flessibile del sabato (lavorativo o non lavorativo). 🗓️
* **Persistenza:** Salvataggio automatico delle impostazioni e dell'ultimo calcolo tramite `localStorage`. 💾

## 📱 Caratteristiche Interfaccia

* **Dual View:** Visualizzazione dei risultati tramite lista dettagliata giorno per giorno o vista calendario sintetica. 📋
* **Mobile Optimized:** Input numerici ottimizzati per smartphone (apertura automatica del tastierino) e gestione dei limiti di data. 📲
* **Feedback Dinamico:** Animazioni di stato (shake effect) e badge di notifica per segnalare la presenza di sospensioni attive nel calcolo. 🔔

## 💻 Note Tecniche

Sviluppato in **Vanilla JavaScript**, il progetto non richiede dipendenze esterne o database, garantendo massima velocità di esecuzione e privacy dei dati (elaborati esclusivamente lato utenti).

---
*Tool di utilità tecnica per la pianificazione professionale.*
