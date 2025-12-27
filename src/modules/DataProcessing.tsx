import {
  SpaceBetween,
  Container,
  TextContent,
  Header,
  BreadcrumbGroup,
  Button,
  StatusIndicator,
  Flashbar,
  Select,
  Input,
  FormField,
  Textarea,
} from "@cloudscape-design/components";
import { useState, useRef } from "react";
import { apiClient } from "../utils/apiClient";

interface DataProcessingProps {
  onNavigateHome?: () => void;
}

export function DataProcessing({ onNavigateHome }: DataProcessingProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ message?: string; [key: string]: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [processType, setProcessType] = useState<string>("parallel");
  const [itemListInput, setItemListInput] = useState<string>("");
  const [maxConcurrency, setMaxConcurrency] = useState<string>("");
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
      const checkRes = await apiClient.get<{ status?: string; output?: any; [key: string]: any }>(
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
      const executionOutput = checkRes.data?.output;

      if (executionStatus === "SUCCEEDED") {
        setStatus("Execution completed successfully!");
        setResult(executionOutput || checkRes.data);
        showNotification({ type: "success", content: "Execution completed successfully!" });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setChecking(false);
        return false;
      } else if (executionStatus === "FAILED") {
        setError(`Execution failed: ${checkRes.data?.cause || "Unknown error"}`);
        showNotification({ type: "error", content: `Execution failed: ${checkRes.data?.cause || "Unknown error"}` });
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setChecking(false);
        return false;
      } else if (executionStatus === "RUNNING") {
        setStatus("Execution in progress...");
        return true;
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

    // Parse items from input - support both comma-separated and line-separated
    const items = itemListInput
      .split(/[,\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) {
      setError("Please enter at least one item");
      showNotification({ type: "error", content: "Please enter at least one item" });
      setLoading(false);
      return;
    }

    const requestPayload = {
      processType: processType,
      items: items,
    };

    // Only add maxConcurrency if it's provided and valid
    if (maxConcurrency.trim()) {
      const concurrency = parseInt(maxConcurrency, 10);
      if (!isNaN(concurrency) && concurrency > 0) {
        (requestPayload as any).maxConcurrency = concurrency;
      }
    }

    const res = await apiClient.post<{ executionId?: string; message?: string; [key: string]: any }>(
      "trigger",
      requestPayload,
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
            { text: "MyWorkspace", href: "#/" },
            { text: "Data Processing", href: "#/data-processing" }
          ]}
          onFollow={(event) => {
            event.preventDefault();
            if (event.detail.href === "#/" && onNavigateHome) {
              onNavigateHome();
            }
          }}
        />
      </div>
      <div style={{ padding: "0" }}>
        <Container header={<Header variant="h2">Data Processing</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <Flashbar items={notifications} />
            <FormField label="Items">
              <Textarea
                value={itemListInput}
                onChange={(event) => setItemListInput(event.detail.value)}
                placeholder="Enter a list of items (comma-separated or one per line)"
                rows={6}
              />
            </FormField>
            <SpaceBetween size="s" direction="horizontal">
              <FormField label="Process Type">
                <Select
                  selectedOption={{ label: processType.charAt(0).toUpperCase() + processType.slice(1), value: processType }}
                  onChange={(event) => setProcessType(event.detail.selectedOption.value || "parallel")}
                  options={[
                    { label: "Parallel", value: "parallel" },
                    { label: "Loop", value: "loop" },
                    { label: "Whole", value: "whole" },
                  ]}
                  selectedAriaLabel="Select process type"
                />
              </FormField>
              <FormField label="Max Concurrency">
                <Input
                  value={maxConcurrency}
                  onChange={(event) => setMaxConcurrency(event.detail.value)}
                  placeholder="Optional"
                  type="number"
                />
              </FormField>
            </SpaceBetween>
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
