import React, { useRef } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';

const SignatureCapture = ({ show, onClose, onSign }) => {
  const signatureRef = useRef();

  const handleClear = () => {
    signatureRef.current.clear();
  };

  const handleSign = () => {
    if (signatureRef.current.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    const signatureData = signatureRef.current.toDataURL();
    onSign(signatureData);
    handleClear();
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Capture Signature</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">Sign in the box below:</p>
        <div
          style={{
            border: '2px solid #20b2aa',
            borderRadius: '5px',
            backgroundColor: '#f9f9f9',
            marginBottom: '15px'
          }}
        >
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas'
            }}
            strokeWidth={2}
            penColor="#000"
          />
        </div>
        <Row>
          <Col>
            <Button variant="secondary" onClick={handleClear} className="w-100">
              Clear
            </Button>
          </Col>
          <Col>
            <Button
              style={{ backgroundColor: '#20b2aa', borderColor: '#20b2aa' }}
              onClick={handleSign}
              className="w-100"
            >
              Sign
            </Button>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default SignatureCapture;