import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
type NewUserModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (user: {
    id?: number;
    email: string;
    firstname: string;
    surname: string;
    roleId: number;
    password: string;
  }) => void;
  error?: string;
};

export const NewUserModal = ({
  show,
  onClose,
  onSubmit,
  error: backendError,
}: NewUserModalProps) => {
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email || !firstname || !surname || !roleId || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    onSubmit({ email, firstname, surname, roleId, password });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{"New User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="userEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userFirstname">
            <Form.Label>First name</Form.Label>
            <Form.Control
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required={true}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userSurname">
            <Form.Label>Surname</Form.Label>
            <Form.Control
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required={true}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userRole">
            <Form.Label>Role</Form.Label>
            <Form.Control
              type="text"
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              required={true}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="userPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={true}
            />
          </Form.Group>
        </Form>
        {(error || backendError) && (
          <div
            style={{ color: "red", marginBottom: "1rem", textAlign: "right" }}
          >
            {error || backendError}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};