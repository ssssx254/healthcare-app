/** Эмнэлгийн байгууллагын бүрэн мэдээлэл. */
export type Clinic = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  description: string;
  doctorsCount: number;
};

/** Жагсаалт, хайлтын товч харагдац. */
export type ClinicListItem = Pick<Clinic, "id" | "name" | "city" | "doctorsCount">;

/** Эмнэлгийн талын ажлын орчинд хадгалах төлөв (бүртгэлийн төлөв). */
export type ClinicWorkspaceState = Clinic & {
  registered: boolean;
};
