import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

const mockApplyPolyfills = () => {
  return {
    name: 'mock-apply-polyfills',
    transform(code, id) {
      if (id.includes('astro/dist/core/app/entrypoints/node.js')) {
        return {
          code: code + '\nexport const applyPolyfills = () => {};\n',
          map: null
        };
      }
    }
  };
};

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [tailwind()],
  server: { port: 4321, host: true },
  vite: {
    envDir: "../../",
    plugins: [mockApplyPolyfills()]
  },
});
