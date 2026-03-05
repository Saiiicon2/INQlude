import React, { useState, useEffect } from 'react';
import { Container, Button, Form, Table, Modal, Alert } from 'react-bootstrap';
import api from '../api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', price: '', barcode: '' });
  const [autoBarcode, setAutoBarcode] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleImport = (e) => {
    // TODO: handle excel import
    alert('Import functionality to be implemented');
  };

  return (
    <Container fluid className="mt-4">
      <h1>Products</h1>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      <Button onClick={openCreate}>Add Product</Button>
      <Button variant="secondary" className="ms-2" onClick={handleImport}>Import Excel</Button>
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