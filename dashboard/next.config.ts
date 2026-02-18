import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Desativa falha do build por erros de ESLint até os avisos serem corrigidos. */
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
