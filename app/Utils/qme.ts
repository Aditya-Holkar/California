export interface QmeRecord {
  id: string;
  date: string;
  caseNumber: string;
  applicantName: string;
  doctorName: string;
  phoneNumber: string;
  contactPerson: string;
  contactEmail: string;
  interpreterRequired: boolean;
}

export type ScheduledStatus = "Yes" | "No" | "Cancelled";

export interface ExtendedQmeRecord extends QmeRecord {
  scheduled: ScheduledStatus;
  address: string;
  appointmentDate: string;
  appointmentTime: string;
  hoursBeforeArrival: string;
}
