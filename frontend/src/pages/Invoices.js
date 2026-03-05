import React, { useState, useEffect } from 'react';
import { Container, Button, Form, Table, Modal, Row, Col, Alert } from 'react-bootstrap';
import api from '../api';
import SignatureCapture from '../components/SignatureCapture';

const Invoices = () => {
  const [documents, setDocuments] = useState({ invoices: [], quotes: [] });
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [show, setShow] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [type, setType] = useState('invoice');
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, clientRes, prodRes] = await Promise.all([
        api.get('/api/invoices'),
        api.get('/api/clients'),
        api.get('/api/products')
      ]);
      setDocuments(invRes.data);
      setClients(clientRes.data);
      const all = Array.isArray(prodRes.data) ? prodRes.data : [];
      setProducts(all.filter((p) => (p.kind || 'product') === 'product'));
      setServices(all.filter((p) => (p.kind || 'product') === 'service'));
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }
  };

  const addItem = (product) => {
    const kind = product.kind || 'product';
    setItems([...items, { productId: product.id, product, kind, quantity: 1, price: product.price }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (newItems[index]?.kind === 'service' && field === 'quantity') {
      newItems[index].quantity = 1;
      setItems(newItems);
      return;
    }
    if (field === 'quantity') {
      newItems[index].quantity = parseInt(value);
    } else if (field === 'price') {
      newItems[index].price = parseFloat(value);
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    let total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (discountType === 'percentage') {
      total -= total * (discount / 100);
    } else {
      total -= discount;
    }
    return Math.max(0, total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!selectedClient) {
        setError('Please select a client');
        return;
      }

      if (items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      // Show signature capture modal
      setShowSignature(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create document');
    }
  };

  const handleSignatureCapture = async (signatureData) => {
    try {
      await api.post('/api/invoices', {
        clientId: parseInt(selectedClient),
        items,
        discount,
        discountType,
        type,
        signature: signatureData
      });

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully with signature!`);
      setItems([]);
      setDiscount(0);
      setSelectedClient('');
      setShow(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create document');
    }
  };

  const downloadPDF = async (id, docType, number) => {
    try {
      const response = await api.get(`/api/invoices/${id}/pdf?type=${docType}`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeNumber = number ? String(number).replace(/[^a-zA-Z0-9_-]/g, '') : String(id);
      link.setAttribute('download', `${docType}_document_${safeNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  const allDocs = [
    ...documents.invoices.map(d => ({ ...d, docType: 'invoice' })),
    ...documents.quotes.map(d => ({ ...d, docType: 'quote' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Invoices & Quotes</h1>
        </Col>
        <Col className="text-end">
          <Button onClick={() => setShow(true)} style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}>
            New Sale
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Number</th>
            <th>Type</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allDocs.map(d => (
            <tr key={`${d.docType}-${d.id}`}>
              <td>{d.number}</td>
              <td><span className="badge" style={{ backgroundColor: d.docType === 'invoice' ? '#20b2aa' : '#999' }}>
                {d.docType.toUpperCase()}
              </span></td>
              <td>{d.client.name}</td>
              <td>R {d.total.toFixed(2)}</td>
              <td>{d.status}</td>
              <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              <td>
                <Button
                  variant="sm"
                  onClick={() => downloadPDF(d.id, d.docType, d.number)}
                  style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}
                >
                  PDF
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>New {type === 'invoice' ? 'Invoice' : 'Quote'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="invoice">Invoice</option>
                    <option value="quote">Quote</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client *</Form.Label>
                  <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Add Products</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {products.map(p => (
                  <Button
                    key={p.id}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => addItem(p)}
                  >
                    {p.description} - R {p.price}
                  </Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Add Services</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {services.map(s => (
                  <Button
                    key={s.id}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => addItem(s)}
                  >
                    {s.description} - R {s.price}
                  </Button>
                ))}
              </div>
            </Form.Group>

            {items.length > 0 && (
              <Table bordered className="mb-3">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '100px' }}>Qty</th>
                    <th style={{ width: '100px' }}>Price</th>
                    <th style={{ width: '100px' }}>Total</th>
                    <th style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product.description}</td>
                      <td>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          min="1"
                          disabled={item.kind === 'service'}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value)}
                        />
                      </td>
                      <td>R {(item.quantity * item.price).toFixed(2)}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Discount Type</Form.Label>
                  <Form.Select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="amount">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Discount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h5>Total Due: <span style={{ color: '#20b2aa' }}>R {calculateTotal().toFixed(2)}</span></h5>
            </div>

            <Button
              type="submit"
              style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}
              className="mt-3"
            >
              Create {type === 'invoice' ? 'Invoice' : 'Quote'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <SignatureCapture 
        show={showSignature}
        onSign={handleSignatureCapture}
        onClose={() => setShowSignature(false)}
      />
    </Container>
  );
};

export default Invoices;