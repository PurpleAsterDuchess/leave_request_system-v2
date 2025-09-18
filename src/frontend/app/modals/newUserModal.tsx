import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

type LoaderData = {
  token: string;
};

type NewUserModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (user: {
    id?: number;
    email: string;
    firstname: string;
    surname: string;
    roleId: number;
    manager?: {
      id: number,
      firstname: string;
      surname: string;
    } | null;
    password: string;
  }) => void;
  error?: string;
  token: string;
};

export const NewUserModal = ({
  show,
  onClose,
  onSubmit,
  error: backendError,
  token,
}: NewUserModalProps) => {
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [managerId, setManagerId] = useState<number | "">("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [managers, setManagers] = useState<
    { id: number; firstname: string; surname: string; role: { id: number } }[]
  >([]);

  const fetchManagers = () => {
    fetch(`${API_ENDPOINT}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch managers");
        return res.json();
      })
      .then((data) => {
        setManagers(data?.data || []);
      })
      .catch((err) => console.error(err));
  };

  const fetchRoles = () => {
    fetch(`${API_ENDPOINT}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setRoles(data?.data || []))
      .catch((err) => console.error(err));
  };

  const handleSubmit = () => {
    const selectedManager =
      managerId === "" ? null : managers.find((m) => m.id === managerId);

    if (!email || !firstname || !surname || !roleId || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    onSubmit({
      email,
      firstname,
      surname,
      roleId: roleId,
      manager: selectedManager || null,
      password,
    });
  };

  useEffect(() => {
    fetchManagers();
    fetchRoles();
  }, []);

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
            <Form.Select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="userLineManager">
            <Form.Label>Manager</Form.Label>
            <Form.Select
              value={managerId}
              onChange={(e) => setManagerId(Number(e.target.value))}
            >
              <option value="">Select a manager (optional)</option>
              {managers
                .filter((manager) => manager.role.id === 2)
                .map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstname} {manager.surname}
                  </option>
                ))}
            </Form.Select>
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
