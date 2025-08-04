export interface ScheduledQmeRecord {
  id: string;
  date: string;
  caseNumber: string;
  applicantName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  earlyArrivalTime: string;
  address: string;
  scheduled: boolean;
}

export interface QmeRecord {
  id: string;
  date: string;
  caseNumber: string;
  applicantName: string;
  doctorName: string;
  phoneNumber: string;
  interpreterRequired: boolean;
  contactPerson: string;
  contactEmail: string;
}
