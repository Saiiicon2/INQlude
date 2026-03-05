const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    let company = await prisma.company.findFirst();

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

    res.json({ settings, company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update VAT settings
router.patch('/vat', async (req, res) => {
  try {
    const { vatEnabled, vatPercent } = req.body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          vatEnabled,
          vatPercent,
          invoicePrefix: 'INV',
          quotePrefix: 'QU',
          currentInvoiceNumber: 336,
          currentQuoteNumber: 0
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          vatEnabled,
          vatPercent
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update VAT settings' });
  }
});

// Update company profile
router.patch('/company', async (req, res) => {
  try {
    const { tradingName, legalName, regNo, address, tel, vatNo, bankingDetails, disclaimer } = req.body;

    let company = await prisma.company.findFirst();

    if (!company) {
      company = await prisma.company.create({
        data: {
          tradingName,
          legalName,
          regNo,
          address,
          tel,
          vatNo,
          bankingDetails,
          disclaimer
        }
      });
    } else {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          tradingName,
          legalName,
          regNo,
          address,
          tel,
          vatNo,
          bankingDetails,
          disclaimer
        }
      });
    }

    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update company profile' });
  }
});

// Update invoice/quote numbering
router.patch('/numbering', async (req, res) => {
  try {
    const { invoicePrefix, quotePrefix, currentInvoiceNumber, currentQuoteNumber } = req.body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          invoicePrefix,
          quotePrefix,
          currentInvoiceNumber,
          currentQuoteNumber,
          vatEnabled: true,
          vatPercent: 15.0
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          invoicePrefix,
          quotePrefix,
          currentInvoiceNumber,
          currentQuoteNumber
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update numbering' });
  }
});

module.exports = router;