interface HttpClient {
  get(url: string): Promise<unknown>;
  post(url: string, data?: unknown): Promise<unknown>;
  patch(url: string, data?: unknown): Promise<unknown>;
  delete(url: string): Promise<unknown>;
  request(config: { method: string; url: string }): Promise<unknown>;
}

declare module "axios" {
  interface AxiosClient extends HttpClient {
    (urlOrConfig: string | { method: string; url: string }): Promise<unknown>;
    create(config: { baseURL?: string }): HttpClient;
  }

  const axios: AxiosClient;
  export default axios;
}

declare module "ky" {
  const ky: HttpClient;
  export default ky;
}

declare module "@app/api-client" {
  const apiClient: HttpClient;
  export default apiClient;
}
