const STOCKS = [
    { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Défense', news: "Contrats OTAN en hausse : Flux acheteur spéculatif." },
    { symbol: 'RHM.DE', name: 'Rheinmetall', sector: 'Défense', news: "Réarmement européen : Fort potentiel de croissance long-terme." },
    { symbol: 'DSY.PA', name: 'Dassault Aviation', sector: 'Défense', news: "Commandes de Rafale : Carnet de commandes à un niveau record." },
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Énergie', news: "Tensions au Moyen-Orient : Pression haussière sur le brut." },
    { symbol: 'NVDA', name: 'Nvidia Corp', sector: 'IA', news: "Demande de GPU IA : Leader incontesté du secteur." },
    { symbol: 'TCEHY', name: 'Tencent (Riot)', sector: 'Tech', news: "Expansion mobile : Nouveau cycle de revenus attendu." },
    { symbol: 'PLTR', name: 'Palantir Tech', sector: 'Big Data', news: "Contrats gouvernementaux : Adoption massive de l'IA de défense." }
];

let charts = {}; // Pour stocker les instances de graphiques

async function init() {
    setupSelectors();
    // Chargement initial des 3 premiers
    await updateSlot(1, STOCKS[0].symbol);
    await updateSlot(2, STOCKS[1].symbol);
    await updateSlot(3, STOCKS[2].symbol);
}

function setupSelectors() {
    [1, 2, 3].forEach(slotId => {
        const select = document.getElementById(`select-${slotId}`);
        STOCKS.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.symbol;
            opt.innerText = `${s.symbol} - ${s.name}`;
            select.appendChild(opt);
        });
        select.value = STOCKS[slotId - 1].symbol;
        select.addEventListener('change', (e) => updateSlot(slotId, e.target.value));
    });
}

async function updateSlot(slotId, symbol) {
    const statusText = document.getElementById('api-status');
    statusText.innerText = `Chargement ${symbol}...`;
    
    const stockInfo = STOCKS.find(s => s.symbol === symbol);
    document.getElementById(`insight-${slotId}`).innerText = stockInfo.news;

    const data = await getStockData(symbol);
    if (data) {
        displaySlot(slotId, symbol, data);
        statusText.innerText = "Monitoring Actif";
    } else {
        statusText.innerText = "Erreur API / Limite atteinte";
    }
}

async function getStockData(symbol) {
    const CACHE_KEY = `stock_${symbol}`;
    const cached = localStorage.getItem(CACHE_KEY);

    // Priorité à l'API si le cache est vieux (1h) ou vide
    if (cached) {
        const cacheObj = JSON.parse(cached);
        if ((Date.now() - cacheObj.timestamp) < 3600000) {
            return cacheObj.payload;
        }
    }

    try {
        const keyResp = await fetch('./config.txt');
        const API_KEY = (await keyResp.text()).trim();
        const URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
        
        const response = await fetch(URL);
        const json = await response.json();
        
        if (json["Time Series (Daily)"]) {
            const timeSeries = json["Time Series (Daily)"];
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                payload: timeSeries
            }));
            // Délai de sécurité pour le prochain appel potentiel
            await new Promise(r => setTimeout(r, 13000));
            return timeSeries;
        }
    } catch (e) { console.error(e); }
    return null;
}

function displaySlot(slotId, symbol, timeSeries) {
    const labels = Object.keys(timeSeries).reverse().slice(-12);
    const prices = labels.map(date => parseFloat(timeSeries[date]["4. close"]));
    
    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const change = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
    
    document.getElementById(`price-${slotId}`).innerText = `$${lastPrice.toFixed(2)}`;
    const changeEl = document.getElementById(`change-${slotId}`);
    changeEl.innerText = `${change > 0 ? '▲' : '▼'} ${Math.abs(change)}%`;
    changeEl.className = `font-mono text-sm ${change >= 0 ? 'text-emerald-400' : 'text-red-500'}`;

    renderChart(slotId, labels, prices, change >= 0);
}

function renderChart(slotId, labels, prices, isPositive) {
    const ctx = document.getElementById(`chart-${slotId}`).getContext('2d');
    const color = isPositive ? '#10b981' : '#ef4444';
    
    if (charts[slotId]) charts[slotId].destroy();

    charts[slotId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: prices,
                borderColor: color,
                borderWidth: 3,
                pointRadius: 0,
                fill: true,
                backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#475569' } }
            }
        }
    });
}

init();