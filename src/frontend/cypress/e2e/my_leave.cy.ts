describe("Dashboard Home Page", () => {
  beforeEach(() => {
    window.cookieStore.set(
      "__session",
      "eyJqd3QiOiJmYWtlLWp3dCJ9.Gg9csAok0AhEnUgJKVEhhuERNsh3kNFloowLNS7Vh5o"
    );
    cy.intercept("GET", "http://localhost:8900/api/leave/staff", {
      statusCode: 200,
      body: {
        data: [
          {
            leaveId: 1,
            startDate: "2025-09-19",
            endDate: "2025-09-19",
            status: "approved",
            user: { initialAlTotal: 25, remainingAl: 15 },
            updatedAt: "2025-09-19",
          },
          {
            leaveId: 2,
            startDate: "2025-09-23",
            endDate: "2025-09-24",
            status: "pending",
            updatedAt: "2025-09-19",
          },
          {
            leaveId: 3,
            startDate: "2025-10-01",
            endDate: "2025-10-05",
            status: "rejected",
            updatedAt: "2025-09-19",
          },
          {
            leaveId: 4,
            startDate: "2025-10-01",
            endDate: "2025-10-05",
            status: "canceled",
            updatedAt: "2025-09-19",
          },
        ],
      },
    }).as("getLeaves");

    cy.intercept("POST", "http://localhost:8900/api/leave/staff", (req) => {
      req.reply({
        statusCode: 201,
        body: {
          data: {
            leaveId: 99,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: "requested",
            reason: req.body.reason,
          },
        },
      });
    }).as("postLeave");

    cy.intercept("PATCH", "http://localhost:8900/api/leave/staff", (req) => {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      req.reply({
        statusCode: 200,
        body: {
          data: {
            leaveId: body.id,
            status: body.status,
          },
        },
      });
    }).as("cancelLeave");
  });

  it("loads leave table", () => {
    cy.visit("http://localhost:5173/my_leave");

    cy.wait("@getLeaves");

    cy.get("table tbody tr").should("have.length", 4);
    // check approved
    cy.contains("2025-09-19").should("exist");
    cy.contains("approved").should("exist");

    // check rejected
    cy.contains("2025-10-05").should("exist");
    cy.contains("rejected").should("exist");

    // check pending
    cy.contains("2025-09-24").should("exist");
    cy.contains("pending").should("exist");
  });

  it("checks cancel buttons exist", () => {
    cy.visit("http://localhost:5173/my_leave");

    cy.wait("@getLeaves");

    cy.contains("approved").closest("tr").find("button.btn").should("exist");
    cy.contains("pending").closest("tr").find("button.btn").should("exist");
    cy.contains("rejected").closest("tr").find("button.btn").should("exist");
    cy.contains("canceled")
      .closest("tr")
      .find("button.btn")
      .should("not.exist");
  });

  it("opens leave request modal and submits a new leave", () => {
    cy.visit("http://localhost:5173/my_leave");
    cy.wait("@getLeaves");

    // Open modal
    cy.get("button[aria-label='Request leave']").click();

    cy.get(".modal")
      .should("exist")
      .within(() => {
        // Fill form
        cy.get("#leaveStartDate").type("2025-09-25");
        cy.get("#leaveEndDate").type("2025-09-26");
        cy.get("#leaveReason").type("Vacation");

        cy.contains("Submit").click();
      });

    cy.wait("@postLeave");

    // Modal should close
    cy.get(".modal").should("not.exist");
  });

  it("cancels a leave request", () => {
    cy.visit("http://localhost:5173/my_leave");
    cy.wait("@getLeaves");

    cy.contains("2025-09-24");
    cy.contains("2025-09-24")
      .closest("tr")
      .within(() => {
        cy.get("button[aria-label^='Cancel leave request']").click();
      });

    cy.wait("@cancelLeave");
  });
});
