import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

function LeaveCards() {
  return (
    <Row xs={1} md={3} className="g-4 comfy">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Col key={idx}>
          <Card>
            <div className="container">
              <div className="row">
                <div className="col-5" style={{fill: "blue"}}>
                  <Card.Text>This will contain the days left</Card.Text>
                </div>
                <div className="col-7">
                  <Card.Text>This should be in a box of some kind</Card.Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default LeaveCards;
