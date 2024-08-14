import { onReady } from "@xatom/core";
import { formRoutes, bookProductionRoutes } from "./routes";

onReady(() => {
  formRoutes();
  bookProductionRoutes();
});
