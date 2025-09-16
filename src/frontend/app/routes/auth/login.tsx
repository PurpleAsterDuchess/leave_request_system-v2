import { useState } from "react";
import { Form, redirect, useNavigate, type MetaFunction } from "react-router";
import type { Route } from "./+types/login";
import { createUserSession, getUserId } from "~/services/session.server";

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

export const meta: MetaFunction = () => {
  return [
    { title: "Login page" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/");
  }
}

export async function action({ request }: Route.ActionArgs) {
  let sessionResponse: Response;
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const response = await fetch(`${API_ENDPOINT}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error("No token returned from server");
    }

    sessionResponse = await createUserSession({
      request,
      token,
      remember: true,
      redirectUrl: "/",
    });

    if (!sessionResponse) {
      throw new Error("An error occurred while creating the session");
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "An unknown error occurred" };
  }

  throw sessionResponse;
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <>
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div
          className="card shadow-sm p-4"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <h3 className="card-title text-center mb-3">Login</h3>
          <Form method="post" className="mt-6 ">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                name="email"
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                name="password"
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {actionData?.error ? (
              <div className="flex flex-row">
                <p className="text-red-600 mt-4 ">{actionData?.error}</p>
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </Form>
        </div>
      </div>
    </>
  );
}
