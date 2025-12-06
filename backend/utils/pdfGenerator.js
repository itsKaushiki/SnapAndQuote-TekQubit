const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const generatePDF = async ({ car, parts, totalCost, pricingTable, totalOEMCost, totalAftermarketCost, currency, state, repairAnalysis, nearestServiceCenters, estimatedRepairTime }) => {
  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #2b6cb0; margin-bottom: 10px; }
        .header-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .pricing-table th, .pricing-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: center; }
        .pricing-table th { background-color: #3b82f6; color: white; font-weight: bold; }
        .pricing-table .part-name { text-align: left; font-weight: 500; }
        .oem-price { background-color: #fef3c7; }
        .aftermarket-price { background-color: #d1fae5; }
        .savings { background-color: #e0e7ff; font-weight: bold; }
        .summary { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total-row { background-color: #f3f4f6; font-weight: bold; }
        .logo { text-align: center; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="logo">
        <h1>🔧 AutoFix AI - Damage Assessment Report</h1>
      </div>
      
      <div class="header-info">
        <p><strong>Vehicle:</strong> ${car.year} ${car.name} ${car.model}</p>
        <p><strong>Location:</strong> ${state || 'Default'}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
        <p><strong>Currency:</strong> ${currency || 'INR'}</p>
      </div>

      <h2>💰 Damage Cost Analysis</h2>
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Damaged Component</th>
            <th>OEM Parts (₹)</th>
            <th>Aftermarket Parts (₹)</th>
            <th>You Save (₹)</th>
            <th>Savings %</th>
          </tr>
        </thead>
        <tbody>
          ${pricingTable ? pricingTable.map(item => `
            <tr>
              <td class="part-name">${item.part}</td>
              <td class="oem-price">₹${item.oemPrice.toLocaleString()}</td>
              <td class="aftermarket-price">₹${item.aftermarketPrice.toLocaleString()}</td>
              <td class="savings">₹${item.savings.toLocaleString()}</td>
              <td class="savings">${item.savingsPercent}%</td>
            </tr>
          `).join('') : Object.entries(parts).map(([part, cost]) => `
            <tr>
              <td class="part-name">${part}</td>
              <td colspan="4">₹${cost}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td><strong>Total Cost</strong></td>
            <td><strong>₹${(totalOEMCost || totalCost).toLocaleString()}</strong></td>
            <td><strong>₹${(totalAftermarketCost || totalCost).toLocaleString()}</strong></td>
            <td><strong>₹${((totalOEMCost || totalCost) - (totalAftermarketCost || totalCost)).toLocaleString()}</strong></td>
            <td><strong>${Math.round((((totalOEMCost || totalCost) - (totalAftermarketCost || totalCost)) / (totalOEMCost || totalCost)) * 100)}%</strong></td>
          </tr>
        </tbody>
      </table>

      ${repairAnalysis && repairAnalysis.length > 0 ? `
      <h2>🔧 Repair vs Replace Analysis</h2>
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Severity</th>
            <th>Recommendation</th>
            <th>Estimated Cost (₹)</th>
            <th>Time Required</th>
          </tr>
        </thead>
        <tbody>
          ${repairAnalysis.map(analysis => `
            <tr>
              <td class="part-name">${analysis.part}</td>
              <td class="${analysis.severityLevel === 'minor' ? 'aftermarket-price' : analysis.severityLevel === 'moderate' ? 'savings' : 'oem-price'}">
                ${analysis.severity}% (${analysis.severityLevel})
              </td>
              <td class="savings">
                <strong>${analysis.recommendation.toUpperCase()}</strong><br>
                <small>${analysis.reason}</small>
              </td>
              <td class="part-name">₹${analysis.recommendation === 'repair' ? analysis.repairCost.toLocaleString() : analysis.replaceCost.toLocaleString()}</td>
              <td class="part-name">${analysis.estimatedTime.days} day${analysis.estimatedTime.days > 1 ? 's' : ''} (${analysis.estimatedTime.hours}h)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${nearestServiceCenters && nearestServiceCenters.length > 0 ? `
      <h2>🏪 Recommended Service Centers</h2>
      <div class="summary">
        ${nearestServiceCenters.map((center, index) => `
          <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${index === 0 ? '#3b82f6' : '#6b7280'};">
            <h4 style="margin: 0 0 5px 0; color: #1f2937;">${center.name} ${index === 0 ? '⭐ Recommended' : ''}</h4>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              📍 ${center.address}<br>
              📞 ${center.phone}<br>
              ⭐ Rating: ${center.rating}/5.0 | � Wait Time: ${center.estimated_wait_days} day${center.estimated_wait_days > 1 ? 's' : ''}<br>
              🔧 Speciality: ${center.speciality ? center.speciality.join(', ') : 'General Repair'}<br>
              🕒 Hours: ${center.working_hours}
            </p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="summary">
        <h3>�💡 Summary & Recommendations</h3>
        ${estimatedRepairTime ? `<p><strong>📅 Estimated Completion Time:</strong> ${estimatedRepairTime.totalDays} day${estimatedRepairTime.totalDays > 1 ? 's' : ''}</p>` : ''}
        <p><strong>💰 Cost Comparison:</strong> Aftermarket parts can save you up to ₹${((totalOEMCost || totalCost) - (totalAftermarketCost || totalCost)).toLocaleString()} compared to OEM parts.</p>
        ${repairAnalysis && repairAnalysis.length > 0 ? `
        <p><strong>🔧 Repair Options:</strong> ${repairAnalysis.filter(a => a.recommendation === 'repair').length} part${repairAnalysis.filter(a => a.recommendation === 'repair').length !== 1 ? 's' : ''} can be repaired, ${repairAnalysis.filter(a => a.recommendation === 'replace').length} part${repairAnalysis.filter(a => a.recommendation === 'replace').length !== 1 ? 's' : ''} should be replaced.</p>
        ` : ''}
        <p><strong>🏪 Service Centers:</strong> ${nearestServiceCenters && nearestServiceCenters.length > 0 ? nearestServiceCenters.length + ' recommended service centers found in your area.' : 'Contact local service centers for repair.'}</p>
        <p><strong>📝 Quality Note:</strong> OEM parts offer guaranteed compatibility, while aftermarket parts provide cost-effective alternatives. Repair options depend on damage severity.</p>
        <p><strong>🤖 Generated by:</strong> AutoFix AI - Advanced Vehicle Damage Assessment System</p>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const outputPath = path.join(__dirname, '../reports/report-' + Date.now() + '.pdf');
  await page.pdf({ path: outputPath, format: 'A4' });

  await browser.close();
  return outputPath;
};

/**
 * generateSideBySidePDF
 * Creates a PDF where each page is a side-by-side slide for the provided entries.
 * Each entry should be: { filename, carInfo?, parts?, totalCost?, annotatedFilename? }
 * - filename and annotatedFilename are relative to the backend/uploads directory (filenames only)
 */
const generateSideBySidePDF = async (entries = []) => {
  // entries: array of objects
  const uploadsDir = path.join(__dirname, '../uploads');
  const pagesHtml = entries.map((entry) => {
    const original = entry.filename ? `file://${path.join(uploadsDir, entry.filename).replace(/\\/g, '/')}` : '';
    const annotated = entry.annotatedFilename ? `file://${path.join(uploadsDir, entry.annotatedFilename).replace(/\\/g, '/')}` : '';
    const carLine = entry.carInfo ? `${entry.carInfo.name || ''} ${entry.carInfo.model || ''} ${entry.carInfo.year || ''}` : '';
    const partsHtml = entry.parts
      ? `<ul>${Object.entries(entry.parts).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>`
      : '';
    const costLine = entry.totalCost ? `<h4>Total: ₹${entry.totalCost}</h4>` : '';

    // Layout: left image (original), right content (annotated image on top if present, then text)
    return `
      <div class="slide">
        <div class="left">
          ${original ? `<img src="${original}" class="img"/>` : '<div class="placeholder">No image</div>'}
        </div>
        <div class="right">
          <h2>${carLine}</h2>
          ${annotated ? `<img src="${annotated}" class="annotated"/>` : ''}
          <div class="parts">${partsHtml}</div>
          ${costLine}
        </div>
      </div>
    `;
  }).join('\n<hr class="page-break"/>\n');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; margin: 0; padding: 12px; }
          .slide { display: flex; width: 100%; height: 270mm; box-sizing: border-box; }
          .left, .right { width: 50%; padding: 8px; }
          .img { max-width: 100%; height: auto; border: 1px solid #ccc; }
          .annotated { max-width: 100%; height: auto; margin-top: 8px; border: 1px dashed #999; }
          .parts { margin-top: 12px; }
          .placeholder { width: 100%; height: 100%; background: #f3f3f3; display:flex; align-items:center; justify-content:center; color:#666 }
          hr.page-break { page-break-after: always; border: none; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outputPath = path.join(__dirname, '../reports/side-by-side-' + Date.now() + '.pdf');
  // Use A4 landscape to better fit side-by-side
  await page.pdf({ path: outputPath, format: 'A4', landscape: true, printBackground: true });

  await browser.close();
  return outputPath;
};

module.exports = generatePDF;
module.exports.generateSideBySidePDF = generateSideBySidePDF;
