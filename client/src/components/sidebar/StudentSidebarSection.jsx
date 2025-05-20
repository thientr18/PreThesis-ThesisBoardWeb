import React from "react";
import { SidebarSection } from "./SidebarSection";
import studentIcon from "./assets/student-icon.svg";
import dashboardIcon from "./assets/dashboard.svg";
import configIcon from "./assets/config.svg";

export const StudentSidebarSection = () => {
  const subItems = [
    {
      label: "Dashboard",
      icon: dashboardIcon,
      onClick: () => console.log("Student -> Dashboard"),
    },
    {
      label: "Config",
      icon: configIcon,
      onClick: () => console.log("Student -> Config"),
    },
  ];

  return <SidebarSection icon={studentIcon} label="Student" subItems={subItems} />;
};
