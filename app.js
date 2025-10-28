// DOM elements
const fileInput = document.getElementById('fileInput');
const dataPreview = document.getElementById('dataPreview');
const chartTypeSelect = document.getElementById('chartType');
const generateChartBtn = document.getElementById('generateChart');
const chartCanvas = document.getElementById('myChart');

// Add after existing variables
const colorSchemes = {
  default: ['#4e54c8', '#8f94fb', '#fca311', '#00b4d8', '#ef476f', '#06d6a0'],
  blues: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#eff6ff'],
  greens: ['#166534', '#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
  warm: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed'],
  cool: ['#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#c026d3', '#e879f9'],
  custom: []
};

let parsedData = []; // Holds data from Excel
let selectedColumns = { labels: 0, values: 1 };
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
  let html = '<div class="column-selector"><h3>Select Data Columns:</h3>';
  html += '<label>Labels Column: <select id="labelColumn">';
  data[0].forEach((header, index) => {
    html += `<option value="${index}" ${index === 0 ? 'selected' : ''}>${header}</option>`;
  });
  html += '</select></label>';
  
  html += '<label>Values Column: <select id="valueColumn">';
  data[0].forEach((header, index) => {
    html += `<option value="${index}" ${index === 1 ? 'selected' : ''}>${header}</option>`;
  });
  html += '</select></label></div>';

  html += '<table><thead><tr>';
  data[0].forEach((header) => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Show only first 10 rows for performance
  const maxRows = Math.min(data.length, 11);
  for (let i = 1; i < maxRows; i++) {
    html += '<tr>';
    data[i].forEach((cell) => {
      html += `<td>${cell || ''}</td>`;
    });
    html += '</tr>';
  }

  if (data.length > 11) {
    html += `<tr><td colspan="${data[0].length}">... and ${data.length - 11} more rows</td></tr>`;
  }

  html += '</tbody></table>';
  dataPreview.innerHTML = html;

  // Add event listeners for column selection
  document.getElementById('labelColumn').addEventListener('change', (e) => {
    selectedColumns.labels = parseInt(e.target.value);
  });
  document.getElementById('valueColumn').addEventListener('change', (e) => {
    selectedColumns.values = parseInt(e.target.value);
  });
}

// Enhanced generateChart function
generateChartBtn.addEventListener('click', () => {
  if (parsedData.length < 2) {
    showMessage("Please upload a valid Excel/CSV file with data.", "error");
    return;
  }

  // Show loading
  generateChartBtn.innerHTML = '<span class="loading"></span> Generating...';
  generateChartBtn.disabled = true;

  setTimeout(() => {
    try {
      const labels = parsedData.slice(1).map(row => row[selectedColumns.labels]);
      const values = parsedData.slice(1).map(row => {
        const val = parseFloat(row[selectedColumns.values]);
        return isNaN(val) ? 0 : val;
      });

      const chartType = chartTypeSelect.value;
      const chartTitle = document.getElementById('chartTitle').value || 'Your Chart';
      const colorScheme = document.getElementById('colorScheme').value;
      
      const colors = getColors(colorScheme, values.length);

      // Destroy previous chart
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(chartCanvas, {
        type: chartType,
        data: {
          labels: labels,
          datasets: [{
            label: parsedData[0][selectedColumns.values],
            data: values,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            tension: chartType === 'line' ? 0.4 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, 
          plugins: {
            legend: {
              display: !['bar', 'line'].includes(chartType),
              position: 'top'
            },
            title: {
              display: true,
              text: chartTitle,
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: ['bar', 'line', 'scatter'].includes(chartType) ? {
            y: { beginAtZero: true },
            x: { display: true }
          } : {}
        }
      });

      // Show chart actions
      document.getElementById('chartActions').style.display = 'flex';
      showMessage("Chart generated successfully!", "success");

    } catch (error) {
      showMessage("Error generating chart: " + error.message, "error");
    } finally {
      generateChartBtn.innerHTML = '🎨 Generate Chart';
      generateChartBtn.disabled = false;
    }
  }, 500);
});

// Helper functions
function getColors(scheme, count) {
  if (scheme === 'custom') {
    const customColors = Array.from(document.querySelectorAll('#colorInputs input[type="color"]'))
      .map(input => input.value + '80'); // Add transparency
    return customColors.length > 0 ? customColors : colorSchemes.default;
  }
  
  const baseColors = colorSchemes[scheme] || colorSchemes.default;
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length] + '80'); // Add transparency
  }
  return colors;
}

function showMessage(text, type) {
  const existingMsg = document.querySelector('.error-message, .success-message');
  if (existingMsg) existingMsg.remove();

  const message = document.createElement('div');
  message.className = `${type}-message`;
  message.textContent = text;
  
  const chartSection = document.querySelector('.chart-section');
  chartSection.insertBefore(message, chartSection.firstChild);

  setTimeout(() => message.remove(), 5000);
}

// Download functionality
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('downloadChart')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = chartCanvas.toDataURL();
    link.click();
  });

  // Color scheme change handler
  document.getElementById('colorScheme')?.addEventListener('change', (e) => {
    const customPicker = document.getElementById('customColorPicker');
    if (e.target.value === 'custom') {
      customPicker.style.display = 'block';
      initCustomColors();
    } else {
      customPicker.style.display = 'none';
    }
  });
});

function initCustomColors() {
  const container = document.getElementById('colorInputs');
  container.innerHTML = '';
  
  for (let i = 0; i < 3; i++) {
    addColorInput();
  }
}

function addColorInput() {
  const container = document.getElementById('colorInputs');
  const div = document.createElement('div');
  div.className = 'color-input-group';
  
  const input = document.createElement('input');
  input.type = 'color';
  input.value = colorSchemes.default[container.children.length % colorSchemes.default.length];
  
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.type = 'button';
  removeBtn.onclick = () => div.remove();
  
  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);
}

document.getElementById('addColor')?.addEventListener('click', addColorInput);
