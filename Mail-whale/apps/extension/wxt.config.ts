import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Mail Whale",
    description:
      "Learn your email writing style and generate replies in your voice",
    permissions: ["identity", "sidePanel", "storage", "activeTab"],
    oauth2: {
      client_id: "PLACEHOLDER.apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    },
    side_panel: {
      default_path: "sidepanel/index.html",
    },
    host_permissions: [
      "https://mail.google.com/*",
      "https://outlook.live.com/*",
      "https://outlook.office.com/*",
    ],
  },
});
