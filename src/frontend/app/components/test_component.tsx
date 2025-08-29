import { useState } from "react";

type TestComponentProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

function TestComponent({ show, setShow }: TestComponentProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="offcanvas offcanvas-start show"
        tabIndex={-1}
        id="offcanvas"
        aria-labelledby="offcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasLabel">
            Navigation
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={() => setShow(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
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
              <a className="nav-link left-align" href="/my_leave">
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
                <i className="nav-icon cil-speedometer"></i>
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
      </div>
    </>
  );
}

export { TestComponent };
