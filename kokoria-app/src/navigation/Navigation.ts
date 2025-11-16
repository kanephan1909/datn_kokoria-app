import React from "react";
import { RootStackParamList } from "./Routes";
import { NavigationContainerRef } from "@react-navigation/native";
import { NavigationState } from "@react-navigation/routers";
import Logger from "../utils/Logger";

export const navigationRef = React.createRef<NavigationContainerRef <RootStackParamList>>();

// Function to parse and log the current route
export function parseAndLogRoute(state:NavigationState | undefined) {
    if(!state) return;
    const {routes ,index} = state;
    const currentRoute = routes[index];
    Logger.info("Current Route:", {name:currentRoute?.name, params:currentRoute?.params});
}  

// Function to set the navigation ready state
export function setIsNavigationReady() {
    Logger.info("Navigation is ready");
}