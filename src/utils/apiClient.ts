const API_ENDPOINT = "https://zwmqhpv6ul.execute-api.us-west-2.amazonaws.com/prod/";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  retries?: number;
  retryDelayMs?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_ENDPOINT) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      retries = 0,
      retryDelayMs = 500,
    } = options;

    const url = new URL(endpoint, this.baseUrl).toString();

    const attempt = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        // Try to parse JSON; if it fails, fallback to text
        let data: any = undefined;
        try {
          data = await response.json();
        } catch (_) {
          const text = await response.text();
          data = text ? { text } : undefined;
        }

        return {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: !response.ok ? (data?.message || response.statusText) : undefined,
          status: response.status,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
          status: 0,
        };
      }
    };

    let last: ApiResponse<T> = await attempt();
    let remaining = retries;
    while (!last.success && remaining > 0) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      last = await attempt();
      remaining -= 1;
    }
    return last;
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
