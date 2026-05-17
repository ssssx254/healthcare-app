import { routes } from "@/constants/appRoutes";
import { Redirect } from "expo-router";

export default function IndexScreen() {
  return <Redirect href={routes.splash} />;
}
