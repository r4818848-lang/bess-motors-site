export interface VinDecodeResult {
  make: string;
  model: string;
  engine: string;
  engineVolume: string;
  trim: string;
  power: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  year: string;
  found: boolean;
}

const vinDatabase: Record<string, VinDecodeResult> = {
  WBA: {
    make: "BMW",
    model: "Seria 3",
    engine: "2.0",
    engineVolume: "2.0L",
    trim: "M Sport",
    power: "190 HP",
    transmission: "Automatic",
    drivetrain: "RWD",
    fuelType: "Petrol",
    year: "2019",
    found: true,
  },
  WDB: {
    make: "Mercedes-Benz",
    model: "C-Class",
    engine: "2.0 CDI",
    engineVolume: "2.0L",
    trim: "AMG Line",
    power: "194 HP",
    transmission: "9G-Tronic",
    drivetrain: "RWD",
    fuelType: "Diesel",
    year: "2020",
    found: true,
  },
  WP0: {
    make: "Porsche",
    model: "911",
    engine: "3.0 Twin-Turbo",
    engineVolume: "3.0L",
    trim: "Carrera S",
    power: "450 HP",
    transmission: "PDK",
    drivetrain: "RWD",
    fuelType: "Petrol",
    year: "2021",
    found: true,
  },
  WVW: {
    make: "Volkswagen",
    model: "Golf",
    engine: "2.0 TDI",
    engineVolume: "2.0L",
    trim: "GTD",
    power: "184 HP",
    transmission: "DSG",
    drivetrain: "FWD",
    fuelType: "Diesel",
    year: "2018",
    found: true,
  },
};

const empty: VinDecodeResult = {
  make: "",
  model: "",
  engine: "",
  engineVolume: "",
  trim: "",
  power: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  year: "",
  found: false,
};

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  await new Promise((r) => setTimeout(r, 600));
  const prefix = vin.slice(0, 3).toUpperCase();
  const match = vinDatabase[prefix];
  if (match && vin.length >= 11) {
    return { ...match, found: true };
  }
  return { ...empty };
}
