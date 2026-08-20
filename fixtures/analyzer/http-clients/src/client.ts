import customClient from "@app/api-client";
import axios from "axios";
import ky from "ky";

const api = axios.create({ baseURL: "/api" });
const productsPath = "/api/products";

export async function loadData(id: string, resource: string) {
  await fetch(productsPath);
  await fetch(`/api/products/${id}`, { method: "DELETE" });
  await fetch("/api/search?q=term#results");
  await fetch(`/api/${resource}`);
  await axios.post("/api/products", {});
  await axios.request({ method: "PATCH", url: `/api/products/${id}` });
  await api.get(`/users/${id}`);
  await ky.get("/api/products");
  await customClient.delete(`/api/products/${id}`);
  await axios.get("https://example.com/external");
  await axios.get(buildUrl());
}

function buildUrl() {
  return "/api/products";
}

const fakeClient = {
  get(_url: string) {
    void _url;
    return Promise.resolve();
  },
};

void fakeClient.get("/api/products");
