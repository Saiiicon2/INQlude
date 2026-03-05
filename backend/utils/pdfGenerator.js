const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (invoice, company, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filePath = path.join(__dirname, '../uploads', filename);

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).font('Helvetica-Bold').text(company.tradingName, 50, 50);
      doc.fontSize(10).font('Helvetica');
      doc.text(company.legalName, 50, 75);
      doc.text(`Reg No: ${company.regNo}`, 50, 90);
      doc.text(company.address, 50, 105);
      doc.text(`Tel: ${company.tel}`, 50, 120);
      if (company.vatNo) {
        doc.text(`VAT No: ${company.vatNo}`, 50, 135);
      }

      // Invoice type and number on right side
      const docType = invoice.type.toUpperCase();
  const rightHeaderY = 50;
  doc.fontSize(14).font('Helvetica-Bold').text(docType, 400, rightHeaderY);
  doc.fontSize(11).text(`Number: ${invoice.number}`, 400, rightHeaderY + 25);
      const invoiceDate = invoice.date || invoice.createdAt || new Date();
      doc.fontSize(11).text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`, 400, rightHeaderY + 40);

      // Client details
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 190);
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.client.name, 50, 210);
      doc.text(invoice.client.address, 50, 225);
      doc.text(`Tel: ${invoice.client.tel}`, 50, 240);
      if (invoice.client.email) {
        doc.text(`Email: ${invoice.client.email}`, 50, 255);
      }

      // Line items table
      const tableTop = 310;
      doc.fontSize(11).font('Helvetica-Bold');

      // Table headers
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 300, tableTop);
      doc.text('Price', 360, tableTop);
      doc.text('Total', 450, tableTop);

      // Horizontal line
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      // Line items
      doc.fontSize(10).font('Helvetica');
      let yPosition = tableTop + 30;

      invoice.items.forEach((item) => {
        const itemTotal = (item.quantity * item.price).toFixed(2);
        doc.text(item.product.description, 50, yPosition);
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`R ${item.price.toFixed(2)}`, 360, yPosition);
        doc.text(`R ${itemTotal}`, 450, yPosition);
        yPosition += 20;
      });

      // Totals section
      const totalsY = yPosition + 20;
      doc.moveTo(50, totalsY).lineTo(550, totalsY).stroke();

      doc.fontSize(11).font('Helvetica-Bold');
      const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      doc.text('Subtotal:', 380, totalsY + 20);
      doc.text(`R ${subtotal.toFixed(2)}`, 480, totalsY + 20);

      if (invoice.discount > 0) {
        doc.text('Discount:', 380, totalsY + 40);
        doc.text(`-R ${invoice.discount.toFixed(2)}`, 480, totalsY + 40);
      }

      if (invoice.vat > 0) {
        doc.text('VAT:', 380, totalsY + 60);
        doc.text(`R ${invoice.vat.toFixed(2)}`, 480, totalsY + 60);
      }

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total Due:', 380, totalsY + 90);
      doc.text(`R ${invoice.total.toFixed(2)}`, 480, totalsY + 90);

      // Banking details
      if (company.bankingDetails) {
        doc.fontSize(9).font('Helvetica-Bold').text('Banking Details:', 50, totalsY + 140);
        doc.fontSize(9).font('Helvetica').text(company.bankingDetails, 50, totalsY + 160, { width: 400 });
      }

      // Disclaimer
      if (company.disclaimer) {
        if (invoice.type === 'quote') {
          doc.fontSize(8).font('Helvetica-Bold').text('Valid for 7 days', 50, 680);
        }
        doc.fontSize(8).font('Helvetica').text(company.disclaimer, 50, 690, { width: 500 });
      }

      // Signature line
      if (invoice.signature) {
        doc.fontSize(9).font('Helvetica-Bold').text('Authorized Signature:', 50, 700);
        // Draw signature image (base64)
        try {
          const buffer = Buffer.from(invoice.signature.split(',')[1], 'base64');
          doc.image(buffer, 50, 715, { width: 150, height: 50 });
        } catch (err) {
          doc.text('(Signature image unavailable)', 50, 715);
        }
      }

      // Footer
      doc.fontSize(7).text('Thank you for your business!', 50, 760, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };