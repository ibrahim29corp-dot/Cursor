import { createContext, useContext } from "react";

export const EnergyContext = createContext(0);

export const useEnergy = () => useContext(EnergyContext);
