// Statistics Page JavaScript
class StatisticsView {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        // Wait for data manager to load
        while (!window.dataManager) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for data manager to finish initializing
        if (window.dataManager.initPromise) {
            await window.dataManager.initPromise;
        }

        this.setupEventListeners();
        this.loadStatistics();
        this.createCharts();
        this.loadDetailedStats();
    }

    setupEventListeners() {
        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
    }

    loadStatistics() {
        const stats = window.dataManager.getStatistics();
        const wishlist = window.dataManager.getWishlist();

        // Update overview stats
        document.getElementById('totalCars').textContent = stats.totalCars;
        document.getElementById('totalValue').textContent = window.dataManager.formatCurrency(stats.totalValue);
        document.getElementById('averagePrice').textContent = window.dataManager.formatCurrency(stats.averagePrice);
        document.getElementById('wishlistCount').textContent = wishlist.length;

        // Update price analysis
        this.updatePriceAnalysis();
    }

    updatePriceAnalysis() {
        const cars = window.dataManager.getCars();
        
        if (cars.length === 0) {
            document.getElementById('mostExpensive').textContent = '-';
            document.getElementById('leastExpensive').textContent = '-';
            document.getElementById('priceRange').textContent = '-';
            return;
        }

        const prices = cars.map(car => parseFloat(car.purchasePrice) || 0);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        
        const mostExpensiveCar = cars.find(car => parseFloat(car.purchasePrice) === maxPrice);
        const leastExpensiveCar = cars.find(car => parseFloat(car.purchasePrice) === minPrice);

        document.getElementById('mostExpensive').textContent = 
            `${mostExpensiveCar.name} - ${window.dataManager.formatCurrency(maxPrice)}`;
        document.getElementById('leastExpensive').textContent = 
            `${leastExpensiveCar.name} - ${window.dataManager.formatCurrency(minPrice)}`;
        document.getElementById('priceRange').textContent = 
            `${window.dataManager.formatCurrency(minPrice)} - ${window.dataManager.formatCurrency(maxPrice)}`;
    }

    createCharts() {
        const stats = window.dataManager.getStatistics();
        
        this.createPieChart('brandChart', stats.brandStats, 'Cars by Brand');
        this.createPieChart('seriesChart', stats.seriesStats, 'Cars by Series');
        this.createPieChart('colorChart', stats.colorStats, 'Cars by Color');
        this.createPieChart('conditionChart', stats.conditionStats, 'Cars by Condition');
        this.createTimelineChart();
    }

    createPieChart(canvasId, data, title) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = Object.keys(data);
        const values = Object.values(data);
        
        // Generate colors
        const colors = this.generateColors(labels.length);

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createTimelineChart() {
        const cars = window.dataManager.getCars();
        const ctx = document.getElementById('acquisitionChart');
        if (!ctx || cars.length === 0) return;

        // Group cars by month
        const monthlyData = {};
        cars.forEach(car => {
            if (car.purchaseDate) {
                const date = new Date(car.purchaseDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const cumulativeCounts = [];
        let cumulative = 0;
        
        const labels = sortedMonths.map(month => {
            cumulative += monthlyData[month];
            cumulativeCounts.push(cumulative);
            return new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        });

        if (this.charts.acquisitionChart) {
            this.charts.acquisitionChart.destroy();
        }

        this.charts.acquisitionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Cars',
                    data: cumulativeCounts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    loadDetailedStats() {
        const cars = window.dataManager.getCars();
        
        this.loadBrandStats(cars);
        this.loadSeriesStats(cars);
    }

    loadBrandStats(cars) {
        const brandStats = {};
        
        cars.forEach(car => {
            if (!brandStats[car.brand]) {
                brandStats[car.brand] = {
                    count: 0,
                    totalValue: 0,
                    prices: []
                };
            }
            
            brandStats[car.brand].count++;
            const price = parseFloat(car.purchasePrice) || 0;
            brandStats[car.brand].totalValue += price;
            brandStats[car.brand].prices.push(price);
        });

        const tbody = document.getElementById('brandStatsTable');
        if (!tbody) return;

        tbody.innerHTML = Object.entries(brandStats)
            .sort(([,a], [,b]) => b.count - a.count)
            .map(([brand, stats]) => {
                const avgPrice = stats.totalValue / stats.count;
                return `
                    <tr>
                        <td><strong>${brand}</strong></td>
                        <td>${stats.count}</td>
                        <td>$${stats.totalValue.toFixed(2)}</td>
                        <td>$${avgPrice.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
    }

    loadSeriesStats(cars) {
        const seriesStats = {};
        
        cars.forEach(car => {
            if (!seriesStats[car.series]) {
                seriesStats[car.series] = {
                    count: 0,
                    totalValue: 0,
                    prices: []
                };
            }
            
            seriesStats[car.series].count++;
            const price = parseFloat(car.purchasePrice) || 0;
            seriesStats[car.series].totalValue += price;
            seriesStats[car.series].prices.push(price);
        });

        const tbody = document.getElementById('seriesStatsTable');
        if (!tbody) return;

        tbody.innerHTML = Object.entries(seriesStats)
            .sort(([,a], [,b]) => b.count - a.count)
            .map(([series, stats]) => {
                const avgPrice = stats.totalValue / stats.count;
                return `
                    <tr>
                        <td><strong>${series}</strong></td>
                        <td>${stats.count}</td>
                        <td>$${stats.totalValue.toFixed(2)}</td>
                        <td>$${avgPrice.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
    }

    generateColors(count) {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
            '#fad0c4', '#ffd1ff', '#b2fefa', '#0ed2f7'
        ];
        
        if (count <= colors.length) {
            return colors.slice(0, count);
        }
        
        // Generate additional colors if needed
        const additionalColors = [];
        for (let i = colors.length; i < count; i++) {
            const hue = (i * 137.508) % 360; // Golden angle approximation
            additionalColors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return [...colors, ...additionalColors];
    }
}

// Add CSS for charts
const chartStyles = `
<style>
.stats-container {
    padding: 2rem;
}

.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.chart-container {
    background: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    height: 350px;
}

.chart-container h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.1rem;
    text-align: center;
}

.chart-container canvas {
    max-height: 280px;
}

.detailed-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.stats-table {
    background: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stats-table h3 {
    margin-bottom: 1rem;
    color: #333;
}

.stats-table table {
    width: 100%;
    border-collapse: collapse;
}

.stats-table th,
.stats-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.stats-table th {
    background: #f8f9fa;
    font-weight: 600;
}

.stats-table tr:hover {
    background: #f8f9fa;
}

.timeline-section {
    background: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
}

.timeline-section h3 {
    margin-bottom: 1rem;
    color: #333;
}

.timeline-chart {
    height: 300px;
}

.price-analysis {
    background: white;
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.price-analysis h3 {
    margin-bottom: 1rem;
    color: #333;
}

.price-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.price-stat {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 10px;
    text-align: center;
}

.price-label {
    display: block;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.price-value {
    display: block;
    color: #333;
    font-weight: 600;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .stats-container {
        padding: 1rem;
    }
    
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .detailed-stats {
        grid-template-columns: 1fr;
    }
    
    .chart-container {
        height: 300px;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', chartStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsView = new StatisticsView();
});
