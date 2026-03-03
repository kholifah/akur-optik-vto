import type { NextConfig } from "next";
import path from "path";

const threePath = path.resolve(process.cwd(), "node_modules/three");
const threeAlias = "./node_modules/three";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    resolveAlias: {
      three: threeAlias,
      "three/examples/jsm": `${threeAlias}/examples/jsm`,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      three: threePath,
      "three/examples/jsm": path.join(threePath, "examples/jsm"),
    };
    return config;
  },
};

export default nextConfig;
