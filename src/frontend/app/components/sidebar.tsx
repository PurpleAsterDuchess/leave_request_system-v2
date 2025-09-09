import React from "react";

export const SideBar = () => {
  return (
    <div className="sidebar border-end">
      <ul className="sidebar-nav">
        <li className="nav-item">
          <a className="nav-link left-align" href="#">
            <img
              src="/dashboard.png"
              height="30"
              alt="Dashboard"
              className="d-inline-block align-top"
            />
            <p className="right-align">Dashboard</p>
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link left-align" href="/my_leave">
            <img
              src="/user.png"
              height="30"
              alt="My leave"
              className="d-inline-block align-top"
            />
            <p className="right-align">My Leave</p>
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link left-align" href="#">
            <img
              src="/group.png"
              height="30"
              alt="Team leave"
              className="d-inline-block align-top"
            />
            <p className="right-align">Team Leave</p>
          </a>
        </li>
      </ul>
    </div>
  );
};
