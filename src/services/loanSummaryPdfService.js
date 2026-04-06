const PDFDocument = require('pdfkit');
const { calculateLoanMetrics } = require('./calculatorService');

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCurrency(value) {
  const numeric = toNumber(value, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(numeric);
}

function formatPercent(value) {
  const numeric = toNumber(value, 0);
  return `${numeric.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString('en-US');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US');
}

function getAddress(data) {
  return (
    data.finance_property_full_address
    || data.purchase_property_full_address
    || data.lead_property_full_address
    || data.full_address
    || data.property_address
    || 'N/A'
  );
}

function getBorrowerName(data) {
  const borrowerDetails = data.borrower_details || {};
  const firstName = borrowerDetails.first_name || data.first_name || '';
  const lastName = borrowerDetails.last_name || data.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Borrower';
}

function getEntityName(data) {
  const borrowerDetails = data.borrower_details || {};
  return borrowerDetails.entity_name || data.entity_name || 'Entity';
}

function buildMetrics(data) {
  const savedMetrics = data.calculator_results || {};
  const selectedProduct = data.selected_loan_product || {};

  const calculated = calculateLoanMetrics({
    purchase_price: toNumber(data.purchase_price, 60000),
    purchase_loan: toNumber(data.purchase_loan, 0) || undefined,
    rehab_budget: toNumber(data.rehab_budget, 60000),
    purchase_advance_percent: toNumber(data.purchase_advance_percent, 75),
    rehab_advance_percent: toNumber(data.rehab_advance_percent, 100),
    current_value: toNumber(data.current_value, toNumber(data.purchase_price, 60000)),
    comp_value: toNumber(data.comp_value, 250000),
    rehab_factor: toNumber(data.rehab_factor, 0.6)
  });

  return {
    ...calculated,
    ...savedMetrics,
    total_loan: toNumber(savedMetrics.total_loan, toNumber(calculated.total_loan, 0)),
    purchase_loan: toNumber(savedMetrics.purchase_loan, toNumber(calculated.purchase_loan, 0)),
    rehab_loan: toNumber(savedMetrics.rehab_loan, toNumber(calculated.rehab_loan, 0)),
    arv: toNumber(savedMetrics.arv, toNumber(calculated.arv, 0)),
    ltc: toNumber(savedMetrics.ltc, toNumber(calculated.ltc, 0)),
    ltarv: toNumber(savedMetrics.ltarv, toNumber(calculated.ltarv, 0)),
    selected_product: selectedProduct
  };
}

function drawBrandHeader(doc, width, yStart) {
  const blue = '#2f54eb';
  const dark = '#0f2a85';

  doc
    .save()
    .roundedRect(width - 210, yStart + 4, 16, 26, 4)
    .fill(blue)
    .restore();
  doc
    .save()
    .circle(width - 202, yStart + 20, 3.2)
    .fill(blue)
    .restore();
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(blue)
    .text('brickline', width - 185, yStart, { width: 170, align: 'left' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#94a3b8')
    .text('LOAN DETAILS', 50, yStart + 6, { characterSpacing: 2.2 });

  doc
    .strokeColor('#dbe3f3')
    .lineWidth(1)
    .moveTo(50, yStart + 44)
    .lineTo(width - 50, yStart + 44)
    .stroke();
}

function writePairRow(doc, label, value, xLeft, xRight, y, options = {}) {
  const labelSize = options.labelSize || 10;
  const valueSize = options.valueSize || 10;
  const muted = options.muted || false;
  const boldValue = options.boldValue || false;

  doc
    .font('Helvetica')
    .fontSize(labelSize)
    .fillColor(muted ? '#64748b' : '#334155')
    .text(label, xLeft, y, { width: 250, align: 'left' });

  doc
    .font(boldValue ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(valueSize)
    .fillColor('#1e293b')
    .text(value, xRight, y, { width: 180, align: 'right' });
}

function sectionDivider(doc, y, width) {
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(width - 50, y)
    .stroke();
}

async function generateLoanSummaryPdf(application) {
  const data = application?.application_data || {};
  const metrics = buildMetrics(data);
  const selectedProduct = metrics.selected_product || {};

  const purchasePrice = toNumber(data.purchase_price, 60000);
  const downPayment = Math.max(purchasePrice - metrics.purchase_loan, 0);
  const originationFee = metrics.purchase_loan * 0.02;
  const serviceFee = 1295;
  const proRatedInterest = toNumber(selectedProduct.monthly_payment, 0) * 0.12;
  const cashToClose = downPayment + originationFee + serviceFee + proRatedInterest;
  const downPaymentPct = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 0;
  const hasRehabAmount = toNumber(metrics.rehab_loan, 0) > 0;

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageWidth = doc.page.width;
  let y = 48;
  drawBrandHeader(doc, pageWidth, y);
  y += 62;

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#475569')
    .text(formatDate(new Date()), 50, y);
  y += 34;

  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor('#0f172a')
    .text(getBorrowerName(data), 50, y);
  y += 38;

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#334155')
    .text(getAddress(data), 50, y, { width: pageWidth - 100 });
  y += 28;

  sectionDivider(doc, y, pageWidth);
  y += 20;

  writePairRow(doc, 'Entity Name', getEntityName(data), 62, pageWidth - 230, y, { muted: true });
  y += 24;

  writePairRow(doc, 'Total Loan Amount', formatCurrency(metrics.total_loan), 62, pageWidth - 230, y, { boldValue: true, valueSize: 12, labelSize: 12 });
  y += 26;
  writePairRow(doc, 'Loan Amount', formatCurrency(metrics.purchase_loan), 82, pageWidth - 230, y, { muted: true });
  y += 22;
  writePairRow(doc, 'Purchase Loan Amount', formatCurrency(metrics.purchase_loan), 82, pageWidth - 230, y, { muted: true });
  y += 22;
  if (hasRehabAmount) {
    writePairRow(doc, 'Rehab Amount', formatCurrency(metrics.rehab_loan), 82, pageWidth - 230, y, { muted: true });
    y += 22;
  }
  y += 2;

  writePairRow(doc, 'Monthly Payment', formatCurrency(selectedProduct.monthly_payment || 0), 62, pageWidth - 230, y, { boldValue: true, valueSize: 12, labelSize: 12 });
  y += 24;
  writePairRow(doc, 'Interest Rate', formatPercent(selectedProduct.rate || 0), 62, pageWidth - 230, y, { boldValue: true, valueSize: 12, labelSize: 12 });
  y += 22;

  sectionDivider(doc, y, pageWidth);
  y += 20;

  writePairRow(doc, 'Cash Required at Closing', `${formatCurrency(cashToClose)} (${formatPercent((cashToClose / Math.max(purchasePrice, 1)) * 100)})`, 62, pageWidth - 230, y, { boldValue: true, valueSize: 12, labelSize: 12 });
  y += 24;
  writePairRow(doc, 'Down Payment', `${formatCurrency(downPayment)} (${formatPercent(downPaymentPct)})`, 82, pageWidth - 230, y, { muted: true });
  y += 21;
  writePairRow(doc, 'Origination Fee', `${formatCurrency(originationFee)} (${formatPercent(2)})`, 82, pageWidth - 230, y, { muted: true });
  y += 21;
  writePairRow(doc, 'Service Fee', formatCurrency(serviceFee), 82, pageWidth - 230, y, { muted: true });
  y += 21;
  writePairRow(doc, 'Pro-rated Interest', formatCurrency(proRatedInterest), 82, pageWidth - 230, y, { muted: true });
  y += 22;

  sectionDivider(doc, y, pageWidth);
  y += 20;

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Additional Details', 62, y);
  y += 22;

  const detailRows = [
    ['Loan Term', `${selectedProduct.term || 12} months`],
    ['Loan Type', 'Bridge / Hard Money'],
    ['Interest-Only Period', `${selectedProduct.term || 12} months`],
    ['Preferred Signing Date', formatDate(data.preferred_signing_date)],
    ['Purpose', data.loan_program || 'Investment'],
    ['Property Type', data.property_type || data.calculator_inputs?.property_type || data.loan_program || 'N/A'],
    ['Occupancy', data.eligibility_confirmations?.non_owner_occupied ? 'Non-Owner Occupied' : 'Owner Occupied'],
    ['Purchase Price', formatCurrency(purchasePrice)],
    ['As-is Value', formatCurrency(toNumber(data.current_value, purchasePrice))],
    ['Estimated ARV', formatCurrency(metrics.arv)],
    ['Loan-to-Cost', formatPercent(metrics.ltc)],
    ['After-repair LTV', formatPercent(metrics.ltarv)]
  ];

  for (const [label, value] of detailRows) {
    if (y > doc.page.height - 64) {
      doc.addPage();
      y = 56;
      drawBrandHeader(doc, pageWidth, 18);
      y = 84;
    }
    writePairRow(doc, label, value, 62, pageWidth - 230, y, { muted: true });
    y += 20;
  }

  doc.end();
  return completed;
}

module.exports = {
  generateLoanSummaryPdf
};
