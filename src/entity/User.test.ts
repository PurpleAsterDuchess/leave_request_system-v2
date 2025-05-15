import { validate } from "class-validator";
import { User } from "./User";
import { Role } from "./Role";
import * as classTransformer from "class-transformer";
import { instanceToPlain } from "class-transformer";
import { getMetadataArgsStorage, QueryFailedError, Repository } from "typeorm";
import { mock } from "jest-mock-extended";

describe("User Entity", () => {
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let role: Role;
  let user: User;

  beforeEach(() => {
    mockUserRepository = mock<Repository<User>>();
    role = new Role();
    role.id = 1;
    role.name = "admin";

    user = new User();
    user.id = 1;
    user.firstname = "test";
    user.surname = "test";
    user.email = "test@email.com";
    user.password = "a".repeat(10);
    user.role = role;
  });
  describe("name", () => {
    it("a firstname must be a string", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.firstname = 1234 as any;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isString");
    });

    it("a surname must be a string", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.surname = 1234 as any;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isString");
    });
  });

  describe("password", () => {
    it("A password less than 10 characters is considered invalid", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.password = "a".repeat(9);

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("minLength");
    });

    it("a password must be a string", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.password = 1234 as any;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isString");
    });
  });

  describe("email", () => {
    it("a poorly formed email is considered invalid", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.email = "not a valid email address";

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isEmail");
    });

    it("a new user with duplicate email address cannot be inserted/saved", async () => {
      // Arrange
      mockUserRepository.save.mockImplementationOnce((user: User) =>
        Promise.resolve(user)
      );

      mockUserRepository.save.mockRejectedValue(
        new QueryFailedError(
          "INSERT INTO user",
          [],
          new Error(`#1062 - Duplicate entry ${user.email} for key email`)
        )
      );
      await expect(mockUserRepository.save(user)).resolves.toEqual(user);

      const userWithDuplicateEmailAddress = new User();
      userWithDuplicateEmailAddress.email = user.email;
      userWithDuplicateEmailAddress.password = "a".repeat(10);
      userWithDuplicateEmailAddress.role = role;

      //Act and assert
      await expect(
        mockUserRepository.save(userWithDuplicateEmailAddress)
      ).rejects.toThrow(QueryFailedError);
    });
  });

  describe("role", () => {
    it("a role must be defined", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.role = null;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should have a ManyToOne relationship with Role", async () => {
      // Arrange
      const relations = getMetadataArgsStorage().relations;

      // Act
      const userRoleRelation = relations.find(
        (relation) =>
          relation.target === User && relation.propertyName === "role"
      );

      // Assert
      expect(userRoleRelation).toBeDefined();
      expect(userRoleRelation.relationType).toBe("many-to-one");
    });

    it("a user with no role is considered invalid", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.role = null;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });
  });

  describe("manager", () => {
    it("should have a ManyToOne relationship with Manager", async () => {
      // Arrange
      const relations = getMetadataArgsStorage().relations;

      // Act
      const userManagerRelation = relations.find(
        (relation) =>
          relation.target === User && relation.propertyName === "manager"
      );

      // Assert
      expect(userManagerRelation).toBeDefined();
      expect(userManagerRelation.relationType).toBe("many-to-one");
    });
  });

  describe("initialAlTotal", () => {
    it("initialAlTotal must be an integer", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.initialAlTotal = 25.5 as any;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isInt");
    });
    
    it("initialAlTotal must not be less than 0", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.initialAlTotal = -1;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("min");
    });
  });

  describe("remainingAl", () => {
    it("remainingAl must be an integer", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.remainingAl = 10.5 as any;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("isInt");
    });
    it("remainingAl must not be less than 0", async () => {
      // Arrange
      const invalidUser = user;
      invalidUser.remainingAl = -1;

      // Act
      const errors = await validate(invalidUser);

      // Assert
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty("min");
    });
  });

  describe("valid user", () => {
    it("a user with valid details will pass validation", async () => {
      // Act
      const errors = await validate(user);

      // Assert
      expect(errors.length).toBe(0);
    });

    it("a user with valid details will not return their password after submitting valid details", () => {
      // Arrange
      jest.spyOn(classTransformer, "instanceToPlain").mockReturnValue({
        id: user.id,
        email: user.email,
        role: { id: user.role.id, name: user.role.name },
      } as any);

      // Act
      const plainUser = instanceToPlain(user);

      // Assert
      expect(plainUser).toHaveProperty("id", user.id);
      expect(plainUser).toHaveProperty("email", user.email);
      expect(plainUser).toHaveProperty("role", {
        id: role.id,
        name: role.name,
      });
      expect(plainUser).not.toHaveProperty("password");
    });

    it("users will not include a password from a get request", async () => {
      // Arrange
      const user = new User();
      mockUserRepository.findOne.mockResolvedValue({
        id: user.id,
        email: user.email,
        role: { id: role.id, name: role.name },
      } as User);

      // Act
      const retrievedUser = await mockUserRepository.findOne({
        where: { id: user.id },
      });

      // Assert
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser).toHaveProperty("id", user.id);
      expect(retrievedUser).toHaveProperty("email", user.email);
      expect(retrievedUser).toHaveProperty("role", {
        id: role.id,
        name: role.name,
      });

      expect(retrievedUser).not.toHaveProperty("password");
    });
  });
});
