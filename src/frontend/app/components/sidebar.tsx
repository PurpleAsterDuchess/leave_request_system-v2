import React, { useState } from "react";

type SideBarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export const SideBar = ({ collapsed, setCollapsed }: SideBarProps) => {
  if (!collapsed) return null;

  return (
    <div className={`sidebar border-end${collapsed ? " collapsed" : ""}`}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ margin: "10px" }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>
      <ul className="sidebar-nav">
        <li className="nav-item">
          <a className="nav-link left-align" href="#">
            <img
              src="/dashboard.png"
              height="30"
              alt="Dashboard"
              className="d-inline-block align-top"
            />
            {!collapsed && <p className="right-align">Dashboard</p>}
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link left-align" href="/my_leave">
            <i className="nav-icon cil-speedometer"></i>
            <img
              src="/user.png"
              height="30"
              alt="My leave"
              className="d-inline-block align-top"
            />
            {!collapsed && <p className="right-align">My Leave</p>}
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
            {!collapsed && <p className="right-align">Team Leave</p>}
          </a>
        </li>
      </ul>
    </div>
  );
};
