import type { VehicleBodyType } from "./vehicle-visual";

export interface StockPhotoMatch {
  make: RegExp;
  model: RegExp;
  /** Wikimedia Commons — no watermarks, free to use */
  url: string;
  bodyType?: VehicleBodyType;
}

/**
 * Curated stock photos (Wikimedia Commons). Matched top-down; first hit wins.
 * Generic brand fallbacks are last within each brand group.
 */
export const VEHICLE_STOCK_PHOTOS: StockPhotoMatch[] = [
  // BMW
  { make: /bmw/i, model: /\bm5\b|f90/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2018_BMW_M5_%28F90%29_Front.jpg/1280px-2018_BMW_M5_%28F90%29_Front.jpg", bodyType: "sport" },
  { make: /bmw/i, model: /\bm3\b|f80|g80/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/2018_BMW_M3_%28F80%29_CS_2.jpg/1280px-2018_BMW_M3_%28F80%29_CS_2.jpg", bodyType: "sport" },
  { make: /bmw/i, model: /\bm4\b|f82|g82/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2015_BMW_M4_%28F82%29_Coupe_2.jpg/1280px-2015_BMW_M4_%28F82%29_Coupe_2.jpg", bodyType: "sport" },
  { make: /bmw/i, model: /\bx5\b|f15|g05/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019_BMW_X5_%28G05%29_xDrive40i_1.jpg/1280px-2019_BMW_X5_%28G05%29_xDrive40i_1.jpg", bodyType: "suv" },
  { make: /bmw/i, model: /\bx3\b|g01/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/2018_BMW_X3_%28G01%29_xDrive20d_1.jpg/1280px-2018_BMW_X3_%28G01%29_xDrive20d_1.jpg", bodyType: "suv" },
  { make: /bmw/i, model: /3[\s-]?series|320|330|340|g20/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2019_BMW_330i_%28G20%29_1.jpg/1280px-2019_BMW_330i_%28G20%29_1.jpg", bodyType: "sedan" },
  { make: /bmw/i, model: /5[\s-]?series|520|530|540|g30/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2017_BMW_530e_iPerformance_%28G30%29_1.jpg/1280px-2017_BMW_530e_iPerformance_%28G30%29_1.jpg", bodyType: "sedan" },
  { make: /bmw/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/BMW_logo_%28gray%29.svg/512px-BMW_logo_%28gray%29.svg.png", bodyType: "sedan" },

  // Mercedes-Benz
  { make: /mercedes/i, model: /c[\s-]?class|c200|c300|c43|w205|w206/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2019_Mercedes-Benz_C220d_AMG_Line_Premium_%2B_Automatic_2.0_Front.jpg/1280px-2019_Mercedes-Benz_C220d_AMG_Line_Premium_%2B_Automatic_2.0_Front.jpg", bodyType: "sedan" },
  { make: /mercedes/i, model: /e[\s-]?class|e200|e300|w213/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/2017_Mercedes-Benz_E220d_AMG_Line_%28W213%29_1.jpg/1280px-2017_Mercedes-Benz_E220d_AMG_Line_%28W213%29_1.jpg", bodyType: "sedan" },
  { make: /mercedes/i, model: /s[\s-]?class|s500|w222|w223/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2018_Mercedes-Benz_S450_%28W222%29_1.jpg/1280px-2018_Mercedes-Benz_S450_%28W222%29_1.jpg", bodyType: "sedan" },
  { make: /mercedes/i, model: /gle|w167/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/2019_Mercedes-Benz_GLE_350_de_4MATIC_%28V167%29_1.jpg/1280px-2019_Mercedes-Benz_GLE_350_de_4MATIC_%28V167%29_1.jpg", bodyType: "suv" },
  { make: /mercedes/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/512px-Mercedes-Logo.svg.png", bodyType: "sedan" },

  // Audi
  { make: /audi/i, model: /a4|b9/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2019_Audi_A4_40_TFSI_S_line_1.jpg/1280px-2019_Audi_A4_40_TFSI_S_line_1.jpg", bodyType: "sedan" },
  { make: /audi/i, model: /a6|c8/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Audi_A6_50_TDI_quattro_S_line_1.jpg/1280px-2019_Audi_A6_50_TDI_quattro_S_line_1.jpg", bodyType: "sedan" },
  { make: /audi/i, model: /q5|fy/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/2018_Audi_Q5_40_TDI_quattro_S_line_1.jpg/1280px-2018_Audi_Q5_40_TDI_quattro_S_line_1.jpg", bodyType: "suv" },
  { make: /audi/i, model: /rs6|c8/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/2020_Audi_RS6_Avant_1.jpg/1280px-2020_Audi_RS6_Avant_1.jpg", bodyType: "sport" },
  { make: /audi/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Audi_logo_detail.svg/512px-Audi_logo_detail.svg.png", bodyType: "sedan" },

  // Porsche
  { make: /porsche/i, model: /911|992/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Porsche_911_Carrera_S_%28992%29_IMG_5113.jpg/1280px-Porsche_911_Carrera_S_%28992%29_IMG_5113.jpg", bodyType: "sport" },
  { make: /porsche/i, model: /cayenne/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2019_Porsche_Cayenne_S_1.jpg/1280px-2019_Porsche_Cayenne_S_1.jpg", bodyType: "suv" },
  { make: /porsche/i, model: /macan/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Porsche_Macan_S_1.jpg/1280px-2019_Porsche_Macan_S_1.jpg", bodyType: "suv" },
  { make: /porsche/i, model: /taycan/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Porsche_Taycan_4S_IMG_4183.jpg/1280px-Porsche_Taycan_4S_IMG_4183.jpg", bodyType: "sport" },
  { make: /porsche/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Porsche_logo.svg/512px-Porsche_logo.svg.png", bodyType: "sport" },

  // Ferrari
  { make: /ferrari/i, model: /roma/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Ferrari_Roma_IMG_5313.jpg/1280px-Ferrari_Roma_IMG_5313.jpg", bodyType: "sport" },
  { make: /ferrari/i, model: /488|f8/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Ferrari_F8_Tributo_IMG_5298.jpg/1280px-Ferrari_F8_Tributo_IMG_5298.jpg", bodyType: "sport" },
  { make: /ferrari/i, model: /812|superfast/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Ferrari_812_Superfast_IMG_5301.jpg/1280px-Ferrari_812_Superfast_IMG_5301.jpg", bodyType: "sport" },
  { make: /ferrari/i, model: /portofino/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ferrari_Portofino_M_IMG_5305.jpg/1280px-Ferrari_Portofino_M_IMG_5305.jpg", bodyType: "sport" },
  { make: /ferrari/i, model: /sf90/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ferrari_SF90_Stradale_IMG_5299.jpg/1280px-Ferrari_SF90_Stradale_IMG_5299.jpg", bodyType: "sport" },
  { make: /ferrari/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ferrari-Logo.svg/512px-Ferrari-Logo.svg.png", bodyType: "sport" },

  // Lamborghini
  { make: /lamborghini/i, model: /hurac/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Lamborghini_Hurac%C3%A1n_EVO_IMG_5306.jpg/1280px-Lamborghini_Hurac%C3%A1n_EVO_IMG_5306.jpg", bodyType: "sport" },
  { make: /lamborghini/i, model: /urus/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lamborghini_Urus_IMG_5307.jpg/1280px-Lamborghini_Urus_IMG_5307.jpg", bodyType: "suv" },
  { make: /lamborghini/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Lamborghini_Logo.svg/512px-Lamborghini_Logo.svg.png", bodyType: "sport" },

  // Volkswagen
  { make: /volkswagen|vw/i, model: /golf|mk8|mk7/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2020_Volkswagen_Golf_1.5_TSI_R-Line_1.jpg/1280px-2020_Volkswagen_Golf_1.5_TSI_R-Line_1.jpg", bodyType: "hatch" },
  { make: /volkswagen|vw/i, model: /passat|b8/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Volkswagen_Passat_1.5_TSI_Elegance_1.jpg/1280px-2019_Volkswagen_Passat_1.5_TSI_Elegance_1.jpg", bodyType: "sedan" },
  { make: /volkswagen|vw/i, model: /tiguan/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2018_Volkswagen_Tiguan_R-Line_1.jpg/1280px-2018_Volkswagen_Tiguan_R-Line_1.jpg", bodyType: "suv" },
  { make: /volkswagen|vw/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/512px-Volkswagen_logo_2019.svg.png", bodyType: "hatch" },

  // Toyota
  { make: /toyota/i, model: /corolla/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Toyota_Corolla_Hybrid_Design_1.jpg/1280px-2019_Toyota_Corolla_Hybrid_Design_1.jpg", bodyType: "sedan" },
  { make: /toyota/i, model: /rav4/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2019_Toyota_RAV4_Hybrid_Design_1.jpg/1280px-2019_Toyota_RAV4_Hybrid_Design_1.jpg", bodyType: "suv" },
  { make: /toyota/i, model: /camry/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2018_Toyota_Camry_XSE_V6_1.jpg/1280px-2018_Toyota_Camry_XSE_V6_1.jpg", bodyType: "sedan" },
  { make: /toyota/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Toyota_logo.svg/512px-Toyota_logo.svg.png", bodyType: "sedan" },

  // Ford
  { make: /ford/i, model: /focus/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Ford_Focus_ST-Line_1.jpg/1280px-2019_Ford_Focus_ST-Line_1.jpg", bodyType: "hatch" },
  { make: /ford/i, model: /mustang/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2018_Ford_Mustang_GT_1.jpg/1280px-2018_Ford_Mustang_GT_1.jpg", bodyType: "sport" },
  { make: /ford/i, model: /.*/, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/512px-Ford_logo_flat.svg.png", bodyType: "sedan" },

  // Land Rover / Jaguar
  { make: /land rover|range rover/i, model: /range rover|evoque|velar/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Land_Rover_Range_Rover_Evoque_1.jpg/1280px-2019_Land_Rover_Range_Rover_Evoque_1.jpg", bodyType: "suv" },
  { make: /jaguar/i, model: /f-?type|f type/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2016_Jaguar_F-Type_R_Coup%C3%A9_1.jpg/1280px-2016_Jaguar_F-Type_R_Coup%C3%A9_1.jpg", bodyType: "sport" },

  // Volvo
  { make: /volvo/i, model: /xc90/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Volvo_XC90_T8_R-Design_1.jpg/1280px-2019_Volvo_XC90_T8_R-Design_1.jpg", bodyType: "suv" },
  { make: /volvo/i, model: /xc60/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2018_Volvo_XC60_T5_R-Design_1.jpg/1280px-2018_Volvo_XC60_T5_R-Design_1.jpg", bodyType: "suv" },

  // Skoda / SEAT
  { make: /skoda/i, model: /octavia/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2020_Skoda_Octavia_SE_L_1.5_TSI_1.jpg/1280px-2020_Skoda_Octavia_SE_L_1.5_TSI_1.jpg", bodyType: "sedan" },
  { make: /seat/i, model: /leon/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2020_SEAT_Leon_FR_1.5_TSI_1.jpg/1280px-2020_SEAT_Leon_FR_1.5_TSI_1.jpg", bodyType: "hatch" },

  // Tesla
  { make: /tesla/i, model: /model 3|model3/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2019_Tesla_Model_3_Performance_AWD_Front.jpg/1280px-2019_Tesla_Model_3_Performance_AWD_Front.jpg", bodyType: "sedan" },
  { make: /tesla/i, model: /model y|modely/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2021_Tesla_Model_Y_Long_Range_AWD_1.jpg/1280px-2021_Tesla_Model_Y_Long_Range_AWD_1.jpg", bodyType: "suv" },
  { make: /tesla/i, model: /model s|models/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2021_Tesla_Model_S_Long_Range_1.jpg/1280px-2021_Tesla_Model_S_Long_Range_1.jpg", bodyType: "sedan" },

  // Lexus
  { make: /lexus/i, model: /rx/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2019_Lexus_RX_450h_L_1.jpg/1280px-2019_Lexus_RX_450h_L_1.jpg", bodyType: "suv" },

  // Honda / Hyundai / Kia
  { make: /honda/i, model: /civic/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2022_Honda_Civic_EX_1.jpg/1280px-2022_Honda_Civic_EX_1.jpg", bodyType: "sedan" },
  { make: /hyundai/i, model: /tucson/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2021_Hyundai_Tucson_Ultimate_1.jpg/1280px-2021_Hyundai_Tucson_Ultimate_1.jpg", bodyType: "suv" },
  { make: /kia/i, model: /sportage/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2022_Kia_Sportage_GT-Line_1.jpg/1280px-2022_Kia_Sportage_GT-Line_1.jpg", bodyType: "suv" },

  // Renault / Peugeot / Citroën / Opel
  { make: /renault/i, model: /clio/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2020_Renault_Clio_Intens_1.0_TCE_1.jpg/1280px-2020_Renault_Clio_Intens_1.0_TCE_1.jpg", bodyType: "hatch" },
  { make: /peugeot/i, model: /308/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/2022_Peugeot_308_GT_1.jpg/1280px-2022_Peugeot_308_GT_1.jpg", bodyType: "hatch" },
  { make: /opel/i, model: /astra/i, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/2022_Opel_Astra_Edition_1.jpg/1280px-2022_Opel_Astra_Edition_1.jpg", bodyType: "hatch" },
];

export function resolveStockPhotoUrl(vehicle: {
  make?: string;
  model?: string;
  trim?: string;
}): { url: string; bodyType?: VehicleBodyType } | null {
  const make = vehicle.make?.trim() || "";
  const text = `${vehicle.model ?? ""} ${vehicle.trim ?? ""}`.trim();
  if (!make) return null;

  for (const entry of VEHICLE_STOCK_PHOTOS) {
    if (entry.make.test(make) && entry.model.test(text || vehicle.model || "")) {
      return { url: entry.url, bodyType: entry.bodyType };
    }
  }
  return null;
}

/** Logo-only URLs should use SVG render instead of tiny logo image */
export function isLogoStockUrl(url: string): boolean {
  return /logo|Logo|\.svg/i.test(url);
}
