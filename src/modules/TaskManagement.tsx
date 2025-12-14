import { useEffect, useState } from "react";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  Header,
  Button,
  SpaceBetween,
  Container,
  BreadcrumbGroup,
  Select,
} from "@cloudscape-design/components";

const client = generateClient<Schema>();

interface TaskManagementProps {
  utcMode: Set<string>;
  setUtcMode: (mode: Set<string>) => void;
}

export function TaskManagement({ utcMode, setUtcMode }: TaskManagementProps) {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [filter, setFilter] = useState<string>("all");

  const getTimezoneName = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || "Local";
  };

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "completed") return todo.state === "completed";
    if (filter === "pending") return todo.state === "pending" || !todo.state;
    return true;
  });

  function createTodo() {
    const content = window.prompt("Task content");
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

  const formatDate = (date: Date | string | undefined, isUtc: boolean = false) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isUtc) {
      return dateObj.toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
    }
    const localTz = getTimezoneName();
    return dateObj.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }) + " " + localTz;
  };

  const columnDefs: ColDef<Schema["Todo"]["type"]>[] = [
    {
      field: "id" as const,
      headerName: "ID",
      flex: 0.7,
      minWidth: 140,
      cellRenderer: (params: { value: string }) => (
        <span style={{ fontFamily: "monospace", fontSize: "0.75em", color: "#333", wordBreak: "break-all" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "content" as const,
      headerName: "Content",
      flex: 3,
      minWidth: 250,
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
      flex: 1.2,
      minWidth: 140,
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
      flex: 1.8,
      minWidth: 220,
      cellRenderer: (params: ICellRendererParams<Schema["Todo"]["type"]>) => {
        const dateKey = `created-${params.data?.id}`;
        const isUtc = utcMode.has(dateKey);
        return (
          <span
            onClick={() => {
              const newUtcMode = new Set(utcMode);
              if (isUtc) {
                newUtcMode.delete(dateKey);
              } else {
                newUtcMode.add(dateKey);
              }
              setUtcMode(newUtcMode);
            }}
            style={{ cursor: "pointer", color: "#0972d3", textDecoration: "underline" }}
            title="Click to toggle timezone"
          >
            {formatDate(params.value, isUtc)}
          </span>
        );
      },
    },
    {
      field: "updatedAt" as const,
      headerName: "Updated",
      flex: 1.8,
      minWidth: 220,
      cellRenderer: (params: ICellRendererParams<Schema["Todo"]["type"]>) => {
        const dateKey = `updated-${params.data?.id}`;
        const isUtc = utcMode.has(dateKey);
        return (
          <span
            onClick={() => {
              const newUtcMode = new Set(utcMode);
              if (isUtc) {
                newUtcMode.delete(dateKey);
              } else {
                newUtcMode.add(dateKey);
              }
              setUtcMode(newUtcMode);
            }}
            style={{ cursor: "pointer", color: "#0972d3", textDecoration: "underline" }}
            title="Click to toggle timezone"
          >
            {formatDate(params.value, isUtc)}
          </span>
        );
      },
    },
    {
      headerName: "Actions",
      flex: 0.9,
      minWidth: 100,
      cellRenderer: (params: { data: Schema["Todo"]["type"] }) => (
        <Button
          onClick={() => deleteTodo(params.data.id)}
          variant="inline-icon"
          iconName="remove"
          ariaLabel="Delete task"
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="m">
      <div style={{ padding: "0" }}>
        <BreadcrumbGroup
          items={[
            { text: "Workspace", href: "#/" },
            { text: "Task Management", href: "#/task-management" }
          ]}
        />
      </div>
      <div style={{ padding: "0" }}>
        <Container header={<Header variant="h2">Tasks</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <SpaceBetween size="s" direction="horizontal">
              <Button onClick={createTodo} variant="primary" iconName="add-plus">
                Create Task
              </Button>
              <Select
                selectedOption={{ label: filter === "all" ? "All" : filter === "completed" ? "Completed" : "Pending", value: filter }}
                onChange={(event) => setFilter(event.detail.selectedOption.value || "all")}
                options={[
                  { label: "All", value: "all" },
                  { label: "Completed", value: "completed" },
                  { label: "Pending", value: "pending" },
                ]}
                selectedAriaLabel="Filter tasks"
              />
            </SpaceBetween>
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
      </div>
    </SpaceBetween>
  );
}
