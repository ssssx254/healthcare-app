type PatientNote = {
  id: string;
  bookingId: string;
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  diagnosis: string;
  advice: string;
  treatment: string;
  createdAtIso: string;
};

const notes: PatientNote[] = [];

export function addProviderPatientNote(note: Omit<PatientNote, "id" | "createdAtIso">): PatientNote {
  const next: PatientNote = {
    ...note,
    id: `note-${Date.now()}`,
    createdAtIso: new Date().toISOString(),
  };
  notes.unshift(next);
  return next;
}

export function listProviderPatientNotes(): PatientNote[] {
  return [...notes];
}

export function listProviderPatientNotesByPatient(patientName?: string): PatientNote[] {
  if (!patientName) return [];
  return notes.filter((n) => n.patientName === patientName);
}

