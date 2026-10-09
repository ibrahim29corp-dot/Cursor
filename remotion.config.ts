import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setOverwriteOutput(true);
Config.overrideBundlerConfig((currentConfiguration) => {
  return enableTailwind(currentConfiguration);
});
