import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h5 className="mt-2" aria-label="INQlude">
          <i className="bi bi-pen-fill me-2" aria-hidden="true" />
          INQlude
        </h5>
      </div>
      <Nav className="flex-column">
        <LinkContainer to="/">
          <Nav.Link className="sidebar-link">Dashboard</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/invoices">
          <Nav.Link className="sidebar-link">New Sale</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/invoices">
          <Nav.Link className="sidebar-link">Invoices</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/clients">
          <Nav.Link className="sidebar-link">Clients</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/products">
          <Nav.Link className="sidebar-link">Products</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/settings">
          <Nav.Link className="sidebar-link">Settings</Nav.Link>
        </LinkContainer>
      </Nav>
      <div className="sidebar-footer">
        <p className="mb-2">
          {user?.name}
        </p>
        <Button variant="outline-light" size="sm" onClick={handleLogout} className="w-100">
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;