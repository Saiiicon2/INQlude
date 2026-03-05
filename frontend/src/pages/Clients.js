import React, { useState, useEffect } from 'react';
import { Container, Button, Form, Table, Modal, Card, Alert } from 'react-bootstrap';
import api from '../api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', tel: '', email: '' });
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/clients');
      setClients(res.data);
      return res.data;
    } catch (err) {
      setError('Failed to fetch clients');
      console.error(err);
      return null;
    }
  };

  const openCreate = () => {
    setError('');
    setMode('create');
    setEditingId(null);
    setForm({ name: '', address: '', tel: '', email: '' });
    setShow(true);
  };

  const openEdit = (client) => {
    setError('');
    setMode('edit');
    setEditingId(client.id);
    setForm({
      name: client.name || '',
      address: client.address || '',
      tel: client.tel || '',
      email: client.email || ''
    });
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setIsSaving(false);
    setMode('create');
    setEditingId(null);
    setForm({ name: '', address: '', tel: '', email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsSaving(true);

      if (mode === 'edit') {
        await api.patch(`/api/clients/${editingId}`, form);
      } else {
        await api.post('/api/clients', form);
      }

      const refreshed = await fetchClients();
      if (refreshed && selectedClient?.id === editingId) {
        const updated = refreshed.find((c) => c.id === editingId);
        if (updated) setSelectedClient(updated);
      }

      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client) => {
    const ok = window.confirm(`Delete client ${client.name}?`);
    if (!ok) return;
    try {
      setError('');
      await api.delete(`/api/clients/${client.id}`);
      if (selectedClient?.id === client.id) setSelectedClient(null);
      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete client');
      console.error(err);
    }
  };

  return (
    <Container fluid className="mt-4">
      <h1>Clients</h1>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      <Button onClick={openCreate}>Add Client</Button>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Tel</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.address}</td>
              <td>{c.tel}</td>
              <td>{c.email}</td>
              <td>
                <div className="d-flex gap-2 flex-wrap">
                  <Button size="sm" variant="info" onClick={() => setSelectedClient(c)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="outline-primary" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {selectedClient && (
        <Card className="mt-3">
          <Card.Body>
            <Card.Title>{selectedClient.name} Details</Card.Title>
            <p>Address: {selectedClient.address}</p>
            <p>Tel: {selectedClient.tel}</p>
            <p>Email: {selectedClient.email}</p>
            <h5>Stats</h5>
            <p>Total Sales: R 0</p> {/* TODO: calculate */}
            <h5>Invoices</h5>
            <ul>
              {/* TODO: list invoices */}
            </ul>
            <h5>Quotes</h5>
            <ul>
              {/* TODO: list quotes */}
            </ul>
          </Card.Body>
        </Card>
      )}

      <Modal show={show} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'edit' ? 'Edit Client' : 'Add Client'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Tel</Form.Label>
              <Form.Control type="text" value={form.tel} onChange={(e) => setForm({...form, tel: e.target.value})} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            </Form.Group>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Clients;