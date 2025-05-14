import { PasswordHandler } from "./PasswordHandler";

describe("PasswordHandler", () => {
  it("should encrypt the password correctly", async () => {
    // Arrange
    const password = "myPassword123";

    // Act
    const { hashedPassword, salt } = PasswordHandler.hashPassword(password);

    // Assert
    expect(hashedPassword).toBeDefined();
    expect(salt).toBeDefined();
    expect(typeof hashedPassword).toBe("string");
    expect(typeof salt).toBe("string");
    expect(hashedPassword).not.toEqual(password);
    expect(salt).not.toEqual(password);
    expect(salt.length).toBeGreaterThan(0);
  });
  it("should verify the password correctly", () => {
    // Arrange
    const password = "myPassword123";
    const { hashedPassword, salt } = PasswordHandler.hashPassword(password);

    // Act
    const isVerified = PasswordHandler.verifyPassword(
      password,
      hashedPassword,
      salt
    );

    // Assert
    expect(isVerified).toBe(true);
  });
});
