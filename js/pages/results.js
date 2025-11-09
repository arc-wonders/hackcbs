// js/pages/results.js - Results & Visualization Page Module

function ResultsPage() {
    return `
        ${AppState.queryResults.length === 0 ? `
            <div class="alert alert-info">
                ℹ️ No query results available. Execute a query first to see visualizations.
            </div>
        ` : ''}

        <div class="card visualization-card">
            <div class="card-header">
                <h3 class="card-title">Data Visualization</h3>
                <p class="card-subtitle">Interactive charts and graphs</p>
            </div>
            
            <div class="chart-controls">
                <label class="form-label">Chart Type:</label>
                <div class="chart-type-selector">
                    <button class="chart-type-btn active" data-type="bar" onclick="selectChartType('bar', this)">
                        <span class="chart-type-icon">📊</span>
                        <span>Bar</span>
                    </button>
                    <button class="chart-type-btn" data-type="line" onclick="selectChartType('line', this)">
                        <span class="chart-type-icon">📈</span>
                        <span>Line</span>
                    </button>
                    <button class="chart-type-btn" data-type="pie" onclick="selectChartType('pie', this)">
                        <span class="chart-type-icon">🥧</span>
                        <span>Pie</span>
                    </button>
                    <button class="chart-type-btn" data-type="doughnut" onclick="selectChartType('doughnut', this)">
                        <span class="chart-type-icon">🍩</span>
                        <span>Doughnut</span>
                    </button>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="mainChart" width="400" height="400"></canvas>
            </div>
        </div>

        ${AppState.queryResults.length > 0 ? `
            <div class="card insights-card">
                <div class="card-header">
                    <h3 class="card-title">Data Insights</h3>
                    <p class="card-subtitle">Key metrics at a glance</p>
                </div>
                <div class="stats-grid">
                    <div class="stat-card-mini">
                        <div class="stat-label">Total Records</div>
                        <div class="stat-value-accent" id="totalRecords">-</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-label">Average Value</div>
                        <div class="stat-value-accent" id="avgValue">-</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-label">Maximum</div>
                        <div class="stat-value-accent" id="maxValue">-</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-label">Minimum</div>
                        <div class="stat-value-accent" id="minValue">-</div>
                    </div>
                </div>
            </div>

            <div class="card data-table-card">
                <div class="card-header">
                    <h3 class="card-title">Raw Data</h3>
                    <p class="card-subtitle">Complete dataset view</p>
                </div>
                <div class="table-container">
                    <table>
                        <thead id="visualResultsHead"></thead>
                        <tbody id="visualResultsBody"></tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="btn-group">
                    <button class="btn btn-accent" onclick="navigateTo('export')">Export Results →</button>
                    <button class="btn btn-secondary" onclick="downloadChart()">Download Chart</button>
                    <button class="btn btn-secondary" onclick="navigateTo('query')">New Query</button>
                </div>
            </div>
        ` : ''}
    `;
}

function initializeResultsPage() {
    console.log('Initializing Results Page');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        showAlert('Chart library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Check if we have data to display
    if (!AppState.queryResults || AppState.queryResults.length === 0) {
        console.log('No query results available');
        showAlert('No query results available. Please execute a query first.', 'warning');
        return;
    }
    
    console.log('Initializing page with data:', AppState.queryResults);
    
    // Update statistics
    updateStatistics();
    
    // Display data table
    displayDataTable();
    
    // Initialize chart after a short delay to ensure DOM is ready
    setTimeout(() => {
        try {
            createChart('bar');
            console.log('Chart initialized successfully');
        } catch (error) {
            console.error('Error initializing chart:', error);
            showAlert('Error creating chart visualization', 'error');
        }
    }, 200);
    
    // Wait for DOM to be ready
    setTimeout(() => {
        if (AppState.queryResults.length > 0) {
            displayResultsTable();
        }
        
        // Use backend-generated chart data if available, otherwise create from results
        if (AppState.chartData) {
            createChartFromBackend(AppState.chartData);
        } else if (AppState.queryResults.length > 0) {
            createChart('bar');
        }
        
        if (AppState.queryResults.length > 0) {
            calculateInsights();
        }
    }, 100);


function displayResultsTable() {
    const results = AppState.queryResults;
    
    if (!results || results.length === 0) {
        console.warn('No results to display in table');
        return;
    }
    
    console.log('Displaying results table:', results);
    
    const thead = document.getElementById('visualResultsHead');
    const tbody = document.getElementById('visualResultsBody');
    
    if (!thead || !tbody) {
        console.error('Table elements not found in the DOM');
        return;
    }
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Create and populate header row
    const headerRow = document.createElement('tr');
    Object.keys(results[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create and populate data rows
    results.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value || 'N/A';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    // Show the table container
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
}

function createChart(type) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    if (AppState.currentChart) {
        AppState.currentChart.destroy();
    }
    
    const results = AppState.queryResults;
    if (!results || results.length === 0) {
        return;
    }
    
    // Generate dummy data if no real data exists
    if (AppState.queryResults.length === 0) {
        AppState.queryResults = generateDummyData();
    }
    
    // Update statistics
    updateStatistics();
    
    // Initialize or update chart
    initializeChart();
    
    // Display data table
    displayDataTable();
}

let currentChart = null;

function generateDummyData() {
    const categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
    const data = categories.map(category => ({
        product: category,
        sales: Math.floor(Math.random() * 1000),
        revenue: Math.floor(Math.random() * 10000),
        customers: Math.floor(Math.random() * 100)
    }));
    return data;
}

function updateStatistics() {
    const data = AppState.queryResults;
    if (!data || data.length === 0) return;

    // Calculate statistics
    const totalRecords = data.length;
    const numericValues = data.flatMap(item => 
        Object.values(item).filter(val => typeof val === 'number')
    );
    const avgValue = numericValues.length > 0 
        ? (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)
        : 'N/A';
    const maxValue = numericValues.length > 0 
        ? Math.max(...numericValues).toFixed(2)
        : 'N/A';
    const minValue = numericValues.length > 0 
        ? Math.min(...numericValues).toFixed(2)
        : 'N/A';

    // Update DOM
    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('avgValue').textContent = avgValue;
    document.getElementById('maxValue').textContent = maxValue;
    document.getElementById('minValue').textContent = minValue;
}

function createChart(type = 'bar') {
    console.log('Creating chart of type:', type);
    console.log('Data:', AppState.queryResults);

    const ctx = document.getElementById('mainChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }

    const data = AppState.queryResults;
    if (!data || data.length === 0) {
        console.error('No data available for chart');
        return;
    }

    if (currentChart) {
        currentChart.destroy();
    }

    // Prepare data for chart
    const firstRow = data[0];
    let labels = [];
    let values = [];
    let chartLabel = '';

    // Try to find suitable columns for the chart
    const numericColumn = Object.keys(firstRow).find(key => 
        typeof firstRow[key] === 'number'
    );
    
    const stringColumn = Object.keys(firstRow).find(key => 
        typeof firstRow[key] === 'string'
    );

    if (stringColumn && numericColumn) {
        labels = data.map(item => String(item[stringColumn] || ''));
        values = data.map(item => Number(item[numericColumn] || 0));
        chartLabel = numericColumn;
    } else {
        // Fallback: use first column as labels and second as values
        const columns = Object.keys(firstRow);
        labels = data.map(item => String(item[columns[0]] || ''));
        values = data.map(item => {
            const val = item[columns[1]];
            return typeof val === 'number' ? val : 0;
        });
        chartLabel = columns[1];
    }

    console.log('Chart data prepared:', { labels, values });

    // Create chart configuration
    const chartData = {
        labels: labels,
        datasets: [{
            label: chartLabel,
            data: values,
            backgroundColor: type === 'line' 
                ? 'rgba(217, 119, 6, 0.2)'
                : type === 'pie' || type === 'doughnut'
                    ? generateColors(values.length)
                    : 'rgba(217, 119, 6, 0.8)',
            borderColor: type === 'line'
                ? 'rgba(217, 119, 6, 1)'
                : type === 'pie' || type === 'doughnut'
                    ? generateColors(values.length, true)
                    : 'rgba(217, 119, 6, 1)',
            borderWidth: type === 'line' ? 2 : 1,
            fill: type === 'line',
            tension: type === 'line' ? 0.4 : undefined,
            pointRadius: type === 'line' ? 4 : undefined,
            pointHoverRadius: type === 'line' ? 6 : undefined,
            pointBackgroundColor: type === 'line' ? 'rgba(217, 119, 6, 1)' : undefined,
            pointBorderColor: type === 'line' ? '#fff' : undefined,
            pointBorderWidth: type === 'line' ? 2 : undefined
        }]
    };

    console.log('Creating chart with data:', chartData);

    try {
        currentChart = new Chart(ctx, {
            type: type,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e0e0e0',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: type !== 'pie' && type !== 'doughnut' ? {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#e0e0e0',
                            font: {
                                size: 12
                            },
                            padding: 10
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#e0e0e0',
                            font: {
                                size: 12
                            },
                            padding: 10
                        }
                    }
                } : {}
            }
        });
        console.log('Chart created successfully');
    } catch (error) {
        console.error('Error creating chart:', error);
        showAlert('Error creating chart visualization', 'error');
    }
}

function selectChartType(type, button) {
    // Update active button state
    document.querySelectorAll('.chart-type-btn').forEach(btn => 
        btn.classList.remove('active')
    );
    button.classList.add('active');

    // Reinitialize chart with new type
    createChart(type);
}

// Helper function to generate colors for charts
function generateColors(count) {
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
    ];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
}

function initializeChart(type = 'bar') {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const data = AppState.queryResults;

    if (currentChart) {
        currentChart.destroy();
    }

    let chartData;
    if (type === 'pie' || type === 'doughnut') {
        // For pie/doughnut charts, use single numeric value
        const firstNumericKey = Object.keys(data[0]).find(key => 
            typeof data[0][key] === 'number'
        );
        
        chartData = {
            labels: data.map(item => item.product || item.name || item.id),
            datasets: [{
                data: data.map(item => item[firstNumericKey]),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        };
    } else {
        // For bar/line charts, use all numeric values
        const numericKeys = Object.keys(data[0]).filter(key => 
            typeof data[0][key] === 'number'
        );

        chartData = {
            labels: data.map(item => item.product || item.name || item.id),
            datasets: numericKeys.map((key, index) => ({
                label: key,
                data: data.map(item => item[key]),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ][index % 5],
                borderColor: type === 'line' ? [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ][index % 5] : undefined,
                fill: type === 'line' ? false : undefined
            }))
        };
    }

    currentChart = new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Data Visualization'
                }
            }
        }
    });
}

function displayDataTable() {
    const data = AppState.queryResults;
    if (!data || data.length === 0) return;

    const thead = document.getElementById('visualResultsHead');
    const tbody = document.getElementById('visualResultsBody');

    // Create header
    const headers = Object.keys(data[0]);
    thead.innerHTML = `
        <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
        </tr>
    `;

    // Create body
    tbody.innerHTML = data.map(row => `
        <tr>
            ${headers.map(header => `<td>${row[header]}</td>`).join('')}
        </tr>
    `).join('');
}

function downloadChart() {
    if (!currentChart) return;
    
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = currentChart.canvas.toDataURL('image/png');
    link.click();
        return;
    }
    
    // Extract labels and data intelligently
    const { labels, data } = extractChartData(results);
    
    console.log('Chart data:', { labels, data, type });
    
    const backgroundColor = type === 'pie' || type === 'doughnut' 
        ? generateColors(data.length)
        : 'rgba(217, 119, 6, 0.8)'; // Orange accent color
    
    const borderColor = type === 'pie' || type === 'doughnut'
        ? generateColors(data.length, true)
        : 'rgba(217, 119, 6, 1)';
    
    AppState.currentChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: 'Value',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: type !== 'pie' && type !== 'doughnut' ? {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { 
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            } : {}
        }
    });
    
    console.log('Chart created successfully');
}

function extractChartData(results) {
    // Get all keys from first result
    const keys = Object.keys(results[0]);
    
    // Find label column (usually first string column or _id)
    let labelKey = keys.find(k => 
        k.toLowerCase().includes('name') || 
        k.toLowerCase().includes('product') || 
        k.toLowerCase().includes('category') ||
        k.toLowerCase().includes('customer') ||
        k === '_id'
    ) || keys[0];
    
    // Find data column (usually numeric column)
    let dataKey = keys.find(k => 
        k.toLowerCase().includes('amount') || 
        k.toLowerCase().includes('value') || 
        k.toLowerCase().includes('count') ||
        k.toLowerCase().includes('total') ||
        k.toLowerCase().includes('price') ||
        k.toLowerCase().includes('quantity')
    );
    
    // If no numeric column found, use second column or count
    if (!dataKey) {
        dataKey = keys.length > 1 ? keys[1] : 'count';
    }
    
    const labels = [];
    const data = [];
    
    results.forEach((result, index) => {
        // Extract label
        let label = result[labelKey];
        if (typeof label === 'object') {
            label = JSON.stringify(label);
        }
        labels.push(label || `Item ${index + 1}`);
        
        // Extract data value
        let value = result[dataKey];
        
        // Convert to number if possible
        if (typeof value === 'string') {
            value = parseFloat(value) || 0;
        } else if (typeof value === 'object') {
            value = 1; // Count as 1 if object
        } else if (typeof value !== 'number') {
            value = 1; // Default to 1 for counting
        }
        
        data.push(value);
    });
    
    console.log('Extracted chart data:', { labelKey, dataKey, labels, data });
    
    return { labels, data };
}

function generateColors(count, border = false) {
    const colors = [];
    const alpha = border ? 1 : 0.8;
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsla(${hue}, 60%, 50%, ${alpha})`);
    }
    return colors;
}

// Test function to load sample data for chart testing
function loadSampleChartData() {
    AppState.queryResults = [
        { product: 'Laptop', amount: 1200, date: '2024-01-15' },
        { product: 'Mouse', amount: 25, date: '2024-01-16' },
        { product: 'Keyboard', amount: 75, date: '2024-01-17' },
        { product: 'Monitor', amount: 350, date: '2024-01-18' },
        { product: 'Headphones', amount: 150, date: '2024-01-19' }
    ];
    
    navigateTo('results');
}

function selectChartType(type, btn) {
    document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    createChart(type);
}

function updateChartType() {
    const type = document.getElementById('chartType')?.value || 'bar';
    createChart(type);
}

function calculateInsights() {
    const results = AppState.queryResults;
    
    if (!results || results.length === 0) return;
    
    // Find numeric columns
    const keys = Object.keys(results[0]);
    const numericKey = keys.find(k => 
        typeof results[0][k] === 'number' ||
        k.toLowerCase().includes('amount') || 
        k.toLowerCase().includes('value') || 
        k.toLowerCase().includes('count') ||
        k.toLowerCase().includes('total') ||
        k.toLowerCase().includes('price')
    );
    
    // Extract numeric values
    const amounts = results.map(r => {
        const val = numericKey ? r[numericKey] : Object.values(r).find(v => typeof v === 'number');
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val) || 0;
        return 0;
    }).filter(v => !isNaN(v) && v !== null);
    
    if (amounts.length === 0) {
        // No numeric data found, show counts
        document.getElementById('maxValue').textContent = '-';
        document.getElementById('minValue').textContent = '-';
        document.getElementById('avgValue').textContent = '-';
        document.getElementById('totalRecords').textContent = results.length;
        return;
    }
    
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const avg = (amounts.reduce((a, b) => a + b, 0) / amounts.length).toFixed(2);
    
    // Format with currency if it looks like money
    const isCurrency = numericKey && (
        numericKey.toLowerCase().includes('amount') ||
        numericKey.toLowerCase().includes('price') ||
        numericKey.toLowerCase().includes('total')
    );
    
    const formatter = isCurrency ? (v => `$${v.toLocaleString()}`) : (v => v.toLocaleString());
    
    document.getElementById('maxValue').textContent = formatter(max);
    document.getElementById('minValue').textContent = formatter(min);
    document.getElementById('avgValue').textContent = formatter(parseFloat(avg));
    document.getElementById('totalRecords').textContent = results.length;
}

function createChartFromBackend(chartConfig) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    if (AppState.currentChart) {
        AppState.currentChart.destroy();
    }
    
    console.log('Creating chart from backend config:', chartConfig);
    
    if (!chartConfig || !chartConfig.datasets || !chartConfig.labels) {
        console.error('Invalid chart configuration:', chartConfig);
        return;
    }
    
    // Prepare datasets with colors
    const datasets = chartConfig.datasets.map((dataset, index) => {
        const isPieChart = chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut';
        
        return {
            label: dataset.label || 'Dataset ' + (index + 1),
            data: dataset.data,
            backgroundColor: isPieChart 
                ? generateColors(dataset.data.length)
                : 'rgba(217, 119, 6, 0.8)',
            borderColor: isPieChart
                ? generateColors(dataset.data.length, true)
                : 'rgba(217, 119, 6, 1)',
            borderWidth: 2
        };
    });
    
    AppState.currentChart = new Chart(ctx, {
        type: chartConfig.chartType,
        data: {
            labels: chartConfig.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e0e0e0',
                        font: { size: 12 }
                    }
                },
                title: {
                    display: true,
                    text: chartConfig.title || 'Query Results',
                    color: '#f59e0b',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: chartConfig.chartType !== 'pie' && chartConfig.chartType !== 'doughnut' ? {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#a0a0a0', font: { size: 11 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#a0a0a0', font: { size: 11 }, maxRotation: 45, minRotation: 0 },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            } : {}
        }
    });
    
    console.log('✓ Chart created from backend data');
    showAlert('Chart generated from query results', 'success');
}

function downloadChart() {
    if (!AppState.currentChart) {
        showAlert('No chart available to download', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'chart-' + Date.now() + '.png';
    link.href = AppState.currentChart.toBase64Image();
    link.click();
    
    showAlert('Chart downloaded successfully', 'success');
}