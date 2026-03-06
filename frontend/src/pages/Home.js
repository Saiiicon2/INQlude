import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api';
import './Home.css';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const currency = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0
});

const percent = new Intl.NumberFormat('en-ZA', {
  style: 'percent',
  maximumFractionDigits: 1
});

const monthLabel = (input) => {
  const dt = new Date(input);
  return dt.toLocaleString('en-ZA', { month: 'short' });
};

const getLastNMonths = (count) => {
  const now = new Date();
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const dt = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`,
      label: dt.toLocaleString('en-ZA', { month: 'short' })
    });
  }
  return months;
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    invoices: [],
    quotes: [],
    clients: [],
    products: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [invoiceRes, clientRes, productRes] = await Promise.all([
          api.get('/api/invoices'),
          api.get('/api/clients'),
          api.get('/api/products')
        ]);

        setData({
          invoices: Array.isArray(invoiceRes.data?.invoices) ? invoiceRes.data.invoices : [],
          quotes: Array.isArray(invoiceRes.data?.quotes) ? invoiceRes.data.quotes : [],
          clients: Array.isArray(clientRes.data) ? clientRes.data : [],
          products: Array.isArray(productRes.data) ? productRes.data : []
        });
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
        setError('Unable to load dashboard analytics right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const analytics = useMemo(() => {
    const invoices = data.invoices;
    const quotes = data.quotes;
    const allDocs = [
      ...invoices.map((doc) => ({ ...doc, docType: 'invoice' })),
      ...quotes.map((doc) => ({ ...doc, docType: 'quote' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalRevenue = invoices.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);
    const pendingDocs = allDocs.filter((doc) => String(doc.status || '').toLowerCase() === 'pending').length;
    const paidInvoices = invoices.filter((doc) => String(doc.status || '').toLowerCase() === 'paid').length;
    const collectionRate = invoices.length > 0 ? paidInvoices / invoices.length : 0;
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    const months = getLastNMonths(6);
    const totalsByMonth = new Map(months.map((m) => [m.key, 0]));
    invoices.forEach((inv) => {
      const created = new Date(inv.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (totalsByMonth.has(key)) {
        totalsByMonth.set(key, totalsByMonth.get(key) + (Number(inv.total) || 0));
      }
    });

    const statusMap = new Map();
    allDocs.forEach((doc) => {
      const statusKey = String(doc.status || 'unknown').toLowerCase();
      statusMap.set(statusKey, (statusMap.get(statusKey) || 0) + 1);
    });

    const statusLabels = Array.from(statusMap.keys()).map((key) => key.charAt(0).toUpperCase() + key.slice(1));
    const statusValues = Array.from(statusMap.values());

    const recentActivity = allDocs.slice(0, 6).map((doc) => ({
      id: doc.id,
      number: doc.number,
      type: doc.docType,
      status: doc.status || 'pending',
      client: doc.client?.name || 'Unknown Client',
      total: Number(doc.total) || 0,
      createdAt: doc.createdAt
    }));

    return {
      totalInvoices: invoices.length,
      totalQuotes: quotes.length,
      totalRevenue,
      pendingDocs,
      collectionRate,
      avgInvoiceValue,
      totalClients: data.clients.length,
      catalogItems: data.products.length,
      monthlyRevenueChart: {
        labels: months.map((m) => m.label),
        datasets: [
          {
            label: 'Invoiced Revenue',
            data: months.map((m) => totalsByMonth.get(m.key) || 0),
            backgroundColor: 'rgba(32, 178, 170, 0.75)',
            borderRadius: 8
          }
        ]
      },
      statusChart: {
        labels: statusLabels,
        datasets: [
          {
            data: statusValues,
            backgroundColor: ['#20b2aa', '#ffc857', '#0b5563', '#ff7f50', '#6a994e']
          }
        ]
      },
      recentActivity
    };
  }, [data]);

  if (loading) {
    return (
      <Container fluid className="mt-4 d-flex justify-content-center">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <div className="mt-2">Loading dashboard analytics...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="dashboard-header mb-4">
        <h1 className="mb-1">Dashboard</h1>
        <p className="text-muted mb-0">Real-time snapshot of invoices, quotes, cashflow, and activity.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3">
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-kpi">
            <Card.Body>
              <Card.Title>Total Invoices</Card.Title>
              <Card.Text className="dashboard-kpi-value">{analytics.totalInvoices}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-kpi">
            <Card.Body>
              <Card.Title>Total Quotes</Card.Title>
              <Card.Text className="dashboard-kpi-value">{analytics.totalQuotes}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-kpi">
            <Card.Body>
              <Card.Title>Total Revenue</Card.Title>
              <Card.Text className="dashboard-kpi-value">{currency.format(analytics.totalRevenue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-kpi">
            <Card.Body>
              <Card.Title>Pending Docs</Card.Title>
              <Card.Text className="dashboard-kpi-value">{analytics.pendingDocs}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-mini">
            <Card.Body>
              <Card.Title>Collection Rate</Card.Title>
              <Card.Text>{percent.format(analytics.collectionRate)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-mini">
            <Card.Body>
              <Card.Title>Average Invoice</Card.Title>
              <Card.Text>{currency.format(analytics.avgInvoiceValue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-mini">
            <Card.Body>
              <Card.Title>Clients</Card.Title>
              <Card.Text>{analytics.totalClients}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="text-center h-100 dashboard-mini">
            <Card.Body>
              <Card.Title>Catalog Items</Card.Title>
              <Card.Text>{analytics.catalogItems}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 g-3">
        <Col lg={8}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>6-Month Revenue Trend</Card.Title>
              <Bar data={analytics.monthlyRevenueChart} options={{ responsive: true, maintainAspectRatio: false }} height={120} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Status Mix</Card.Title>
              {analytics.statusChart.labels.length > 0 ? (
                <Doughnut
                  data={analytics.statusChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                  height={120}
                />
              ) : (
                <div className="text-muted mt-2">No statuses available yet.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              {analytics.recentActivity.length === 0 ? (
                <div className="text-muted">No invoices or quotes created yet.</div>
              ) : (
                <div className="dashboard-activity-list">
                  {analytics.recentActivity.map((item) => (
                    <div className="dashboard-activity-item" key={`${item.type}-${item.id}`}>
                      <div>
                        <strong>{item.number}</strong> for {item.client}
                        <div className="text-muted small">
                          {monthLabel(item.createdAt)} {new Date(item.createdAt).getDate()} • {currency.format(item.total)}
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={item.type === 'quote' ? 'secondary' : 'info'}>{item.type.toUpperCase()}</Badge>
                        <Badge bg={String(item.status).toLowerCase() === 'paid' ? 'success' : 'warning'}>
                          {String(item.status).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;