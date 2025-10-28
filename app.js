// DOM elements
const fileInput = document.getElementById('fileInput');
const dataPreview = document.getElementById('dataPreview');
const chartTypeSelect = document.getElementById('chartType');
const generateChartBtn = document.getElementById('generateChart');
const chartCanvas = document.getElementById('myChart');

let parsedData = []; // Holds data from Excel
let chartInstance = null; // Chart.js instance

// Read Excel file
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length > 0) {
      parsedData = jsonData;
      displayPreviewTable(jsonData);
    }
  };

  reader.readAsArrayBuffer(file);
});

// Display table preview
function displayPreviewTable(data) {
  let html = '<table><thead><tr>';
  data[0].forEach((header) => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = 1; i < data.length; i++) {
    html += '<tr>';
    data[i].forEach((cell) => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  dataPreview.innerHTML = html;
}

// Generate chart
generateChartBtn.addEventListener('click', () => {
  if (parsedData.length < 2) {
    alert("Please upload a valid Excel/CSV file with data.");
    return;
  }

  const labels = parsedData.slice(1).map(row => row[0]); // First column
  const values = parsedData.slice(1).map(row => row[1]); // Second column

  const chartType = chartTypeSelect.value;

  // Destroy previous chart if exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCanvas, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: parsedData[0][1], // Use second column's header
        data: values,
        backgroundColor: [
          '#4e54c8', '#8f94fb', '#fca311', '#00b4d8', '#ef476f', '#06d6a0'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: chartType !== 'bar' ? true : false
        },
        title: {
          display: true,
          text: 'Your Chart'
        }
      },
      scales: chartType === 'bar' || chartType === 'line' ? {
        y: {
          beginAtZero: true
        }
      } : {}
    }
  });
});
