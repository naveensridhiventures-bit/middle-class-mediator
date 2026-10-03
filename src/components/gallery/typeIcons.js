import { House, Building2, MapPinned, Store } from "lucide-react";
import { typeKind } from "../../lib/gallery";

const ICONS = { house: House, apartment: Building2, plot: MapPinned, commercial: Store };

/** The icon for a property type (house, apartment, plot or commercial). */
export const iconForType = (t) => ICONS[typeKind(t)] || House;
