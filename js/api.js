const API_KEY = 'JJOMYMFGAMMO6A0R';
const SYMBOL = 'AAPL'; // Exemple : Apple
const URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&apikey=${API_KEY}`;

async function fetchStockData() {
    try {
        const response = await fetch(URL);
        const data = await response.json();
        
        // Extraction des dates et des prix de clôture
        const timeSeries = data["Time Series (Daily)"];
        const labels = Object.keys(timeSeries).reverse().slice(-10); // 10 derniers jours
        const prices = labels.map(date => parseFloat(timeSeries[date]["4. close"]));

        renderChart(labels, prices);
    } catch (error) {
        console.error("Erreur lors de la récupération :", error);
    }
}

function renderChart(labels, prices) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Prix ${SYMBOL} (USD)`,
                data: prices,
                borderColor: '#10b981', // Vert émeraude
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

fetchStockData();