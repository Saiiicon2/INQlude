const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Get all invoices and quotes
router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const quotes = await prisma.quote.findMany({
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ invoices, quotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice/quote
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const type = req.query.type || 'invoice'; // invoice or quote

    const doc = await (type === 'quote' ? prisma.quote : prisma.invoice).findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { clientId, items, discount, discountType, type, signature } = req.body;

    // Get settings for auto-numbering
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          vatEnabled: true,
          vatPercent: 15.0,
          invoicePrefix: 'INV',
          quotePrefix: 'QU',
          currentInvoiceNumber: 336,
          currentQuoteNumber: 0
        }
      });
    }

    // Calculate totals
    let subtotal = items.reduce((sum, item) => {
      const quantity = Number.parseInt(String(item.quantity), 10);
      const price = typeof item.price === 'number' ? item.price : Number.parseFloat(String(item.price));
      return sum + (Number.isFinite(quantity) && Number.isFinite(price) ? quantity * price : 0);
    }, 0);
    const parsedDiscount = typeof discount === 'number' ? discount : Number.parseFloat(String(discount || 0));
    let discountAmount = discountType === 'percentage' ? (subtotal * parsedDiscount) / 100 : parsedDiscount;
    let vatAmount = subtotal - discountAmount; // Apply VAT to discounted amount

    if (settings.vatEnabled) {
      vatAmount = (subtotal - discountAmount) * (settings.vatPercent / 100);
    } else {
      vatAmount = 0;
    }

    const total = subtotal - discountAmount + vatAmount;

    // Auto-generate number
    let number;
    if (type === 'quote') {
      number = `${settings.quotePrefix}${settings.currentQuoteNumber + 1}`;
      await prisma.settings.update({
        where: { id: settings.id },
        data: { currentQuoteNumber: settings.currentQuoteNumber + 1 }
      });
    } else {
      number = `${settings.invoicePrefix}${settings.currentInvoiceNumber + 1}`;
      await prisma.settings.update({
        where: { id: settings.id },
        data: { currentInvoiceNumber: settings.currentInvoiceNumber + 1 }
      });
    }

    // Create document
    if (type === 'quote') {
      const quote = await prisma.quote.create({
        data: {
          number,
          clientId: parseInt(clientId),
          discount: discountAmount,
          vat: vatAmount,
          total,
          signature: signature || null,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: Number.parseInt(String(item.quantity), 10),
              price: typeof item.price === 'number' ? item.price : Number.parseFloat(String(item.price))
            }))
          }
        },
        include: {
          client: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
      return res.json(quote);
    } else {
      const invoice = await prisma.invoice.create({
        data: {
          number,
          clientId: parseInt(clientId),
          discount: discountAmount,
          vat: vatAmount,
          total,
          signature: signature || null,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: Number.parseInt(String(item.quantity), 10),
              price: typeof item.price === 'number' ? item.price : Number.parseFloat(String(item.price))
            }))
          }
        },
        include: {
          client: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
      return res.json(invoice);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const type = req.query.type || 'invoice';

    const doc = await (type === 'quote' ? prisma.quote : prisma.invoice).findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get company settings
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          tradingName: '',
          legalName: '',
          regNo: '',
          address: '',
          tel: ''
        }
      });
    }

    // Generate PDF
    const filename = `${type}_${doc.number}.pdf`;
    const filePath = await generateInvoicePDF(
      { ...doc, type },
      company,
      filename
    );

    // Send file
    res.download(filePath, filename, (err) => {
      if (err) console.error(err);
      // Clean up file after download
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) console.error(err);
        });
      }, 1000);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type } = req.body;

    const doc = await (type === 'quote' ? prisma.quote : prisma.invoice).update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;