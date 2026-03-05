import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import api from '../api';

const Settings = () => {
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatPercent, setVatPercent] = useState(15);
  const [company, setCompany] = useState({
    tradingName: '',
    legalName: '',
    regNo: '',
    address: '',
    tel: '',
    vatNo: '',
    bankingDetails: '',
    disclaimer: ''
  });
  const [numbering, setNumbering] = useState({
    invoicePrefix: 'INV',
    quotePrefix: 'QU',
    currentInvoiceNumber: 336,
    currentQuoteNumber: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      const { settings, company: companyData } = res.data;
      
      setVatEnabled(settings.vatEnabled);
      setVatPercent(settings.vatPercent);
      setNumbering({
        invoicePrefix: settings.invoicePrefix,
        quotePrefix: settings.quotePrefix,
        currentInvoiceNumber: settings.currentInvoiceNumber,
        currentQuoteNumber: settings.currentQuoteNumber
      });

      if (companyData) {
        setCompany(companyData);
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const handleNumberingChange = (e) => {
    setNumbering({ ...numbering, [e.target.name]: 
      e.target.name.includes('current') ? parseInt(e.target.value) : e.target.value 
    });
  };

  const saveCompany = async () => {
    try {
      setError('');
      setSuccess('');
      await api.patch('/api/settings/company', company);
      setSuccess('Company profile saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save company profile');
    }
  };

  const saveVAT = async () => {
    try {
      setError('');
      setSuccess('');
      await api.patch('/api/settings/vat', {
        vatEnabled,
        vatPercent
      });
      setSuccess('VAT settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save VAT settings');
    }
  };

  const saveNumbering = async () => {
    try {
      setError('');
      setSuccess('');
      await api.patch('/api/settings/numbering', numbering);
      setSuccess('Numbering settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save numbering settings');
    }
  };

  if (loading) {
    return <Container className="mt-4"><p>Loading settings...</p></Container>;
  }

  return (
    <Container fluid className="mt-4">
      <h1 className="mb-4">Settings</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* VAT Settings */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>VAT Settings</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label="Enable VAT"
                checked={vatEnabled}
                onChange={(e) => setVatEnabled(e.target.checked)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>VAT Percentage</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={vatPercent}
                onChange={(e) => setVatPercent(parseFloat(e.target.value))}
                disabled={!vatEnabled}
              />
            </Form.Group>
            <Button onClick={saveVAT} style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}>
              Save VAT Settings
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Invoice/Quote Numbering */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Invoice & Quote Numbering</Card.Title>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Invoice Prefix</Form.Label>
                <Form.Control
                  name="invoicePrefix"
                  value={numbering.invoicePrefix}
                  onChange={handleNumberingChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Next Invoice Number</Form.Label>
                <Form.Control
                  type="number"
                  name="currentInvoiceNumber"
                  value={numbering.currentInvoiceNumber}
                  onChange={handleNumberingChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Quote Prefix</Form.Label>
                <Form.Control
                  name="quotePrefix"
                  value={numbering.quotePrefix}
                  onChange={handleNumberingChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Next Quote Number</Form.Label>
                <Form.Control
                  type="number"
                  name="currentQuoteNumber"
                  value={numbering.currentQuoteNumber}
                  onChange={handleNumberingChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Button onClick={saveNumbering} style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}>
            Save Numbering Settings
          </Button>
        </Card.Body>
      </Card>

      {/* Company Profile */}
      <Card>
        <Card.Body>
          <Card.Title>Company Profile</Card.Title>
          <p className="text-muted">These details will appear on all invoices and quotes</p>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trading Name</Form.Label>
                  <Form.Control
                    name="tradingName"
                    value={company.tradingName}
                    onChange={handleCompanyChange}
                    placeholder="e.g., P & C Technologies"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Legal Name</Form.Label>
                  <Form.Control
                    name="legalName"
                    value={company.legalName}
                    onChange={handleCompanyChange}
                    placeholder="e.g., Phiri & Choonara Technologies Pty Ltd"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reg No</Form.Label>
                  <Form.Control
                    name="regNo"
                    value={company.regNo}
                    onChange={handleCompanyChange}
                    placeholder="e.g., 2021 / 645816 / 07"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>VAT No</Form.Label>
                  <Form.Control
                    name="vatNo"
                    value={company.vatNo}
                    onChange={handleCompanyChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={company.address}
                onChange={handleCompanyChange}
                placeholder="69b Mountview Drive, Malabar, Gqeberha, 6020"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tel</Form.Label>
              <Form.Control
                name="tel"
                value={company.tel}
                onChange={handleCompanyChange}
                placeholder="0214627977"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Banking Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bankingDetails"
                value={company.bankingDetails}
                onChange={handleCompanyChange}
                placeholder="Payments: FNB&#10;Branch: 210050&#10;Account Number: 62902222596"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Disclaimer / Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="disclaimer"
                value={company.disclaimer}
                onChange={handleCompanyChange}
                placeholder="Please send proof of payment to..."
              />
            </Form.Group>
            <Button onClick={saveCompany} style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}>
              Save Company Profile
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Settings;