describe("Dashboard Home Page", () => {
  const API_ENDPOINT = "http://localhost:8900/api";
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
          },
          {
            leaveId: 2,
            startDate: "2025-09-23",
            endDate: "2025-09-24",
            status: "requested",
          },
          {
            leaveId: 3,
            startDate: "2025-09-28",
            endDate: "2025-09-30",
            status: "rejected",
          },
        ],
      },
    }).as("getMyLeave");

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
        ],
      },
    }).as("getPendingLeaves");

    cy.intercept("PATCH", `${API_ENDPOINT}/leave`, {
      statusCode: 202,
      body: {
        message: "Leave updated",
      },
    }).as("updateLeaveStatus");
  });

  it("redirects to login if no token", () => {
    cy.clearAllCookies();
    cy.visit("http://localhost:5173/");
    cy.url().should("include", "/auth/login");
  });

  it("renders dashboard components when token exists", () => {
    cy.visit("http://localhost:5173/");

    cy.get("nav").should("exist");
    cy.get(".sidebar").should("exist");
    cy.get(".app-container").should("exist");
    cy.get(".main-content").should("exist");
  });

  it("loads leave cards correctly", () => {
    cy.visit("http://localhost:5173/");

    cy.wait("@getMyLeave");

    cy.contains("Used Leave").siblings("div").should("contain.text", "10");
    cy.contains("Used Leave")
      .prev("div")
      .should("have.css", "background-color", "rgb(255, 213, 128)");

    cy.contains("Remaining Leave").siblings("div").should("contain.text", "15");

    cy.contains("Remaining Leave")
      .prev("div")
      .should("have.css", "background-color", "rgb(255, 213, 128)");

    cy.contains("Total Leave").siblings("div").should("contain.text", "25");
    cy.contains("Total Leave")
      .prev("div")
      .should("have.css", "background-color", "rgb(158, 209, 222)");
  });

  it("shows loading state before API returns", () => {
    cy.intercept("GET", `${API_ENDPOINT}/leave/staff`, {
      delay: 1000,
      body: { data: [] },
    }).as("slowLeaveRequest");

    cy.visit("http://localhost:5173/");

    cy.contains("Loading leave data...").should("be.visible");
  });

  it("handles API error gracefully", () => {
    cy.intercept("GET", `${API_ENDPOINT}/leave/staff`, {
      statusCode: 500,
      body: {},
    }).as("failLeaveRequest");

    cy.visit("http://localhost:5173/");

    cy.wait("@failLeaveRequest");

    cy.contains("Loading leave data...").should("exist");
  });

  it("loads pending leaves only", () => {
    cy.visit("http://localhost:5173/");
    cy.wait("@getPendingLeaves");
    cy.get("h5[aria-label='Pending Requests']").should(
      "contain.text",
      "Pending Requests"
    );

    cy.contains("Alice Johnson").should("exist");
    cy.contains("2025-09-19").should("exist");
    cy.contains("Remaining: 15").should("exist");

    cy.contains("Bob Smith").should("not.exist");
  });

  it("changes pending leave status", () => {
    cy.visit("http://localhost:5173/");
    cy.wait("@getPendingLeaves");

    cy.contains("Alice Johnson")
      .parent()
      .within(() => {
        cy.get(".btn-outline-success").click();
      });

    cy.wait("@updateLeaveStatus").its("request.body").should("deep.equal", {
      id: 1,
      status: "approved",
    });
  });

  it("loads leave calendar", () => {
    cy.visit("http://localhost:5173/");

    cy.wait("@getMyLeave");

    cy.get(".react-calendar")
      .contains("19")
      .should("have.class", "leave-approved");

    cy.get(".react-calendar")
      .contains("23")
      .should("have.class", "leave-requested");
    cy.get(".react-calendar")
      .contains("24")
      .should("have.class", "leave-requested");

    [28, 29, 30].forEach((day) => {
      cy.get(".react-calendar")
        .contains(day)
        .should("have.class", "leave-rejected");
    });
  });

  it("logs the user out and redirects to login", () => {
    cy.visit("http://localhost:5173/");
    cy.get("nav").should("exist");

    // Click logout button
    cy.get(".nav-link").contains("Logout").click();

    // Assert session cleared
    cy.window().then((win) => {
      expect(win.localStorage.getItem("__session")).to.be.null;
    });
  });
});
