import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Container, Button, Form, Table, Modal, Alert } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import api from '../api';
import { downloadCsv, toCsv } from '../utils/csv';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', price: '', barcode: '' });
  const [autoBarcode, setAutoBarcode] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const productByCode = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (p?.code) map.set(String(p.code).trim(), p);
    }
    return map;
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    }
  };

  const openCreate = () => {
    setError('');
    setMode('create');
    setEditingId(null);
    setAutoBarcode(false);
    setForm({ code: '', description: '', price: '', barcode: '' });
    setShow(true);
  };

  const openEdit = (product) => {
    setError('');
    setMode('edit');
    setEditingId(product.id);
    setAutoBarcode(false);
    setForm({
      code: product.code || '',
      description: product.description || '',
      price: product.price !== undefined && product.price !== null ? String(product.price) : '',
      barcode: product.barcode || ''
    });
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setIsSaving(false);
    setError('');
    setMode('create');
    setEditingId(null);
    setAutoBarcode(false);
    setForm({ code: '', description: '', price: '', barcode: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsSaving(true);

      const data = { ...form, price: parseFloat(form.price) };
      if (!Number.isFinite(data.price)) {
        setError('Price must be a valid number');
        return;
      }

      if (autoBarcode) {
        data.barcode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit
      }

      if (mode === 'edit') {
        await api.patch(`/api/products/${editingId}`, data);
      } else {
        await api.post('/api/products', data);
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(`Delete product ${product.code} - ${product.description}?`);
    if (!ok) return;

    try {
      setError('');
      await api.delete(`/api/products/${product.id}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    setError('');
    setImportResult('');

    const csvText = toCsv(products, [
      { key: 'code', label: 'Code' },
      { key: 'description', label: 'Description' },
      { key: 'price', label: 'Price' },
      { key: 'barcode', label: 'Barcode' }
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`products_${stamp}.csv`, csvText);
  };

  const openImportPicker = () => {
    setError('');
    setImportResult('');
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const normalizeHeaderKey = (value) => String(value || '').trim().toLowerCase();

  const rowsFromWorksheet = (worksheet) => {
    const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!Array.isArray(raw) || raw.length < 2) return [];

    const headers = raw[0].map(normalizeHeaderKey);
    const idx = (name) => headers.indexOf(name);

    const codeIndex = idx('code');
    const descriptionIndex = idx('description');
    const priceIndex = idx('price');
    const barcodeIndex = idx('barcode');

    if (codeIndex === -1 || descriptionIndex === -1 || priceIndex === -1) {
      throw new Error('Import file must include headers: code, description, price (barcode optional)');
    }

    const rows = [];
    for (let i = 1; i < raw.length; i += 1) {
      const row = raw[i];
      if (!row || row.length === 0) continue;

      const code = String(row[codeIndex] ?? '').trim();
      const description = String(row[descriptionIndex] ?? '').trim();
      const price = Number.parseFloat(String(row[priceIndex] ?? '').trim());
      const barcode = barcodeIndex !== -1 ? String(row[barcodeIndex] ?? '').trim() : '';

      if (!code && !description) continue;
      if (!code || !description || !Number.isFinite(price)) {
        throw new Error(`Invalid row ${i + 1}: code/description/price required`);
      }

      rows.push({ code, description, price, barcode: barcode || null, kind: 'product' });
    }

    return rows;
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again triggers onChange
    e.target.value = '';
    if (!file) return;

    try {
      setError('');
      setImportResult('');
      setIsImporting(true);

      let workbook;
      if (file.name.toLowerCase().endsWith('.csv')) {
        const csvText = await file.text();
        workbook = XLSX.read(csvText, { type: 'string' });
      } else {
        const buf = await file.arrayBuffer();
        workbook = XLSX.read(buf, { type: 'array' });
      }

      const sheetName = workbook.SheetNames?.[0];
      if (!sheetName) throw new Error('No sheets found in file');

      const worksheet = workbook.Sheets[sheetName];
      const importRows = rowsFromWorksheet(worksheet);
      if (importRows.length === 0) {
        setImportResult('No rows found to import.');
        return;
      }

      let created = 0;
      let updated = 0;

      for (const row of importRows) {
        const existing = productByCode.get(row.code);
        if (existing?.id) {
          await api.patch(`/api/products/${existing.id}`, {
            description: row.description,
            price: row.price,
            barcode: row.barcode,
            kind: 'product'
          });
          updated += 1;
        } else {
          await api.post('/api/products', row);
          created += 1;
        }
      }

      await fetchProducts();
      setImportResult(`Import complete: ${created} created, ${updated} updated.`);
    } catch (err) {
      setError(err?.message || err.response?.data?.error || 'Import failed');
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Container fluid className="mt-4">
      <h1>Products</h1>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {importResult && <Alert variant="success" className="mt-3">{importResult}</Alert>}

      <Button onClick={openCreate}>Add Product</Button>
      <Button variant="secondary" className="ms-2" onClick={openImportPicker} disabled={isImporting}>
        {isImporting ? 'Importing...' : 'Import Excel/CSV'}
      </Button>
      <Button variant="outline-secondary" className="ms-2" onClick={handleExportCsv}>
        Export CSV
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Price</th>
            <th>Barcode</th>
            <th style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.description}</td>
              <td>{p.price}</td>
              <td>{p.barcode}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={show} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'edit' ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Code</Form.Label>
              <Form.Control type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Check type="checkbox" label="Auto Generate Barcode" checked={autoBarcode} onChange={(e) => setAutoBarcode(e.target.checked)} />
            </Form.Group>
            {!autoBarcode && (
              <Form.Group>
                <Form.Label>Barcode</Form.Label>
                <Form.Control type="text" value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} />
              </Form.Group>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Products;