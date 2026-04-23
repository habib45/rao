import { z } from "zod";

export const settingsUpdateSchema = z.record(
  z.string(),
  z.unknown()
);

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
