/* eslint-disable @typescript-eslint/no-explicit-any */
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
  [x: string]: any;
  scheduled: ScheduledStatus;
  address: string;
  appointmentDate: string;
  appointmentTime: string;
  hoursBeforeArrival: string;
}
