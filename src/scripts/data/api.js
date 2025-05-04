import CONFIG from "../config";
import AuthService from "./auth-service";

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/your/endpoint/here`,
};

export async function getData() {
  const token = AuthService.getToken();

  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await fetchResponse.json();
}
