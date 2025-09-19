describe("Login Page", () => {
  beforeEach(() => {
    cy.intercept("POST", "http://localhost:8900/api/login", {
      statusCode: 200,
      body: {
        token:
          "eyJqd3QiOiJmYWtlLWp3dCJ9.Gg9csAok0AhEnUgJKVEhhuERNsh3kNFloowLNS7Vh5o",
      },
    }).as("loginRequest");
    cy.visit("http://localhost:5173/auth/login");
  });

  it("renders login form", () => {
    cy.contains("h3", "Login").should("exist");
    cy.get("input[name='email']").should("exist");
    cy.get("input[name='password']").should("exist");
    cy.get("button[type='submit']").contains("Login").should("exist");
  });

  it("requires email and password", () => {
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/login");
  });
});
