import Cookies from "js-cookie";
import { createStorage } from "wagmi";

export const cookieStorage = createStorage({
  storage: {
    async getItem(key) {
      return Cookies.get(key);
    },
    async setItem(key, value) {
      Cookies.set(key, value, {
        // make this cookie visible on all subdomains:
        domain: "localhost",
        path: "/",
        // adjust as needed for your security requirements:
        secure: true,
        sameSite: "lax",
      });
    },
    async removeItem(key) {
      Cookies.remove(key, {
        domain: "localhost",
        path: "/",
      });
    },
  },
});
