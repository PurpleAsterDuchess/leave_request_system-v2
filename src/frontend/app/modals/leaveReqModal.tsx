import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
type LeaveRequestModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (leave: {
    id?: number;
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
  editingLeave?: {
    id?: number;
    startDate: string;
    endDate: string;
    reason?: string;
  };
};

export const LeaveRequestModal = ({
  show,
  onClose,
  onSubmit,
  editingLeave,
}: LeaveRequestModalProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Populate fields when editingLeave changes
  React.useEffect(() => {
    if (editingLeave) {
      setStartDate(editingLeave.startDate);
      setEndDate(editingLeave.endDate);
      setReason(editingLeave.reason || "");
    } else {
      setStartDate("");
      setEndDate("");
      setReason("");
    }
  }, [editingLeave, show]);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSubmit({ id: editingLeave?.id, startDate, endDate, reason });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingLeave ? "Edit Leave Request" : "New Leave Request"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="leaveStartDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="leaveEndDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="leaveReason">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional"
            />
          </Form.Group>
        </Form>
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
