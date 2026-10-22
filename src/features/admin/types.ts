export type DoctorStatus = "online" | "busy" | "offline";

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  pharmacistName: string;
  drugLicenseNo: string;
  staffPin: string;
}

/** Store as sent to clients — never includes the staff PIN. */
export type PublicStore = Omit<Store, "staffPin">;

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  registrationNo: string;
  experienceYears: number;
  languages: string[];
  fee: number;
  pin: string;
  status: DoctorStatus;
  lastSeenAt?: string;
}

/** Doctor as sent to clients — never includes the PIN. */
export type PublicDoctor = Omit<Doctor, "pin">;

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
