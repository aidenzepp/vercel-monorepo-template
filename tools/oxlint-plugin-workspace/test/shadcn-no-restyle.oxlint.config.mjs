import workspaceConfig from "../../../oxlint.config.ts";

/**
 * The production no-restyle policy exercised without unrelated lint rules.
 */
const noRestyleRule = workspaceConfig.rules?.["shadcn/no-restyle"];

export default {
  ignorePatterns: [],
  jsPlugins: (workspaceConfig.jsPlugins ?? []).map((plugin) =>
    plugin === "./tools/oxlint-plugin-workspace/index.mjs"
      ? "../index.mjs"
      : plugin
  ),
  options: {
    typeAware: false,
  },
  plugins: [],
  rules:
    noRestyleRule === undefined ? {} : { "shadcn/no-restyle": noRestyleRule },
  settings: workspaceConfig.settings,
};
