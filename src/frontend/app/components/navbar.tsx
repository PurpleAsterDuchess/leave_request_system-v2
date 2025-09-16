export  const NavBar = () => {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#">
          <img
            src="/logo-uos.x33b19508.png"
            alt="University of Staffordshire"
            className="d-inline-block align-top"
            style={{ paddingLeft: "10px", width: "90%" }}
          />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a
                className="nav-link"
                href="http://localhost:5173/auth/logout"
                aria-controls="navbarSupportedContent"
                aria-label="Logout"
              >
                <img
                  src="/logout.png"
                  alt="logout"
                  className="me-2"
                  style={{ width: "20px", height: "20px" }}
                />
                Logout
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};
