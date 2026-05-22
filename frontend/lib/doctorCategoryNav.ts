import { AUDIENCE_CATEGORIES } from "@/constants/audienceCategories";
import { MEDICAL_SPECIALTY_CATEGORIES } from "@/constants/medicalSpecialtyCategories";
import { routes } from "@/constants/appRoutes";
import type { ServiceCategorySelection } from "@/types/serviceCategorySelection";
import { router } from "expo-router";

export function selectionToDoctorRouteParams(
  selection: ServiceCategorySelection,
): Record<string, string> | undefined {
  if (selection.kind === "all") return undefined;
  if (selection.kind === "audience") {
    return { filterKind: "audience", filterId: selection.id };
  }
  if (selection.kind === "specialty") {
    return { filterKind: "specialty", filterId: selection.id };
  }
  return { filterKind: "specialty", filterId: selection.name };
}

export function navigateToDoctorsWithFilter(selection: ServiceCategorySelection): void {
  const params = selectionToDoctorRouteParams(selection);
  if (!params) {
    router.push(routes.customerDoctors);
    return;
  }
  router.push({ pathname: routes.customerDoctors, params });
}

export function parseCategoryFilterFromParams(params: {
  filterKind?: string | string[];
  filterId?: string | string[];
}): ServiceCategorySelection | null {
  const kind = Array.isArray(params.filterKind) ? params.filterKind[0] : params.filterKind;
  const id = Array.isArray(params.filterId) ? params.filterId[0] : params.filterId;
  if (!kind || !id) return null;

  if (kind === "audience") {
    const item = AUDIENCE_CATEGORIES.find((c) => c.id === id);
    if (!item) return null;
    return { kind: "audience", id: item.id, label: item.label, searchQuery: item.searchQuery };
  }

  if (kind === "specialty") {
    const item = MEDICAL_SPECIALTY_CATEGORIES.find((c) => c.id === id);
    if (!item) return null;
    return { kind: "specialty", id: item.id, label: item.label, keywords: item.keywords };
  }

  return null;
}
