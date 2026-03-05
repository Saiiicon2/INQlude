const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Always load backend/.env even if the server is started from a different CWD.
dotenv.config({ path: path.join(__dirname, '.env') });

const { router: authRouter, requireAuth } = require('./routes/auth');
const invoicesRouter = require('./routes/invoices');
const settingsRouter = require('./routes/settings');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Auth routes (public)
app.use('/api/auth', authRouter);

// Settings routes (protected)
app.use('/api/settings', requireAuth, settingsRouter);

// Invoices routes (protected)
app.use('/api/invoices', requireAuth, invoicesRouter);

// Basic route
app.get('/', (req, res) => {
  res.send('INQlude Backend');
});

// Products
app.get('/api/products', async (req, res) => {
  const kind = req.query.kind ? String(req.query.kind) : null;
  if (kind && kind !== 'product' && kind !== 'service') {
    return res.status(400).json({ error: 'Invalid kind. Use product or service.' });
  }

  const products = await prisma.product.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { id: 'desc' }
  });
  res.json(products);
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { code, description, price, barcode, kind } = req.body;

    if (!code || !description || price === undefined || price === null) {
      return res.status(400).json({ error: 'code, description, and price are required' });
    }

    const parsedPrice = typeof price === 'number' ? price : Number.parseFloat(String(price));
    if (!Number.isFinite(parsedPrice)) {
      return res.status(400).json({ error: 'price must be a valid number' });
    }

    const normalizedBarcode = barcode ? String(barcode) : null;
    const normalizedKind = kind ? String(kind) : 'product';
    if (normalizedKind !== 'product' && normalizedKind !== 'service') {
      return res.status(400).json({ error: 'Invalid kind. Use product or service.' });
    }

    const product = await prisma.product.create({
      data: {
        code: String(code),
        description: String(description),
        price: parsedPrice,
        barcode: normalizedBarcode,
        kind: normalizedKind
      }
    });

    res.json(product);
  } catch (error) {
    // Prisma known error codes are safe to branch on
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Product code or barcode already exists' });
    }
    console.error('Create product failed:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const { code, description, price, barcode, kind } = req.body;

    const data = {};
    if (code !== undefined) data.code = String(code);
    if (description !== undefined) data.description = String(description);
    if (price !== undefined) {
      const parsedPrice = typeof price === 'number' ? price : Number.parseFloat(String(price));
      if (!Number.isFinite(parsedPrice)) {
        return res.status(400).json({ error: 'price must be a valid number' });
      }
      data.price = parsedPrice;
    }
    if (barcode !== undefined) data.barcode = barcode ? String(barcode) : null;
    if (kind !== undefined) {
      const normalizedKind = kind ? String(kind) : 'product';
      if (normalizedKind !== 'product' && normalizedKind !== 'service') {
        return res.status(400).json({ error: 'Invalid kind. Use product or service.' });
      }
      data.kind = normalizedKind;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const product = await prisma.product.update({
      where: { id },
      data
    });

    res.json(product);
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Product code or barcode already exists' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error('Update product failed:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    // FK constraint (e.g., product used on invoice items)
    if (error?.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete product because it is used on an invoice/quote' });
    }
    console.error('Delete product failed:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Clients
app.get('/api/clients', async (req, res) => {
  const clients = await prisma.client.findMany();
  res.json(clients);
});

app.post('/api/clients', requireAuth, async (req, res) => {
  try {
    const { name, address, tel, email } = req.body;

    if (!name || !address || !tel) {
      return res.status(400).json({ error: 'name, address, and tel are required' });
    }

    const client = await prisma.client.create({
      data: {
        name: String(name),
        address: String(address),
        tel: String(tel),
        email: email ? String(email) : null
      }
    });
    res.json(client);
  } catch (error) {
    console.error('Create client failed:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.patch('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    const { name, address, tel, email } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name);
    if (address !== undefined) data.address = String(address);
    if (tel !== undefined) data.tel = String(tel);
    if (email !== undefined) data.email = email ? String(email) : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const client = await prisma.client.update({
      where: { id },
      data
    });
    res.json(client);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.error('Update client failed:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }

    await prisma.client.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Client not found' });
    }
    if (error?.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete client because it is used on an invoice/quote' });
    }
    console.error('Delete client failed:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});