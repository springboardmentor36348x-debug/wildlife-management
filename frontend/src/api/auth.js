import client from "./client";

export const registerUser = (payload) => client.post("/api/v1/auth/register", payload);

export const loginUser = (payload) => client.post("/api/v1/auth/login", payload);

export const fetchCurrentUser = () => client.get("/api/v1/auth/me");
