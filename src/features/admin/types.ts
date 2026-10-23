export type DoctorStatus = "online" | "busy" | "offline";

/** Store from the shared billing `stores` table (GET /api/tele/stores). */
export interface PublicStore {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  pharmacistName: string;
  drugLicenseNo: string;
  gstin: string;
}

/** Doctor from tele_doctors (GET /api/tele/doctors). phone / email / isActive only for the owner. */
export interface PublicDoctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  registrationNo: string;
  experienceYears: number;
  languages: string[];
  fee: number;
  status: DoctorStatus;
  lastSeenAt?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface StoreStat {
  storeId: string;
  name: string;
  city: string;
  total: number;
  completed: number;
  waiting: number;
}

export interface AdminStats {
  today: {
    total: number;
    completed: number;
    cancelled: number;
    waiting: number;
    inCall: number;
    prescriptions: number;
    avgWaitMin: number;
    avgCallMin: number;
    consultationFees: number;
  };
  doctorsOnline: number;
  doctorsTotal: number;
  byStore: StoreStat[];
}
