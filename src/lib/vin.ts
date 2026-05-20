export interface VinDecodeResult {
  make: string;
  model: string;
  engine: string;
  trim: string;
  power: string;
  transmission: string;
  found: boolean;
}

const vinDatabase: Record<string, VinDecodeResult> = {
  WBA: {
    make: "BMW",
    model: "Seria 3",
    engine: "2.0",
    trim: "M Sport",
    power: "190 HP",
    transmission: "Automatic",
    found: true,
  },
  WDB: {
    make: "Mercedes-Benz",
    model: "C-Class",
    engine: "2.0 CDI",
    trim: "AMG Line",
    power: "194 HP",
    transmission: "9G-Tronic",
    found: true,
  },
  WP0: {
    make: "Porsche",
    model: "911",
    engine: "3.0 Twin-Turbo",
    trim: "Carrera S",
    power: "450 HP",
    transmission: "PDK",
    found: true,
  },
  WVW: {
    make: "Volkswagen",
    model: "Golf",
    engine: "2.0 TDI",
    trim: "GTD",
    power: "184 HP",
    transmission: "DSG",
    found: true,
  },
};

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  await new Promise((r) => setTimeout(r, 600));
  const prefix = vin.slice(0, 3).toUpperCase();
  const match = vinDatabase[prefix];
  if (match && vin.length >= 11) {
    return { ...match, found: true };
  }
  return {
    make: "",
    model: "",
    engine: "",
    trim: "",
    power: "",
    transmission: "",
    found: false,
  };
}
