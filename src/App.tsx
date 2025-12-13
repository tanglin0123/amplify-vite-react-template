import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  AppLayout,
  Header,
  SideNavigation,
  Button,
  SpaceBetween,
  Container,
  TextContent,
  TopNavigation,
} from "@cloudscape-design/components";
import "@cloudscape-design/global-styles/index.css";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [navigationOpen, setNavigationOpen] = useState(true);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content?.trim()) {
      client.models.Todo.create({ content: content.trim() });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const columnDefs = [
    {
      field: "id",
      headerName: "ID",
      flex: 1.5,
      minWidth: 240,
      cellRenderer: (params: { value: string }) => (
        <span style={{ fontFamily: "monospace", fontSize: "0.9em", color: "#333" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "content",
      headerName: "Content",
      flex: 2,
    },
    {
      field: "createdAt",
      headerName: "Created",
      flex: 1.5,
      valueFormatter: (params: { value: string | Date }) => formatDate(params.value),
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      flex: 1.5,
      valueFormatter: (params: { value: string | Date }) => formatDate(params.value),
    },
    {
      headerName: "Actions",
      flex: 0.8,
      cellRenderer: (params: { data: Schema["Todo"]["type"] }) => (
        <Button
          onClick={() => deleteTodo(params.data.id)}
          variant="inline-icon"
          iconName="close"
          ariaLabel="Delete todo"
        />
      ),
    },
  ];

  return (
    <>
      <TopNavigation
        identity={{ href: "#/", title: "Todo Manager" }}
        utilities={[
          {
            type: "button",
            text: user?.signInDetails?.loginId ?? "User",
            iconName: "user",
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
          settingsIconAriaLabel: "Settings",
          notificationIconAriaLabel: "Notifications",
          keyboardShortcutsIconAriaLabel: "Keyboard shortcuts",
          helpIconAriaLabel: "Help",
          title: "Navigation",
        }}
      />

      <AppLayout
        navigation={
          <SideNavigation
            items={[
              { type: "link", text: "All Todos", href: "#/" },
              { type: "link", text: "Completed", href: "#/completed" },
              { type: "link", text: "Pending", href: "#/pending" },
            ]}
            header={{
              href: "#/",
              text: "Todo App",
            }}
          />
        }
        content={
          <SpaceBetween size="m">
            <Container header={<Header variant="h2">Your Todos</Header>}>
              <SpaceBetween size="m" direction="vertical">
                <Button onClick={createTodo} variant="primary" iconName="add-plus">
                  Create Todo
                </Button>
                <div className="ag-theme-quartz" style={{ height: "600px", width: "100%" }}>
                  <AgGridReact
                    rowData={todos}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={10}
                    suppressPropertyNamesCheck={true}
                    autoSizeStrategy={{
                      type: "fitGridWidth",
                    }}
                  />
                </div>
              </SpaceBetween>
            </Container>
            <Container>
              <TextContent>
                <p>
                  🥳 App successfully hosted. Try creating a new todo or managing your existing ones.
                </p>
              </TextContent>
            </Container>
          </SpaceBetween>
        }
        contentType="default"
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      />
    </>
  );
}

export default App;
