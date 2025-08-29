import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My leave" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function MyLeave() {
  const [showOffcanvas, setShowOffcanvas] = useState(true);

  return (
    <>
      <NavBar />
      <SideBar show={showOffcanvas} setShow={setShowOffcanvas} />
    </>
  );
}
