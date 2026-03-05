import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const [analytics, setAnalytics] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    chartData: {
      labels: [],
      datasets: []
    }
  });

  useEffect(() => {
    // Fetch analytics data
    // For now, mock data
    setAnalytics({
      totalInvoices: 150,
      totalRevenue: 50000,
      pendingInvoices: 20,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Revenue',
          data: [10000, 15000, 20000, 25000, 30000],
          backgroundColor: '#20b2aa'
        }]
      }
    });
  }, []);

  return (
    <Container fluid className="mt-4">
      <h1>Dashboard</h1>
      <Row>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Invoices</Card.Title>
              <Card.Text>{analytics.totalInvoices}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Revenue (ZAR)</Card.Title>
              <Card.Text>R {analytics.totalRevenue}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Pending Invoices</Card.Title>
              <Card.Text>{analytics.pendingInvoices}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Revenue Chart</Card.Title>
              <Bar data={analytics.chartData || { labels: [], datasets: [] }} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Recent History</Card.Title>
              <ul>
                <li>Invoice INV337 created</li>
                <li>Client added: Moving Tactics</li>
                <li>Product updated</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;