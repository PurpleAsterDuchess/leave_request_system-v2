describe("Dashboard Home Page", () => {
  const API_ENDPOINT = "http://localhost:8900/api/";
  beforeEach(() => {
    window.cookieStore.set(
      "__session",
      "eyJqd3QiOiJmYWtlLWp3dCJ9.Gg9csAok0AhEnUgJKVEhhuERNsh3kNFloowLNS7Vh5o"
    );
    cy.visit("http://localhost:5173/manager");

    cy.intercept("GET", `${API_ENDPOINT}/leave`, {
      statusCode: 200,
      body: {
        data: [
          {
            leaveId: 1,
            startDate: "2025-09-19",
            endDate: "2025-09-20",
            status: "pending",
            user: {
              firstname: "Alice",
              surname: "Johnson",
              email: "alice@example.com",
              initialAlTotal: 25,
              remainingAl: 15,
            },
          },
          {
            leaveId: 2,
            startDate: "2025-09-21",
            endDate: "2025-09-22",
            status: "approved",
            user: {
              firstname: "Bob",
              surname: "Smith",
              email: "bob@example.com",
              initialAlTotal: 25,
              remainingAl: 10,
            },
          },
          {
            leaveId: 3,
            startDate: "2025-09-23",
            endDate: "2025-09-24",
            status: "canceled",
            user: {
              firstname: "Coy",
              surname: "Brown",
              email: "bob@example.com",
              initialAlTotal: 25,
              remainingAl: 12,
            },
          },
          {
            leaveId: 4,
            startDate: "2025-09-25",
            endDate: "2025-09-26",
            status: "rejected",
            user: {
              firstname: "Alice",
              surname: "Johnson",
              email: "alice@example.com",
              initialAlTotal: 25,
              remainingAl: 15,
            },
          },
        ],
      },
    }).as("getLeaves");

    cy.intercept("PATCH", `${API_ENDPOINT}/leave`, {
      statusCode: 202,
      body: {
        message: "Leave updated",
      },
    }).as("updateLeaveStatus");
  });

  it("loads table", () => {
    cy.wait("@getLeaves");
    cy.get("table tbody tr").should("have.length", 4);

    // check pending
    cy.contains("2025-09-19").should("exist");
    cy.contains("pending").should("exist");

    // check approved
    cy.contains("2025-09-21").should("exist");
    cy.contains("approved").should("exist");

    // check canceled
    cy.contains("2025-09-23").should("exist");
    cy.contains("canceled").should("exist");

    // check rejected
    cy.contains("2025-09-25").should("exist");
    cy.contains("rejected").should("exist");
  });

  it("checks approve and reject buttons exist", () => {
    cy.wait("@getLeaves");

    cy.contains("pending")
      .closest("tr")
      .find("button.btn-outline-success")
      .should("exist");
    cy.contains("pending")
      .closest("tr")
      .find("button.btn-danger")
      .should("exist");
    cy.contains("rejected")
      .closest("tr")
      .find("button.btn")
      .should("not.exist");
    cy.contains("approved")
      .closest("tr")
      .find("button.btn")
      .should("not.exist");
    cy.contains("canceled")
      .closest("tr")
      .find("button.btn")
      .should("not.exist");
  });

  it("approves pending leave status", () => {
    cy.wait("@getLeaves");

    cy.contains("pending")
      .parent()
      .within(() => {
        cy.get(".btn-outline-success").click();
      });

    cy.wait("@updateLeaveStatus").its("request.body").should("deep.equal", {
      id: 1,
      status: "approved",
    });
  });

  it("rejects pending leave status", () => {
    cy.wait("@getLeaves");

    cy.contains("pending")
      .parent()
      .within(() => {
        cy.get(".btn-danger").click();
      });

    cy.wait("@updateLeaveStatus").its("request.body").should("deep.equal", {
      id: 1,
      status: "rejected",
    });
  });

  it("filters table rows based on first name", () => {
    cy.get("input[placeholder='Search by name or email']").type("Alice");
    cy.get("table tbody tr").should("have.length", 2);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on surname", () => {
    cy.get("input[placeholder='Search by name or email']").type("Johnson");
    cy.get("table tbody tr").should("have.length", 2);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on email", () => {
    cy.get("input[placeholder='Search by name or email']").type(
      "alice@example.com"
    );
    cy.get("table tbody tr").should("have.length", 2);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on search input", () => {
    cy.get("table tbody tr").should("have.length", 4);

    cy.get("input[placeholder='Search by name or email']").type("NotExist");
    cy.get("table tbody tr").should("have.length", 0);
  });
});
