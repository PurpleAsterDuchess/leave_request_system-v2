describe("Dashboard Home Page", () => {
  const API_ENDPOINT = "http://localhost:8900/api/";
  beforeEach(() => {
    window.cookieStore.set(
      "__session",
      "eyJqd3QiOiJmYWtlLWp3dCJ9.Gg9csAok0AhEnUgJKVEhhuERNsh3kNFloowLNS7Vh5o"
    );
    cy.visit("http://localhost:5173/admin");

    cy.intercept("GET", `${API_ENDPOINT}/users`, {
      statusCode: 200,
      body: {
        data: [
          {
            id: 1,
            firstname: "Alice",
            surname: "Johnson",
            email: "alice@example.com",
            initialAlTotal: 25,
            remainingAl: 15,
            role: {
              id: 1,
              name: "admin",
            },
          },
          {
            id: 2,
            firstname: "Bob",
            surname: "Smith",
            email: "bob@example.com",
            initialAlTotal: 25,
            remainingAl: 10,
            role: {
              id: 2,
              name: "manager",
            },
          },
          {
            id: 3,
            firstname: "Coy",
            surname: "Brown",
            email: "bob@example.com",
            initialAlTotal: 25,
            remainingAl: 12,
            role: {
              id: 3,
              name: "staff",
            },
          },
          {
            id: 4,
            firstname: "Dan",
            surname: "Williams",
            email: "dan@example.com",
            initialAlTotal: 25,
            remainingAl: 15,
            role: {
              id: 3,
              name: "staff",
            },
          },
        ],
      },
    }).as("getUsers");

    cy.intercept("GET", `${API_ENDPOINT}/roles`, {
      statusCode: 200,
      body: {
        data: [
          {
            id: 3,
            name: "staff"
          },
        ],
      },
    }).as("getRoles");

    cy.intercept(
      "POST",
      "http://localhost:8900/api/users/*/reset-Al",
      (req) => {
        const body =
          typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        req.reply({
          statusCode: 200,
          body: {
            data: {
              id: body.id,
              remainingAl: 25,
            },
          },
        });
      }
    ).as("resetUser");

    cy.intercept("POST", "http://localhost:8900/api/users", (req) => {
      req.reply({
        statusCode: 201,
        body: {
          data: {
            id: 99,
            firstname: req.body.firstname,
            surname: req.body.surname,
            role: req.body.role,
            password: req.body.password,
          },
        },
      });
    }).as("postUser");
  });

  it("loads table", () => {
    cy.wait("@getUsers");
    cy.get("table tbody tr").should("have.length", 4);

    cy.contains("Alice Johnson").should("exist");
  });

  it("checks reset and delete buttons exist", () => {
    cy.wait("@getUsers");

    cy.contains("Alice Johnson")
      .closest("tr")
      .find("button.btn-danger")
      .should("exist");
  });

  it("resets user's leaves", () => {
    cy.wait("@getUsers");

    cy.contains("Bob Smith")
      .closest("tr")
      .within(() => {
        cy.contains("button", "Reset").click();
      });

    cy.wait("@resetUser").then((interception) => {
      expect(interception.request.body).to.include({
        id: 2,
        firstname: "Bob",
        surname: "Smith",
      });

      // Assert response
      expect(interception.response?.body.data).to.deep.equal({
        id: 2,
        remainingAl: 25,
      });
    });
  });

  it("filters table rows based on first name", () => {
    cy.get("input[placeholder='Search by name or email']").type("Alice");
    cy.get("table tbody tr").should("have.length", 1);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on surname", () => {
    cy.get("input[placeholder='Search by name or email']").type("Johnson");
    cy.get("table tbody tr").should("have.length", 1);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on email", () => {
    cy.get("input[placeholder='Search by name or email']").type(
      "alice@example.com"
    );
    cy.get("table tbody tr").should("have.length", 1);
    cy.contains("Alice Johnson").should("exist");
  });

  it("filters table rows based on search input", () => {
    cy.get("table tbody tr").should("have.length", 4);

    cy.get("input[placeholder='Search by name or email']").type("NotExist");
    cy.get("table tbody tr").should("have.length", 0);
  });

  it("filters table rows based on roles input", () => {
    cy.wait("@getUsers");
    cy.wait("@getRoles");

    cy.get("select").select("staff");

    cy.get("table tbody tr").should("have.length", 2);
  });

   it("opens new user modal and submits a new user", () => {
     cy.wait("@getUsers");

     // Open modal
     cy.get("button[aria-label='Create user']").click();

     cy.get(".modal")
       .should("exist")
       .within(() => {
         // Fill form
         cy.get("#userEmail").type("alice@email.com");
         cy.get("#userFirstname").type("Alice");
         cy.get("#userSurname").type("Johnson");
         cy.get("#userRole").select("staff");
         cy.get("#userPassword").type("alicejohnson123")

         cy.contains("Submit").click();
       });

     cy.wait("@postUser");

     // Modal should close
     cy.get(".modal").should("not.exist");
   });
});
