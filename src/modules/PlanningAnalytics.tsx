import {
  SpaceBetween,
  Container,
  TextContent,
  Header,
  BreadcrumbGroup,
  Button,
  StatusIndicator,
  Flashbar,
} from "@cloudscape-design/components";
import { useState, useRef } from "react";
import { apiClient } from "../utils/apiClient";

export function PlanningAnalytics() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ message?: string; [key: string]: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (item: { type: string; content: string; id?: string }) => {
    const id = item.id || `note-${Date.now()}`;
    setNotifications([
      {
        ...item,
        id,
        dismissible: true,
        onDismiss: () => setNotifications([]),
      },
    ]);
  };

  const checkExecution = async (executionId: string) => {
    setChecking(true);
    setStatus("Checking execution status...");

    const poll = async (): Promise<boolean> => {
      const checkRes = await apiClient.get<{ status?: string; result?: any; [key: string]: any }>(
        `check?executionId=${executionId}`
      );

      if (!checkRes.success) {
        setError(checkRes.error || "Failed to check status");
        showNotification({ type: "error", content: checkRes.error || "Status check failed" });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setChecking(false);
        return false;
      }

      const executionStatus = checkRes.data?.status;
      const executionResult = checkRes.data?.result;

      if (executionStatus === "SUCCEEDED" || executionStatus === "SUCCESS") {
        setStatus("Execution completed successfully!");
        setResult(executionResult || checkRes.data);
        showNotification({ type: "success", content: "Execution completed successfully!" });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setChecking(false);
        return false;
      } else if (executionStatus === "FAILED" || executionStatus === "FAILURE") {
        setError(`Execution failed: ${checkRes.data?.error || "Unknown error"}`);
        showNotification({ type: "error", content: `Execution failed: ${checkRes.data?.error || "Unknown error"}` });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setChecking(false);
        return false;
      } else {
        setStatus(`Status: ${executionStatus || "pending"}...`);
        return true;
      }
    };

    // Poll immediately, then every 2 seconds
    const shouldContinue = await poll();
    if (!shouldContinue) return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(poll, 2000);
  };

  const triggerAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(null);
    setNotifications([]);

    const res = await apiClient.post<{ executionId?: string; message?: string; [key: string]: any }>(
      "trigger",
      { message: "Test" },
      undefined
    );

    if (res.success && res.data?.executionId) {
      showNotification({ type: "success", content: `Trigger initiated with ID: ${res.data.executionId}` });
      setLoading(false);
      await checkExecution(res.data.executionId);
    } else {
      setError(res.error || `Request failed with status ${res.status}`);
      showNotification({ type: "error", content: res.error || `Request failed with status ${res.status}` });
      setLoading(false);
    }
  };

  return (
    <SpaceBetween size="m">
      <div style={{ padding: "0" }}>
        <BreadcrumbGroup
          items={[
            { text: "Workspace", href: "#/" },
            { text: "Planning & Analytics", href: "#/planning-analytics" }
          ]}
        />
      </div>
      <div style={{ padding: "0" }}>
        <Container header={<Header variant="h2">Planning & Analytics</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <Flashbar items={notifications} />
            <SpaceBetween size="s" direction="horizontal">
              <Button onClick={triggerAnalysis} variant="primary" iconName="refresh" disabled={loading || checking}>
                Trigger Analysis
              </Button>
              {(loading || checking) && <StatusIndicator type="in-progress">{status || "Running…"}</StatusIndicator>}
            </SpaceBetween>
            {error && (
              <StatusIndicator type="error">
                {error}
              </StatusIndicator>
            )}
            {result && (
              <TextContent>
                <h3>Response</h3>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{JSON.stringify(result, null, 2)}
                </pre>
              </TextContent>
            )}
          </SpaceBetween>
        </Container>
      </div>
    </SpaceBetween>
  );
}
