import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { NewUserModal } from "~/modals/newUserModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My leave" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

type Users = {
  id: number;
  firstname: string;
  surname: string;
  email: string;
  password: string;
  role: {
    id: number;
    name: string;
  };
  initialAlTotal: number;
  remainingAl: number;
};

export default function MyLeave() {
  const [userData, setUserData] = useState<Users[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string | number>("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    if (!token)
      return console.error("No token found. User might not be logged in.");

    fetch("http://localhost:8900/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUserData(data?.data || []);
      })
      .catch((err) => console.error(err));
  };

  const fetchRoles = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:8900/api/roles", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setRoles(data?.data || []))
      .catch((err) => console.error(err));
  };

  const startEditing = (id: number, field: string, value: string | number) => {
    setEditing({ id, field });
    setEditValue(value);
  };

  const handleNewUser = (user: {
    email: string;
    firstname: string;
    surname: string;
    roleId: number;
    password: string;
  }) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8900/api/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create user");
        return res.json();
      })
      .then(() => fetchUsers())
      .catch((err) => console.error(err));
  };

  const deleteUser = (user: { id: number }) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`http://localhost:8900/api/users/${user.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete user");
        return res.json();
      })
      .then(() => fetchUsers())
      .catch((err) => console.error(err));
  };

  const saveEdit = (user: Users) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let body: Record<string, any> = { id: user.id };

    if (editing?.field === "role") {
      const selectedRole = roles.find((r) => r.id === Number(editValue));
      if (!selectedRole) {
        console.error("Invalid role selected");
        return;
      }
      body.roleId = selectedRole.id;
      body.roleName = selectedRole.name;
    } else if (editing?.field === "initialAlTotal") {
      body.initialAlTotal = Number(editValue);
    } else {
      body[editing?.field!] = editValue;
    }

    fetch(`http://localhost:8900/api/users`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update user");
        return res.json();
      })
      .then(() => {
        setEditing(null);
        fetchUsers();
      })
      .catch((err) => console.error(err));
  };

  const resetLeave = (user: { id: number }) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`http://localhost:8900/api/users/${user.id}/reset-Al`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to reset leave");
        return res.json();
      })
      .then(() => fetchUsers())
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <button
            className="btn btn-primary mb-4"
            onClick={() => setShowModal(true)}
          >
            Create user
          </button>
          <NewUserModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleNewUser}
          />
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Initial AL</th>
                <th scope="col">Taken AL</th>
                <th scope="col">Remaining AL</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {userData
                .filter((user) => user.id !== undefined && user.id !== null)
                .map((user, idx) => (
                  <tr key={user.id}>
                    <th scope="row">{idx + 1}</th>
                    <td data-toggle="tooltip" title={`${user.email}`}>
                      {user.firstname} {user.surname}
                    </td>
                    <td
                      onClick={() =>
                        startEditing(user.id, "role", user.role.id)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {editing?.id === user.id && editing.field === "role" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          onBlur={() => saveEdit(user)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(user);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          autoFocus
                          style={{ width: "80px" }}
                        >
                          <option value={user.role.id} disabled>
                            {user.role.name} (current)
                          </option>
                          {roles
                            .filter((role) => role.id !== user.role.id)
                            .map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        user.role.name
                      )}
                    </td>
                    <td
                      onClick={() =>
                        startEditing(
                          user.id,
                          "initialAlTotal",
                          user.initialAlTotal
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {editing?.id === user.id &&
                      editing.field === "initialAlTotal" ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(user)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(user);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          autoFocus
                          style={{ width: "80px" }}
                        />
                      ) : (
                        user.initialAlTotal
                      )}
                    </td>
                    <td>{user.initialAlTotal - user.remainingAl}</td>
                    <td>{user.remainingAl}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => resetLeave(user)}
                      >
                        Reset leave
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteUser(user)}
                      >
                        Delete User
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </main>
      </div>
    </>
  );
}
