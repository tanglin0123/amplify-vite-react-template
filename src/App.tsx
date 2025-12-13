import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
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
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "completed") return todo.state === "completed";
    if (filter === "pending") return todo.state === "pending" || !todo.state;
    return true; // "all" shows everything
  });

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content?.trim()) {
      client.models.Todo.create({ content: content.trim() });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function toggleTodoState(id: string, currentState: string | null | undefined) {
    const newState = currentState === "completed" ? "pending" : "completed";
    client.models.Todo.update({ id, state: newState });
  }

  function updateTodoContent(id: string, content: string) {
    if (content.trim()) {
      client.models.Todo.update({ id, content: content.trim() });
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString();
  };
  const columnDefs: ColDef<Schema["Todo"]["type"]>[] = [
    {
      field: "id" as const,
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
      field: "content" as const,
      headerName: "Content",
      flex: 2,
      editable: true,
      onCellValueChanged: (params) => {
        if (params.data?.id && params.newValue !== params.oldValue) {
          updateTodoContent(params.data.id, params.newValue);
        }
      },
    },
    {
      field: "state" as const,
      headerName: "State",
      flex: 1,
      cellRenderer: (params: ICellRendererParams<Schema["Todo"]["type"]>) => {
        const state = params.value || "pending";
        const id = params.data?.id;
        return (
          <Button
            variant="inline-link"
            onClick={() => id && toggleTodoState(id, state)}
          >
            <span style={{ 
              padding: "4px 8px", 
              borderRadius: "4px",
              backgroundColor: state === "completed" ? "#d4edda" : "#fff3cd",
              color: state === "completed" ? "#155724" : "#856404",
              fontWeight: 500,
              cursor: "pointer",
            }}>
              {state === "completed" ? "Completed" : "Pending"}
            </span>
          </Button>
        );
      },
    },
    {
      field: "createdAt" as const,
      headerName: "Created",
      flex: 1.5,
      valueFormatter: (params: { value: string | Date }) => formatDate(params.value),
    },
    {
      field: "updatedAt" as const,
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

      <AppLayout
        navigation={
          <SideNavigation
            activeHref={filter === "all" ? "#/" : filter === "completed" ? "#/completed" : "#/pending"}
            onFollow={(event) => {
              event.preventDefault();
              if (event.detail.href === "#/") setFilter("all");
              else if (event.detail.href === "#/completed") setFilter("completed");
              else if (event.detail.href === "#/pending") setFilter("pending");
            }}
            items={[
              { 
                type: "expandable-link-group", 
                text: "All Todos", 
                href: "#/",
                defaultExpanded: true,
                items: [
                  { type: "link", text: "Completed", href: "#/completed" },
                  { type: "link", text: "Pending", href: "#/pending" },
                ]
              },
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
                    rowData={filteredTodos}
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
                  © 2025 Todo Manager. All rights reserved.
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
