import { API_KEY, API_URL } from "../constants/Environments";

export const saveScannedResult = async (body: Object) => {
  return await fetch(`${API_URL}/scanid`, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};
