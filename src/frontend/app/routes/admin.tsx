import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState, useEffect } from "react";
import { NewUserModal } from "~/modals/newUserModal";
import { getUserId } from "~/services/session.server";
import { redirect, useLoaderData } from "react-router";

const API_ENDPOINT =
  import.meta.env.API_ENDPOINT || "http://localhost:8900/api";

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
  manager?: {
    id: number;
    firstname: string;
    surname: string;
    role: { id: number };
  };
  initialAlTotal: number;
  remainingAl: number;
};

type LoaderData = {
  token: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getUserId(request);
  if (!token) {
    return redirect("/auth/login");
  } else {
    return { token };
  }
}

export default function MyLeave() {
  const [userData, setUserData] = useState<Users[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string | number>("");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [managers, setManagers] = useState<
    { id: number; firstname: string; surname: string; role: { id: number } }[]
  >([]);
  const [modalError, setModalError] = useState("");
  const { token } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "">("");

  const fetchUsers = () => {
    fetch(`${API_ENDPOINT}/users`, {
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

  const fetchManagers = () => {
    fetch(`${API_ENDPOINT}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch managers");
        return res.json();
      })
      .then((data) => {
        setManagers(data?.data || []);
      })
      .catch((err) => console.error(err));
  };

  const fetchRoles = () => {
    fetch(`${API_ENDPOINT}/roles`, {
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

  const handleNewUser = async (user: {
    email: string;
    firstname: string;
    surname: string;
    roleId: number;
    managerId?: number | null;
    password: string;
  }) => {
    setModalError("");

    try {
      const res = await fetch(`${API_ENDPOINT}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : "Failed to create user. Please check your input.";
        setModalError(errorMessage);
        return;
      }

      await res.json();
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      setModalError("Network error. Please try again.");
    }
  };

  const deleteUser = (user: { id: number }) => {
    fetch(`${API_ENDPOINT}/users/${user.id}`, {
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
    } else if (editing?.field === "manager") {
      const selectedManager = managers.find((m) => m.id === Number(editValue));
      if (!selectedManager) {
        console.error("Invalid manager selected");
        return;
      }
      body.managerId = selectedManager.id || null;
      body.managerName = selectedManager.firstname;
      body.managerSurname = selectedManager.surname;
    } else {
      body[editing?.field!] = editValue;
    }

    fetch(`${API_ENDPOINT}/users`, {
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
    fetch(`${API_ENDPOINT}/users/${user.id}/reset-Al`, {
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
    fetchManagers();
    fetchRoles();
  }, []);

  const filteredData = userData.filter((item) => {
    const matchesSearch =
      item.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "" || item.role.id === roleFilter;

    return matchesSearch && matchesRole;
  });


  return (
    <>
      <NavBar />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border border-gray-300 rounded"
          />
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary mb-4"
            onClick={() => setShowModal(true)}
            style={{
              position: "absolute",
              right: 0,
              transform: "translateY(-50%)",
            }}
          >
            Create user
          </button>
          <NewUserModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleNewUser}
            error={modalError}
          />
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Manager</th>
                <th scope="col">Initial AL</th>
                <th scope="col">Taken AL</th>
                <th scope="col">Remaining AL</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData
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
                        startEditing(user.id, "manager", user.manager?.id || "")
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {editing?.id === user.id &&
                      editing.field === "manager" ? (
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
                          <option value={user.manager?.id} disabled>
                            {user.manager?.firstname} {user.manager?.surname}{" "}
                            (current)
                          </option>
                          {managers
                            .filter(
                              (manager) =>
                                manager.id !== user.manager?.id &&
                                manager.role.id === 2 &&
                                manager.id !== user.id
                            )
                            .map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.firstname} {manager.surname}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <>
                          {user.manager?.firstname} {user.manager?.surname}
                        </>
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
