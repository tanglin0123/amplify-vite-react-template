import { useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  AppLayout,
  SideNavigation,
  TopNavigation,
  Container,
  TextContent,
  Header,
} from "@cloudscape-design/components";
import "@cloudscape-design/global-styles/index.css";
import "./App.css";
import { TaskManagement } from "./modules/TaskManagement";
import { PlanningAnalytics } from "./modules/PlanningAnalytics";
import { DataProcessing } from "./modules/DataProcessing";

type ModuleType = "home" | "task-management" | "planning-analytics" | "data-processing";

function App() {
  const { user, signOut } = useAuthenticator();
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [currentModule, setCurrentModule] = useState<ModuleType>("home");
  const [utcMode, setUtcMode] = useState<Set<string>>(new Set());
  

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopNavigation
        identity={{ 
          href: "#/", 
          title: "MyWorkspace",
          logo: {
            src: "https://github.com/tanglin0123.png",
            alt: "MyWorkspace Logo"
          }
        }}
        utilities={[
          {
            type: "button",
            text: user?.signInDetails?.loginId ?? "User",
            iconName: "user-profile",
            ariaLabel: "Current user",
          },
          {
            type: "button",
            text: "Logout",
            iconName: "external",
            ariaLabel: "Logout",
            onClick: signOut,
          },
        ]}
        i18nStrings={{
          overflowMenuTitleText: "All",
          overflowMenuTriggerText: "More",
          searchDismissIconAriaLabel: "Close search",
          searchIconAriaLabel: "Search",
        }}
      />

      <main style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1 }}>
          <AppLayout
            navigation={
              <SideNavigation
                activeHref={currentModule === "task-management" ? "#/task-management" : currentModule === "planning-analytics" ? "#/planning-analytics" : currentModule === "data-processing" ? "#/data-processing" : "#/"}
                onFollow={(event) => {
                  event.preventDefault();
                  if (event.detail.href === "#/") setCurrentModule("home");
                  else if (event.detail.href === "#/task-management") setCurrentModule("task-management");
                  else if (event.detail.href === "#/planning-analytics") setCurrentModule("planning-analytics");
                  else if (event.detail.href === "#/data-processing") setCurrentModule("data-processing");
                }}
                items={[
                  { type: "link", text: "Task Management", href: "#/task-management" },
                  { type: "link", text: "Planning & Analytics", href: "#/planning-analytics" },
                  { type: "link", text: "Data Processing", href: "#/data-processing" },
                ]}
                header={{
                  href: "#/",
                  text: "Modules",
                }}
              />
            }
            content={
              currentModule === "home" ? (
                <Container header={<Header variant="h1">Welcome to MyWorkspace</Header>}>
                  <TextContent>
                    <p>Select a module from the navigation to get started.</p>
                  </TextContent>
                </Container>
              ) : currentModule === "task-management" ? <TaskManagement utcMode={utcMode} setUtcMode={setUtcMode} onNavigateHome={() => setCurrentModule("home")} /> : currentModule === "planning-analytics" ? <PlanningAnalytics onNavigateHome={() => setCurrentModule("home")} /> : <DataProcessing onNavigateHome={() => setCurrentModule("home")} />
            }
            contentType="default"
            navigationOpen={navigationOpen}
            onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          />
        </div>
        <footer style={{ padding: "0 2rem 2rem 2rem", marginTop: "auto", width: "100%", boxSizing: "border-box" }}>
          <Container>
            <TextContent>
              <p>
                © 2025 MyWorkspace. All rights reserved.
              </p>
            </TextContent>
          </Container>
        </footer>
      </main>
    </div>
  );
}

export default App;
