import type { Doctor, Store } from "@/features/admin/types";

/**
 * Demo data: the client's 5 stores and a starter panel of doctors.
 * Edit names/addresses here, or from the Admin console.
 * Doctor PINs are for the demo login only — replace with real auth in production.
 */
export function seedData(): { stores: Store[]; doctors: Doctor[] } {
  return {
    stores: [
      {
        id: "store-1",
        name: "MedConnect Pharmacy — Hampankatta",
        address: "Ground Floor, KS Rao Road, Hampankatta",
        city: "Mangaluru",
        phone: "+91 824 240 1001",
        pharmacistName: "Ramesh K",
        drugLicenseNo: "KA-DK-20B-0001",
        staffPin: "1111",
      },
      {
        id: "store-2",
        name: "MedConnect Pharmacy — Kadri",
        address: "Opp. Kadri Park, Kadri Main Road",
        city: "Mangaluru",
        phone: "+91 824 240 1002",
        pharmacistName: "Shwetha D'Souza",
        drugLicenseNo: "KA-DK-20B-0002",
        staffPin: "1111",
      },
      {
        id: "store-3",
        name: "MedConnect Pharmacy — Surathkal",
        address: "NH 66, Near NITK Circle, Surathkal",
        city: "Mangaluru",
        phone: "+91 824 240 1003",
        pharmacistName: "Abdul Rasheed",
        drugLicenseNo: "KA-DK-20B-0003",
        staffPin: "1111",
      },
      {
        id: "store-4",
        name: "MedConnect Pharmacy — Udupi",
        address: "Court Road, Near Bus Stand",
        city: "Udupi",
        phone: "+91 820 252 1004",
        pharmacistName: "Prakash Shetty",
        drugLicenseNo: "KA-UD-20B-0004",
        staffPin: "1111",
      },
      {
        id: "store-5",
        name: "MedConnect Pharmacy — Puttur",
        address: "Main Road, Near Mahalingeshwara Temple",
        city: "Puttur",
        phone: "+91 825 123 1005",
        pharmacistName: "Lavina Pinto",
        drugLicenseNo: "KA-DK-20B-0005",
        staffPin: "1111",
      },
    ],
    doctors: [
      {
        id: "doc-1",
        name: "Dr. Ananya Rao",
        specialty: "General Physician",
        qualification: "MBBS, MD (General Medicine)",
        registrationNo: "KMC 81234",
        experienceYears: 11,
        languages: ["English", "Kannada", "Hindi"],
        fee: 200,
        pin: "1234",
        status: "offline",
      },
      {
        id: "doc-2",
        name: "Dr. Mohammed Irfan",
        specialty: "General Physician",
        qualification: "MBBS, DNB (Family Medicine)",
        registrationNo: "KMC 79012",
        experienceYears: 8,
        languages: ["English", "Hindi", "Beary", "Tulu"],
        fee: 200,
        pin: "1234",
        status: "offline",
      },
      {
        id: "doc-3",
        name: "Dr. Sneha Kamath",
        specialty: "Paediatrics",
        qualification: "MBBS, DCH, MD (Paediatrics)",
        registrationNo: "KMC 85521",
        experienceYears: 9,
        languages: ["English", "Kannada", "Konkani"],
        fee: 300,
        pin: "1234",
        status: "offline",
      },
      {
        id: "doc-4",
        name: "Dr. Vikram Hegde",
        specialty: "Dermatology",
        qualification: "MBBS, MD (DVL)",
        registrationNo: "KMC 88310",
        experienceYears: 7,
        languages: ["English", "Kannada", "Tulu"],
        fee: 350,
        pin: "1234",
        status: "offline",
      },
    ],
  };
}
