import React, { useState } from 'react';
import { Nav, Button, Offcanvas } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const openMobileMenu = () => setShowMobileMenu(true);
  const closeMobileMenu = () => setShowMobileMenu(false);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/login');
  };

  const navLinks = (
    <Nav className="flex-column">
      <LinkContainer to="/">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-speedometer2 me-2" aria-hidden="true" />
          Dashboard
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/invoices">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-cart-plus me-2" aria-hidden="true" />
          New Sale
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/invoices">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-receipt me-2" aria-hidden="true" />
          Invoices
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/clients">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-people me-2" aria-hidden="true" />
          Clients
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/products">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-box-seam me-2" aria-hidden="true" />
          Products
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/services">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-briefcase me-2" aria-hidden="true" />
          Services
        </Nav.Link>
      </LinkContainer>
      <LinkContainer to="/settings">
        <Nav.Link className="sidebar-link" onClick={closeMobileMenu}>
          <i className="bi bi-gear me-2" aria-hidden="true" />
          Settings
        </Nav.Link>
      </LinkContainer>
    </Nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar d-md-none">
        <Button
          variant="outline-light"
          size="sm"
          onClick={openMobileMenu}
          aria-label="Open menu"
        >
          <i className="bi bi-list" aria-hidden="true" />
        </Button>

        <div className="mobile-brand" aria-label="INQlude">
          <i className="bi bi-pen-fill me-2" aria-hidden="true" />
          INQlude
        </div>
      </div>

      <Offcanvas
        show={showMobileMenu}
        onHide={closeMobileMenu}
        placement="start"
        className="d-md-none"
      >
        <Offcanvas.Header closeButton className="mobile-offcanvas-header">
          <Offcanvas.Title aria-label="INQlude">
            <i className="bi bi-pen-fill me-2" aria-hidden="true" />
            INQlude
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <div className="sidebar sidebar-static">
            {navLinks}
            <div className="sidebar-footer">
              <p className="mb-2">{user?.name}</p>
              <Button variant="outline-light" size="sm" onClick={handleLogout} className="w-100">
                <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                Logout
              </Button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Desktop sidebar (unchanged) */}
      <div className="sidebar d-none d-md-flex">
        <div className="sidebar-header">
          <h5 className="mt-2" aria-label="INQlude">
            <i className="bi bi-pen-fill me-2" aria-hidden="true" />
            INQlude
          </h5>
        </div>
        {navLinks}
        <div className="sidebar-footer">
          <p className="mb-2">{user?.name}</p>
          <Button variant="outline-light" size="sm" onClick={handleLogout} className="w-100">
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;