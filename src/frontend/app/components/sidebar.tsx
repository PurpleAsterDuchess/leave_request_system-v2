type SideBarProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

export const SideBar = ({ show, setShow }: SideBarProps) => {
  if (!show) return null;

  return (
    <div className="sidebar sidebar-narrow border-end">
      <button
        type="button"
        className="btn-close right-align"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
        onClick={() => setShow(false)}
      ></button>
      <ul className="sidebar-nav">
        <li className="nav-item">
          <a className="nav-link left-align" href="#">
            <i className="nav-icon cil-speedometer"></i>
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
          <a className="nav-link left-align" href="../routes/my_leave.tsx">
            <i className="nav-icon cil-speedometer"></i>
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
            <i className="nav-icon cil-cloud-download"></i>
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
