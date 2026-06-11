/** Real workshop photos — files in /public/images/workshop/ */
export type WorkshopPhotoId = "exterior" | "liftBay" | "workshopHall" | "tireService";

export type WorkshopPhoto = {
  id: WorkshopPhotoId;
  src: string;
};

export const WORKSHOP_PHOTOS: WorkshopPhoto[] = [
  { id: "exterior", src: "/images/workshop/exterior.png" },
  { id: "liftBay", src: "/images/workshop/lift-bay.png" },
  { id: "workshopHall", src: "/images/workshop/workshop-hall.png" },
  { id: "tireService", src: "/images/workshop/tire-service.png" },
];

export const WORKSHOP_HERO_PHOTO = WORKSHOP_PHOTOS[0];
