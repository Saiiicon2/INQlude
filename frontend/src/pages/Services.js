import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Table, Modal, Alert } from 'react-bootstrap';
import api from '../api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', price: '' });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setError('');
      const res = await api.get('/api/products?kind=service');
      setServices(res.data);
    } catch (err) {
      setError('Failed to fetch services');
      console.error(err);
    }
  };

  const openCreate = () => {
    setError('');
    setMode('create');
    setEditingId(null);
    setForm({ code: '', description: '', price: '' });
    setShow(true);
  };

  const openEdit = (service) => {
    setError('');
    setMode('edit');
    setEditingId(service.id);
    setForm({
      code: service.code || '',
      description: service.description || '',
      price: service.price !== undefined && service.price !== null ? String(service.price) : ''
    });
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setIsSaving(false);
    setMode('create');
    setEditingId(null);
    setForm({ code: '', description: '', price: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsSaving(true);

      const parsedPrice = Number.parseFloat(String(form.price));
      if (!Number.isFinite(parsedPrice)) {
        setError('Rate must be a valid number');
        return;
      }

      const payload = {
        code: form.code,
        description: form.description,
        price: parsedPrice,
        kind: 'service'
      };

      if (mode === 'edit') {
        await api.patch(`/api/products/${editingId}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      await fetchServices();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (service) => {
    const ok = window.confirm(`Delete service ${service.code} - ${service.description}?`);
    if (!ok) return;

    try {
      setError('');
      await api.delete(`/api/products/${service.id}`);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete service');
      console.error(err);
    }
  };

  return (
    <Container fluid className="mt-4">
      <h1>Services</h1>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      <Button onClick={openCreate}>Add Service</Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Rate</th>
            <th style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.code}</td>
              <td>{s.description}</td>
              <td>{s.price}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(s)}>
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
          <Modal.Title>{mode === 'edit' ? 'Edit Service' : 'Add Service'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Code</Form.Label>
              <Form.Control
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Rate</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </Form.Group>

            <Button type="submit" disabled={isSaving} className="mt-3">
              {isSaving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Services;
