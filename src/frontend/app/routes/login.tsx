import type { Route } from "./+types/home";
import { NavBar } from "../components/navbar";
import { SideBar } from "../components/sidebar";
import { LeaveCards } from "../components/leave_cards";
import { useState } from "react";
import axios from 'axios';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Login() {
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        email,
        password,
      });
      const { token, user: userObj } = response.data;
      login(userObj, token);


  return (
    <>
    this is a login page
      </>
  );
}
